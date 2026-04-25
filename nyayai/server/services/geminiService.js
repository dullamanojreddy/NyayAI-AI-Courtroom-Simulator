const { GoogleGenerativeAI } = require('@google/generative-ai');

let currentApiIndex = 0;

async function runGemini(systemPrompt, userPrompt) {
  const googleApiKeys = process.env.REACT_APP_GOOGLE_API_KEYS ? process.env.REACT_APP_GOOGLE_API_KEYS.split(',').map(k => k.trim()).filter(Boolean) : [];
  if (googleApiKeys.length === 0) {
    console.error('No Google API keys found in .env');
    return null;
  }

  let attempts = 0;
  while (attempts < googleApiKeys.length) {
    const genAI = new GoogleGenerativeAI(googleApiKeys[currentApiIndex]);
    try {
      // Upgraded to gemini-3-flash-preview to bypass the 503 congestion on older models and improve accuracy
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const fullPrompt = `${systemPrompt}\n\nUser Prompt:\n${userPrompt}`;
      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (error) {
      console.error(`Gemini API error (Key ${currentApiIndex}):`, error.message);
      if (error.status === 429 || error.message.includes('429') || error.message.includes('503') || error.message.includes('404') || error.message.includes('quota') || error.message.includes('limit') || error.message.includes('API key')) {
        currentApiIndex = (currentApiIndex + 1) % googleApiKeys.length;
        attempts++;
      } else {
        return null;
      }
    }
  }
  return null;
}

function parseJSON(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

function parseJSONArray(text, fallback) {
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    return fallback;
  } catch {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        const parsed = JSON.parse(text.slice(start, end + 1));
        return Array.isArray(parsed) ? parsed : fallback;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

function fallbackQuestions(caseSummary = []) {
  const fact = caseSummary[0] || 'the stated allegation';
  return [
    `Where is documentary proof supporting "${fact}"?`,
    'Can you establish exact date and time of the incident?',
    'Who directly witnessed the event and can testify independently?',
    'Can you prove legal intent behind the accused conduct?',
    'Is there any contradiction between your written complaint and records?',
    'Have digital records been preserved in original unedited form?',
    'Can you show chain of custody for screenshots or messages?',
    'Was any legal notice or complaint filed promptly?',
    'Do records identify the accused beyond reasonable doubt?',
    'Can you connect each allegation to a specific IPC ingredient?',
    'Is there any prior dispute that may affect credibility?',
    'Can you prove financial loss or legal injury with evidence?',
    'Have you produced device metadata or transaction references?',
    'Can you rebut possible defenses of fabrication or coercion?',
    'Which independent evidence corroborates your statement?'
  ];
}

async function generateCounterQuestions({ caseDetails, caseSummary, caseType, applicableLaws = [] }) {
  const systemPrompt = `Generate 15 strong legal counter-questions based on the case.
Do NOT repeat questions.
Focus strictly on evidence, intent, contradictions, and legal validity relevant to this exact case.
IMPORTANT: Do NOT generate completely irrelevant questions (e.g., no road/weather questions in a murder/financial dispute case). Ensure questions match the case type precisely.
Return ONLY a JSON array of strings (15 items).`;

  const userPrompt = JSON.stringify({
    caseType,
    applicableLaws,
    caseSummary,
    caseDetails
  });

  const text = await runGemini(systemPrompt, userPrompt);
  const fallback = fallbackQuestions(caseSummary);
  const parsed = parseJSONArray(text, fallback);

  const cleaned = parsed
    .map((q) => String(q || '').trim())
    .filter(Boolean)
    .filter((q, idx, arr) => arr.findIndex((v) => v.toLowerCase() === q.toLowerCase()) === idx);

  if (cleaned.length >= 10) return cleaned.slice(0, 20);

  const merged = [...cleaned, ...fallback]
    .filter((q, idx, arr) => arr.findIndex((v) => v.toLowerCase() === q.toLowerCase()) === idx)
    .slice(0, 15);

  return merged;
}

function inferRiskSectionsFromText(text) {
  const t = String(text || '').toLowerCase();
  const risk = [];
  if (/(killed|kill|murder|death)/.test(t)) risk.push('IPC 302');
  if (/(assault|attack|hurt|injury|harass)/.test(t)) risk.push('IPC 323/324/354 (as applicable)');
  if (/(threat|intimidat)/.test(t)) risk.push('IPC 503/506');
  if (/(cheat|fraud|scam)/.test(t)) risk.push('IPC 420');
  return Array.from(new Set(risk));
}

function clampProbability(value, fallback = 50) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function inferUserRoleFromNarration(caseDetails = {}, qaPairs = []) {
  const explicit = String(caseDetails.role || '').toLowerCase();
  const transcript = [
    String(caseDetails.situation || ''),
    ...qaPairs.map((p) => `${p.question} ${p.answer}`)
  ].join(' ').toLowerCase();

  const accusedSignals = [
    /\bi\s+(killed|kill|struck|hit|assaulted|attacked|stabbed)\b/,
    /\bi\s+(carried|brought)\s+.*\b(rod|knife|weapon|gun)\b/,
    /\bi\s+(threw|disposed|hid)\s+.*\b(rod|weapon|knife|gun)\b/,
    /\b(complainant|owner|victim)\s+alleged\s+that\s+i\s+(demanded|took|accepted|received)\b/,
    /\bi\s+(deny|denied)\s+(taking|accepting|demanding|receiving)\b/,
    /\bi\s+state\s+that\s+the\s+allegation\s+was\s+(false|fabricated)\b/,
    /\baccused\s+(individual|officer|person)\b/
  ];

  const complainantSignals = [
    /\bi\s+was\s+(attacked|assaulted|injured|threatened|cheated|defrauded)\b/,
    /\bhe\s+(attacked|assaulted|injured|threatened|cheated)\s+me\b/
  ];

  if (accusedSignals.some((re) => re.test(transcript))) {
    return { userRole: 'ACCUSED', roleSource: 'inferred' };
  }
  if (complainantSignals.some((re) => re.test(transcript))) {
    return { userRole: 'COMPLAINANT', roleSource: 'inferred' };
  }

  if (['accused', 'defence', 'defense', 'defendant', 'respondent'].includes(explicit)) {
    return { userRole: 'ACCUSED', roleSource: 'explicit' };
  }
  if (['complainant', 'prosecution', 'plaintiff', 'petitioner', 'victim', 'state'].includes(explicit)) {
    return { userRole: 'COMPLAINANT', roleSource: 'explicit' };
  }

  return { userRole: 'COMPLAINANT', roleSource: 'default' };
}

function countMatches(text, patterns = []) {
  const t = String(text || '').toLowerCase();
  return patterns.reduce((sum, re) => sum + (re.test(t) ? 1 : 0), 0);
}

function isLikelyDefensiveLaw(lawText) {
  const t = String(lawText || '').toLowerCase();
  return /(exception|proviso|burden of proof|proof lies on|benefit of doubt|presumption|due process|right|constitutional|self-defense|private defense|alibi|mitigation|consent|limitation|acquittal|technical defense|admissibility)/.test(t);
}

function isLikelyChargingLaw(lawText) {
  const t = String(lawText || '').toLowerCase();
  return /(punishment|offence|offense|murder|criminal misconduct|house-trespass|cheating|rape|assault|ipc\s*\d+|section\s*\d+.*(ipc|bns|pc act|prevention of corruption))/i.test(t) && !isLikelyDefensiveLaw(t);
}

function normalizeLawBuckets(userRole, favorableLaws = [], opposingLaws = []) {
  if (userRole !== 'ACCUSED') {
    return {
      favorableLaws,
      opposingLaws
    };
  }

  const safeFavorable = [];
  const movedToOpposing = [];

  for (const law of favorableLaws) {
    if (isLikelyChargingLaw(law)) movedToOpposing.push(law);
    else safeFavorable.push(law);
  }

  return {
    favorableLaws: safeFavorable,
    opposingLaws: Array.from(new Set([...(opposingLaws || []), ...movedToOpposing]))
  };
}

function calibrateVerdictFromEvidence({ roleInfo, transcriptBlob, parsed, normalizedProbability, normalizedVerdict }) {
  const evidenceAgainstPatterns = [
    /\bcctv\b|surveillance/, /recovered.*(weapon|rod|cash)|disclosure statement|forensic|dna|fingerprint/,
    /confession|admission|medical evidence|post-mortem|money trail|digital logs|documents? prove/, /independent witness|eyewitness/
  ];
  const evidenceForUserPatterns = [
    /no\s+(audio|video|witness|recovery|money trail|digital evidence|documents)/, /contradiction|inconsistent|doubtful/,
    /false implication|retaliatory|malice|fabricated/, /burden of proof|benefit of doubt|demand and acceptance not proved/
  ];

  const combinedText = [
    transcriptBlob,
    ...(parsed.strengths || []),
    ...(parsed.weaknesses || []),
    ...(parsed.suggestions || [])
  ].join(' ');

  const against = countMatches(combinedText, evidenceAgainstPatterns);
  const forUser = countMatches(combinedText, evidenceForUserPatterns);

  if (roleInfo.userRole === 'ACCUSED' && against >= 3 && forUser <= 1) {
    const p = Math.min(30, normalizedProbability > 30 ? 100 - normalizedProbability : normalizedProbability);
    return { winningProbability: clampProbability(p, 25), finalVerdict: 'LOSE' };
  }

  if (roleInfo.userRole === 'ACCUSED' && forUser >= 3 && against <= 1) {
    const p = Math.max(70, normalizedProbability < 70 ? 100 - normalizedProbability : normalizedProbability);
    return { winningProbability: clampProbability(p, 80), finalVerdict: 'WIN' };
  }

  if (Math.abs(against - forUser) <= 1 && against + forUser >= 2) {
    const p = Math.min(60, Math.max(40, normalizedProbability));
    return {
      winningProbability: clampProbability(p, 50),
      finalVerdict: p >= 50 ? 'WIN' : 'LOSE'
    };
  }

  return {
    winningProbability: normalizedProbability,
    finalVerdict: normalizedVerdict
  };
}

function getIncriminatingEvidenceScore(text) {
  const t = String(text || '').toLowerCase();
  let score = 0;
  if (/\bcctv\b|surveillance/.test(t)) score += 1;
  if (/recovered.*(rod|weapon)|weapon.*recovered|disclosure statement|section 27/.test(t)) score += 1;
  if (/declared dead|death due to|head injuries|medical evidence/.test(t)) score += 1;
  if (/multiple times|multiple blows|struck him/.test(t)) score += 1;
  if (/carried an iron rod|brought.*weapon|premeditation/.test(t)) score += 1;
  return score;
}

function getWeakEvidenceScore(text) {
  const t = String(text || '').toLowerCase();
  let score = 0;

  if (/no\s+(audio|video|audio recordings|written messages|witness|witnesses|digital communications)/.test(t)) score += 1;
  if (/no\s+trap\s+operation|no\s+marked\s+currency|marked\s+currency\s+was\s+not\s+recovered/.test(t)) score += 1;
  if (/cctv\s+.*(not\s+functioning|non-functional|was\s+not\s+working|unavailable)/.test(t)) score += 1;
  if (/no\s+unusual\s+deposits|bank\s+accounts\s+showed\s+no\s+unusual\s+deposits/.test(t)) score += 1;
  if (/no\s+independent\s+witness/.test(t)) score += 1;
  if (/lack\s+of\s+corroboration|absence\s+of\s+trap\s+operation|demand\s+and\s+acceptance\s+is\s+not\s+proved/.test(t)) score += 1;

  return score;
}

async function analyzeVerdictEngine({ caseDetails, qaPairs = [], caseType, applicableLaws = [] }) {
  const roleInfo = inferUserRoleFromNarration(caseDetails, qaPairs);

  const systemPrompt = `You are the Final Legal Verdict Engine for NyayAI.

Analyze every case generically, regardless of topic (murder, corruption, fraud, harassment, cybercrime, civil dispute, contract, property, family, finance, workplace, etc.).

Your task is to determine the result from the USER'S POINT OF VIEW.

UNIVERSAL VERDICT RULE:
- WIN = User likely succeeds / gets acquittal / claim succeeds / defense stronger
- LOSE = User likely convicted / liable / claim defeated / prosecution stronger

CORE DECISION LOGIC:
1. If strong direct or corroborated evidence proves wrongdoing by user, user should usually LOSE.
2. If evidence is weak, missing, contradictory, illegally obtained, uncorroborated, doubtful, user should usually WIN.
3. Criminal cases require proof beyond reasonable doubt.
4. Civil cases require preponderance of probabilities.
5. Consider burden of proof, mens rea, causation, procedure, admissibility, defenses, delay, false implication, self-defense, consent, alibi, mitigation, compliance, due process.
6. Never decide only from accusation. Decide from evidence quality.
7. If mixed evidence, give realistic probability in the 40-60 range.

LAW MAPPING RULES:
- Laws Against User = laws likely to be used against user based on allegations + evidence.
- Favorable Laws = defenses, procedural safeguards, burden-of-proof principles, exceptions, rights, technical defenses, mitigating laws benefiting user.
- Never place charging criminal sections in Favorable Laws unless it is an exception/proviso that helps user.
- Use correct domain-specific laws.

OUTPUT QUALITY RULES:
- Verdict must match reasoning.
- Probability must match evidence strength.
- If evidence overwhelmingly strong against user: 0-30%.
- If evidence weak against user: 70-95%.
- If balanced: 40-60%.

ANTI-ERROR RULES:
- Do not invert verdict labels.
- Do not favor user emotionally.
- Do not punish user merely for accusation.
- Do not ignore strong evidence.
- Do not mention irrelevant laws.

Think like an experienced judge + investigator + lawyer. Decide objectively from the full case record.

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "winningProbability": <number 0-100>,
  "favorableLaws": ["<Only valid laws supporting user>"],
  "opposingLaws": ["<Only valid laws against user>"],
  "strengths": ["<Strongest points helping user>"],
  "weaknesses": ["<Strongest points hurting user>"],
  "suggestions": ["<Realistic next legal steps>"],
  "finalReasoningSummary": "<Short objective summary>",
  "finalVerdict": "WIN" | "LOSE" | "UNCERTAIN"
}`;

  const userPrompt = JSON.stringify({ caseType, applicableLaws, userRole: roleInfo.userRole, caseDetails, qaPairs });
  const text = await runGemini(systemPrompt, userPrompt);

  const transcriptBlob = [
    String(caseDetails?.situation || ''),
    ...qaPairs.map((p) => `${p.question} ${p.answer}`)
  ].join(' ');

  const fallback = {
    winningProbability: roleInfo.userRole === 'ACCUSED' ? 35 : 58,
    favorableLaws: Array.isArray(applicableLaws) && applicableLaws.length ? applicableLaws : ['IPC 420'],
    opposingLaws: inferRiskSectionsFromText(transcriptBlob),
    strengths: [
      'Core facts are presented in a chronological structure.',
      'At least one evidentiary reference is mentioned.'
    ],
    weaknesses: [
      'Some allegations lack independent corroboration.',
      'Intent and legal ingredient mapping is incomplete in parts.'
    ],
    suggestions: [
      'Provide original transaction proof and metadata-backed screenshots.',
      'Add timeline with dates, persons, and communication references.',
      'Attach witness statements or independent corroborating records.'
    ],
    finalReasoningSummary: 'Evidence quality was assessed from user-side perspective and mapped to realistic burden-of-proof standards.',
    finalVerdict: roleInfo.userRole === 'ACCUSED' ? 'LOSE' : 'WIN'
  };

  const parsed = parseJSON(text, fallback);
  const normalizedProbability = clampProbability(parsed.winningProbability, fallback.winningProbability);
  const normalizedVerdict = ['WIN', 'LOSE', 'UNCERTAIN'].includes(String(parsed.finalVerdict || '').toUpperCase())
    ? String(parsed.finalVerdict).toUpperCase()
    : fallback.finalVerdict;

  const evidenceScore = getIncriminatingEvidenceScore(transcriptBlob);
  const weakEvidenceScore = getWeakEvidenceScore([
    transcriptBlob,
    ...(parsed.strengths || []),
    ...(parsed.weaknesses || [])
  ].join(' '));

  const lawBuckets = normalizeLawBuckets(
    roleInfo.userRole,
    Array.isArray(parsed.favorableLaws) ? parsed.favorableLaws : fallback.favorableLaws,
    Array.isArray(parsed.opposingLaws) ? parsed.opposingLaws : fallback.opposingLaws
  );

  const calibrated = calibrateVerdictFromEvidence({
    roleInfo,
    transcriptBlob,
    parsed,
    normalizedProbability,
    normalizedVerdict
  });

  if (roleInfo.userRole === 'ACCUSED' && evidenceScore >= 3) {
    const safeProbability = normalizedProbability > 45 ? Math.max(5, 100 - normalizedProbability) : normalizedProbability;
    return {
      ...parsed,
      winningProbability: safeProbability,
      finalVerdict: safeProbability >= 50 ? 'WIN' : 'LOSE'
    };
  }

  if (roleInfo.userRole === 'ACCUSED' && weakEvidenceScore >= 3 && evidenceScore < 3) {
    const safeProbability = Math.max(70, normalizedProbability >= 50 ? normalizedProbability : 100 - normalizedProbability);
    return {
      ...parsed,
      favorableLaws: lawBuckets.favorableLaws,
      opposingLaws: lawBuckets.opposingLaws,
      winningProbability: safeProbability,
      finalReasoningSummary: String(parsed.finalReasoningSummary || fallback.finalReasoningSummary),
      finalVerdict: 'WIN'
    };
  }

  return {
    ...parsed,
    favorableLaws: lawBuckets.favorableLaws,
    opposingLaws: lawBuckets.opposingLaws,
    winningProbability: calibrated.winningProbability,
    finalReasoningSummary: String(parsed.finalReasoningSummary || fallback.finalReasoningSummary),
    finalVerdict: calibrated.finalVerdict
  };
}

async function getOpposingArgument({ caseType, userArgument }) {
  const questions = await generateCounterQuestions({
    caseType,
    caseSummary: [userArgument],
    caseDetails: { situation: userArgument },
    applicableLaws: []
  });
  return questions[0] || 'Where is the direct legal proof for this allegation?';
}

async function getJudgeRemark({ roundNum = 1 }) {
  const remarks = [
    'The Court asks both sides to map each fact to statutory ingredients.',
    'Order! Evidence quality and timeline clarity will weigh heavily.',
    'The Court notes that corroboration is required for disputed facts.',
    'Counsel should identify legal sections with precision.'
  ];
  return remarks[(Number(roundNum) - 1) % remarks.length];
}

async function scoreArgument() {
  return {
    legalRelevance: 6,
    logicalStructure: 6,
    tone: 7,
    persuasiveness: 6,
    total: 61.0,
    feedback: 'Use concrete evidence and map it directly to legal ingredients.'
  };
}

async function getVerdict({ caseType, transcript, applicableLaws = [] }) {
  const result = await analyzeVerdictEngine({
    caseDetails: { situation: transcript },
    qaPairs: [],
    caseType,
    applicableLaws
  });
  return {
    winner: result.finalVerdict === 'WIN' ? 'user' : 'opponent',
    confidence: `${result.winningProbability}%`,
    winningChance: `${result.winningProbability}%`,
    reasoning: result.finalReasoningSummary || (result.strengths || []).slice(0, 3).join(' '),
    favourableSections: result.favorableLaws || [],
    riskSections: result.opposingLaws || [],
    transcriptSummary: 'Structured analysis was generated from available case facts.',
    keyTurningPoint: 'Evidence sufficiency versus unanswered counter-questions.',
    realWorldAdvice: (result.suggestions || []).slice(0, 1)[0] || 'Consult a licensed advocate with all records.',
    improvements: result.suggestions || []
  };
}

async function getHint({ applicableLaws }) {
  return {
    suggestedLaw: Array.isArray(applicableLaws) && applicableLaws.length ? applicableLaws[0] : 'IPC 420',
    argumentStructure: 'State fact, cite section, attach evidence, request relief.',
    anticipateCounter: 'Opponent will challenge proof authenticity and legal intent.',
    keyPhrase: 'The record directly satisfies the statutory ingredients.'
  };
}

async function generateQAPairs({ caseDetails, caseSummary, caseType, applicableLaws = [] }) {
  const systemPrompt = `You are NyayAI, a professional courtroom AI assistant.

You are provided with a detailed case text as context. All questions should be answered strictly based on this case text.

Instructions:

1. Read the entire case text provided. Treat it as the **only source of truth**.
2. Answer ONLY based on the information in this case. Do not assume, invent, or repeat text verbatim unless quoting evidence.
3. For each counter-question:
   - Answer using evidence from the case text.
   - Expand short phrases or headers into **full, professional sentences**.
   - Never repeat the exact same answer twice. If the same fact is referenced, rephrase or mention a new angle of the evidence.
   - If the case text does not provide proof for a question, respond exactly: "No valid answer available."
4. Your answers can reference evidence actually present in the text (e.g., timestamps, medical/police reports, CCTV, communications, etc.).
5. DO NOT generate irrelevant questions unrelated to the case type. The questions MUST be strictly relevant to the specific facts.
   - Example: Murder/Financial Dispute → No road/weather questions.
   - Example: Contract Breach → No medical questions.
5. Maintain a professional courtroom style.
6. Provide **full, coherent sentences**; do not give fragments.
7. Avoid copying section headers like "Incident Overview" or "Context & Sequence" as answers.
8. Always ensure each answer is unique and contextual.
9. Provide varied phrasing, combine multiple evidence points if possible, and highlight strengths/weaknesses from the case text.
10. Produce exactly 15 rigorous courtroom-style Question & Answer pairs based entirely on the provided Context.

Example:

Case Text:
"I was driving from A to B on 21st July 2025. A pedestrian, Mr. X, crossed the road. GPS data shows speed within limits. Witnesses are my passengers."

Question:
"Who witnessed the event independently?"

Answer:
"My passengers, who were in the car with me, can provide testimony confirming my speed and attentive driving at the time of the incident."

Return ONLY a valid JSON array of exactly 15 objects, each containing a "question" string and an "answer" string.`;

  const userPrompt = `Case Context details:
Type: ${caseType || 'General'}
Applicable Laws: ${applicableLaws.join(', ')}

Full Case Details / Source Text:
${caseDetails.situation ? caseDetails.situation : JSON.stringify(caseDetails)}`;

  const text = await runGemini(systemPrompt, userPrompt);
  const parsed = parseJSONArray(text, null);

  if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].question) {
    return parsed.slice(0, 15);
  }
  return null;
}

module.exports = {
  generateCounterQuestions,
  analyzeVerdictEngine,
  getOpposingArgument,
  getJudgeRemark,
  scoreArgument,
  getVerdict,
  getHint,
  generateQAPairs
};
