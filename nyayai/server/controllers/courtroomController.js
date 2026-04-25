const Session = require('../models/Session');
const { generateCounterQuestions, analyzeVerdictEngine, generateQAPairs } = require('../services/geminiService');
const NyayAISimulator = require('../services/nyayAISimulator');

function normalizeSentence(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function splitFacts(text) {
  return String(text || '')
    .split(/\r?\n|[.;]/)
    .map((line) => normalizeSentence(line.replace(/^[-*•]\s*/, '')))
    .filter(Boolean);
}

function generateCaseSummary(caseDetails = {}) {
  const raw = splitFacts(caseDetails.situation || '');
  const bullets = [];

  if (caseDetails.caseTitle) {
    bullets.push(`Case context: ${normalizeSentence(caseDetails.caseTitle)}`);
  }

  for (const fact of raw) {
    if (!bullets.some((b) => b.toLowerCase() === fact.toLowerCase())) {
      bullets.push(fact);
    }
  }

  return bullets.slice(0, 8);
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !['the', 'is', 'a', 'an', 'of', 'to', 'and', 'or', 'in', 'on', 'for', 'with', 'by', 'this', 'that'].includes(w));
}

function generateAnswer(question, caseSummary = [], usedBullets = new Set()) {
  const qWords = new Set(tokenize(question));
  let best = '';
  let bestScore = 0;

  for (const bullet of caseSummary) {
    if (usedBullets.has(bullet)) continue;
    const words = tokenize(bullet);
    const score = words.reduce((sum, w) => (qWords.has(w) ? sum + 1 : sum), 0);
    if (score > bestScore) {
      bestScore = score;
      best = bullet;
    }
  }

  if (bestScore > 0) {
    usedBullets.add(best);
    return best;
  }
  return 'No valid answer available';
}

function buildTranscriptFromQAPairs(qaPairs = []) {
  const transcript = [];
  qaPairs.forEach((pair) => {
    transcript.push({ role: 'opponent', text: pair.question });
    transcript.push({ role: 'user', text: pair.answer });
  });
  return transcript;
}

function clampProbability(value, fallback = 50) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

exports.start = async (req, res) => {
  try {
    const { sessionId, caseDetails = {}, courtConfig = {} } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const existing = await Session.findOne({ sessionId });
    if (existing) {
      return res.status(400).json({ message: 'sessionId already exists' });
    }

    const session = await Session.create({
      userId: req.user.userId,
      sessionId,
      caseTitle: caseDetails.caseTitle || 'Untitled Case',
      caseType: caseDetails.caseType || 'GENERAL_DISPUTE',
      applicableLaws: Array.isArray(caseDetails.applicableLaws) ? caseDetails.applicableLaws : [],
      caseDetails,
      courtConfig,
      status: 'active',
      rounds: [],
      transcript: [],
      caseSummary: [],
      qaPairs: []
    });

    return res.status(201).json(session);
  } catch (error) {
    return res.status(500).json({ message: 'Start session failed', error: error.message });
  }
};

exports.generateQuestions = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const caseSummary = generateCaseSummary(session.caseDetails || {});
    
    let qaPairs = [];
    let questions = [];

    const llmPairs = await generateQAPairs({
      caseDetails: session.caseDetails || {},
      caseSummary,
      caseType: session.caseType,
      applicableLaws: session.applicableLaws || []
    });

    if (llmPairs && llmPairs.length > 0) {
      qaPairs = llmPairs.map((pair) => ({
        question: normalizeSentence(pair.question),
        answer: pair.answer ? normalizeSentence(pair.answer) : 'No valid answer available'
      }));
      questions = qaPairs.map(p => p.question);
    } else {
      questions = await generateCounterQuestions({
        caseDetails: session.caseDetails || {},
        caseSummary,
        caseType: session.caseType,
        applicableLaws: session.applicableLaws || []
      });

      const usedBullets = new Set();
      qaPairs = questions.map((question) => ({
        question: normalizeSentence(question),
        answer: generateAnswer(question, caseSummary, usedBullets)
      }));
    }

    session.caseSummary = caseSummary;
    session.qaPairs = qaPairs;
    session.transcript = buildTranscriptFromQAPairs(qaPairs);
    session.rounds = qaPairs.map((pair, idx) => ({
      roundNumber: idx + 1,
      userArgument: pair.answer,
      opposingArgument: pair.question,
      judgeRemark: '',
      score: pair.answer === 'No valid answer available' ? 2 : 7,
      breakdown: {
        legalRelevance: pair.answer === 'No valid answer available' ? 2 : 7,
        logicalStructure: 6,
        tone: 7,
        persuasiveness: pair.answer === 'No valid answer available' ? 3 : 6
      }
    }));
    session.totalScore = session.rounds.reduce((sum, r) => sum + Number(r.score || 0), 0);
    await session.save();

    return res.json({
      caseSummary,
      questions,
      qaPairs
    });
  } catch (error) {
    return res.status(500).json({ message: 'Question generation failed', error: error.message });
  }
};

exports.generateVerdict = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!Array.isArray(session.qaPairs) || session.qaPairs.length === 0) {
      return res.status(400).json({ message: 'Generate Q&A grid before verdict' });
    }

    const analysis = await analyzeVerdictEngine({
      caseDetails: session.caseDetails || {},
      qaPairs: session.qaPairs || [],
      caseType: session.caseType,
      applicableLaws: session.applicableLaws || []
    });

    const rawVerdict = String(analysis.finalVerdict || '').toUpperCase();
    const finalVerdict = ['WIN', 'LOSE', 'UNCERTAIN'].includes(rawVerdict) ? rawVerdict : 'UNCERTAIN';

    const verdict = {
      winningProbability: clampProbability(analysis.winningProbability, 50),
      favorableLaws: Array.isArray(analysis.favorableLaws) ? analysis.favorableLaws : [],
      opposingLaws: Array.isArray(analysis.opposingLaws) ? analysis.opposingLaws : [],
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
      finalReasoningSummary: String(analysis.finalReasoningSummary || ''),
      finalVerdict,
      transcript: session.qaPairs
    };

    session.verdict = verdict;
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    return res.json(verdict);
  } catch (error) {
    return res.status(500).json({ message: 'Verdict generation failed', error: error.message });
  }
};

exports.argue = async (req, res) => {
  return res.status(410).json({
    message: 'Chat argue flow is deprecated. Use /api/courtroom/qa-grid.'
  });
};

exports.verdict = async (req, res) => {
  return exports.generateVerdict(req, res);
};

exports.getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    return res.json(sessions);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch sessions', error: error.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch session', error: error.message });
  }
};

exports.simulateCourtroom = async (req, res) => {
  try {
    const { caseDetails } = req.body;
    if (!caseDetails || !Array.isArray(caseDetails) || caseDetails.length === 0) {
      return res.status(400).json({ message: 'caseDetails array is required' });
    }

    const apiKeys = process.env.REACT_APP_GOOGLE_API_KEYS ? process.env.REACT_APP_GOOGLE_API_KEYS.split(',').map(k => k.trim()).filter(Boolean) : [];
    if (apiKeys.length === 0) {
      return res.status(500).json({ message: 'No OpenAI API keys configured' });
    }

    const simulator = new NyayAISimulator(apiKeys);
    const simulation = await simulator.simulateCourtroom(caseDetails);

    return res.json({ simulation });
  } catch (error) {
    return res.status(500).json({ message: 'Simulation failed', error: error.message });
  }
};

module.exports.generateAnswer = generateAnswer;
module.exports.generateCaseSummary = generateCaseSummary;
