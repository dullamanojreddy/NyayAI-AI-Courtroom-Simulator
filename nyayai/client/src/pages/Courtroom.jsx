import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/api';
import { exportElementToPdf } from '../utils/pdfExport';

function Courtroom() {
  const sessionId = localStorage.getItem('nyayai_session_id');
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState([]);
  const [qaPairs, setQaPairs] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const verdictCardRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      if (!sessionId) {
        setError('No active session found. Start a new case first.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const { data: sessionData } = await api.get(`/session/${encodeURIComponent(sessionId)}`);
        setSession(sessionData);
        if (sessionData?.sessionId) {
          localStorage.setItem('nyayai_current_session_id', sessionData.sessionId);
        }

        if (Array.isArray(sessionData.caseSummary) && sessionData.caseSummary.length > 0 && Array.isArray(sessionData.qaPairs) && sessionData.qaPairs.length > 0) {
          setSummary(sessionData.caseSummary);
          setQaPairs(sessionData.qaPairs);
        } else {
          await buildQAGrid();
        }

        if (sessionData.verdict && sessionData.status === 'completed') {
          setVerdict(sessionData.verdict);
        }
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to load courtroom session.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [sessionId]);

  const buildQAGrid = async () => {
    if (!sessionId) return;
    setGenerating(true);
    setError('');
    try {
      const { data } = await api.post('/courtroom/qa-grid', { sessionId });
      setSummary(Array.isArray(data.caseSummary) ? data.caseSummary : []);
      setQaPairs(Array.isArray(data.qaPairs) ? data.qaPairs : []);
      setVerdict(null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to generate question-answer grid.');
    } finally {
      setGenerating(false);
    }
  };

  const finishAndGetVerdict = async () => {
    if (!sessionId) return;
    setFinishing(true);
    setError('');
    try {
      const { data } = await api.post('/courtroom/verdict-engine', { sessionId });
      setVerdict(data);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to generate verdict.');
    } finally {
      setFinishing(false);
    }
  };

  const transcriptRows = useMemo(() => {
    return qaPairs.map((pair, idx) => ({
      id: idx + 1,
      question: pair.question,
      answer: pair.answer
    }));
  }, [qaPairs]);

  const downloadVerdictPdf = async () => {
    if (!verdictCardRef.current) return;
    setDownloading(true);
    setError('');
    try {
      await exportElementToPdf(verdictCardRef.current, `nyayai-verdict-${sessionId || 'session'}.pdf`);
    } catch (e) {
      setError(e?.message || 'Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container-fluid px-3 py-3">
      <div className="nyay-container">
        <h2 className="heading mb-3">Structured Courtroom Engine</h2>
        {error && qaPairs.length === 0 && <div className="alert alert-danger" style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,0,0,0.2)', color: '#FF7B7B', border: '1px solid rgba(255,0,0,0.4)', borderRadius: '15px' }}>{error}</div>}

        <div className="nyay-card p-3 mb-3">
          <h5 className="heading mb-2">Case Summary (Read Only)</h5>
          {loading ? (
            <p className="mb-0">Loading case summary...</p>
          ) : (
            <ul className="mb-0">
              {summary.length === 0 && <li>No summary available.</li>}
              {summary.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          )}
        </div>

        <div className="nyay-card p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="heading mb-0">Question vs Answer Legal Battle</h5>
            <button className="btn nyay-btn" type="button" onClick={buildQAGrid} disabled={generating || loading}>
              {generating ? 'Generating...' : 'Regenerate Q&A'}
            </button>
          </div>

          <div className="qa-grid-header">
            <div><strong>Case Findings</strong></div>
            <div><strong>Opponent AI (Counter Question)</strong></div>
          </div>
          <div className="qa-grid-list">
            {transcriptRows.length === 0 && <p className="mb-0">No Q&A generated yet.</p>}
            {transcriptRows.map((row) => (
              <div className="qa-grid-row" key={row.id}>
                <div className={`qa-answer ${row.answer === 'No valid answer available' ? 'qa-missing' : ''}`}>
                  {row.answer}
                </div>
                <div className="qa-question">{row.question}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="nyay-card p-3 mb-3">
          <button className="btn nyay-btn w-100" type="button" onClick={finishAndGetVerdict} disabled={finishing || loading || qaPairs.length === 0}>
            {finishing ? 'Analyzing Verdict...' : 'Finish & Get Verdict'}
          </button>
        </div>

        {verdict && (
          <div className="nyay-card p-3" ref={verdictCardRef}>
            <h5 className="heading mb-3">Verdict Engine Output</h5>
            <p><strong>Winning Probability:</strong> {verdict.winningProbability}%</p>
            <p><strong>Final Verdict:</strong> {verdict.finalVerdict}</p>

            <h6 className="heading mt-3">Favorable Laws</h6>
            <ul>
              {(verdict.favorableLaws || []).length === 0 && <li>None identified</li>}
              {(verdict.favorableLaws || []).map((law, idx) => <li key={idx}>{law}</li>)}
            </ul>

            <h6 className="heading mt-3">Laws Against User</h6>
            <ul>
              {(verdict.opposingLaws || []).length === 0 && <li>No opposing sections identified</li>}
              {(verdict.opposingLaws || []).map((law, idx) => <li key={idx}>{law}</li>)}
            </ul>

            <h6 className="heading mt-3">Strengths</h6>
            <ul>
              {(verdict.strengths || []).length === 0 && <li>No strengths captured</li>}
              {(verdict.strengths || []).map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>

            <h6 className="heading mt-3">Weaknesses</h6>
            <ul>
              {(verdict.weaknesses || []).length === 0 && <li>No weaknesses captured</li>}
              {(verdict.weaknesses || []).map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>

            <h6 className="heading mt-3">Suggestions</h6>
            <ul>
              {(verdict.suggestions || []).length === 0 && <li>No suggestions available</li>}
              {(verdict.suggestions || []).map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>

            <h6 className="heading mt-3">Full Transcript</h6>
            <div className="court-sim-feed">
              {transcriptRows.map((row) => (
                <div className="p-3 my-2 rounded role-judge" key={`tx-${row.id}`}>
                  <p className="mb-1"><strong>Q{row.id}:</strong> {row.question}</p>
                  <p className="mb-0"><strong>A{row.id}:</strong> {row.answer}</p>
                </div>
              ))}
            </div>

            <button className="btn nyay-btn mt-3" type="button" onClick={downloadVerdictPdf} disabled={downloading}>
              {downloading ? 'Preparing PDF...' : 'Download PDF'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Courtroom;
