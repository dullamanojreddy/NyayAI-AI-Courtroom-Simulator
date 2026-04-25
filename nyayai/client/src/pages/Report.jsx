import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/api';
import { exportElementToPdf } from '../utils/pdfExport';

function Report() {
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState(null);
  const [resolvedSessionId, setResolvedSessionId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [schemesError, setSchemesError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reportCardRef = useRef(null);

  const requestedSessionId = useMemo(() => {
    return searchParams.get('sessionId') || '';
  }, [searchParams]);

  useEffect(() => {
    async function resolveSessionId() {
      if (requestedSessionId) {
        setResolvedSessionId(requestedSessionId);
        localStorage.setItem('nyayai_session_id', requestedSessionId);
        localStorage.setItem('nyayai_current_session_id', requestedSessionId);
        return;
      }

      const userRaw = localStorage.getItem('nyayai_user');
      let user = null;
      try {
        user = userRaw ? JSON.parse(userRaw) : null;
      } catch {
        user = null;
      }

      const userId = user?.userId || user?.id || user?._id;
      if (!userId) {
        setResolvedSessionId('');
        setError('User not found. Please login again.');
        return;
      }

      try {
        const { data } = await api.get(`/sessions/${userId}`);
        const sessions = Array.isArray(data) ? data : [];
        if (sessions.length === 0) {
          setResolvedSessionId('');
          setSession(null);
          setError('No cases found for this account.');
          return;
        }

        const currentCourtroomSessionId = localStorage.getItem('nyayai_current_session_id') || '';
        const localSessionId = localStorage.getItem('nyayai_session_id') || '';

        const pickedSession =
          sessions.find((s) => s.sessionId === currentCourtroomSessionId) ||
          sessions.find((s) => s.sessionId === localSessionId) ||
          sessions.find((s) => s.status === 'active') ||
          sessions[0];

        if (!pickedSession?.sessionId) {
          setResolvedSessionId('');
          setSession(null);
          setError('No valid case could be resolved for this account.');
          return;
        }

        setResolvedSessionId(pickedSession.sessionId);
        localStorage.setItem('nyayai_session_id', pickedSession.sessionId);
        localStorage.setItem('nyayai_current_session_id', pickedSession.sessionId);
      } catch (apiError) {
        setResolvedSessionId('');
        setError(apiError?.response?.data?.message || 'Failed to resolve latest case for this account.');
      }
    }

    resolveSessionId();
  }, [requestedSessionId]);

  useEffect(() => {
    async function loadSession() {
      if (!resolvedSessionId) {
        setError('No session selected for report.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/session/${encodeURIComponent(resolvedSessionId)}`);
        setSession(data);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to fetch report details.');
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [resolvedSessionId]);

  useEffect(() => {
    async function loadSchemes() {
      if (!session || session.status !== 'completed') {
        setSchemes([]);
        return;
      }

      const userRaw = localStorage.getItem('nyayai_user');
      let user = null;
      try {
        user = userRaw ? JSON.parse(userRaw) : null;
      } catch {
        user = null;
      }

      const derivedCategory = user?.category || (String(user?.gender || '').toLowerCase() === 'female' ? 'Women' : undefined);

      setSchemesLoading(true);
      setSchemesError('');
      try {
        const { data } = await api.post('/schemes/match', {
          caseType: session.caseType || undefined,
          state: user?.state || undefined,
          income: user?.income || undefined,
          category: derivedCategory || undefined
        });

        setSchemes(Array.isArray(data) ? data : []);
      } catch (apiError) {
        setSchemesError(apiError?.response?.data?.message || 'Could not load scheme suggestions.');
        setSchemes([]);
      } finally {
        setSchemesLoading(false);
      }
    }

    loadSchemes();
  }, [session]);

  const verdict = session?.verdict || {};
  const qaTranscript = Array.isArray(verdict.transcript) ? verdict.transcript : [];
  const messageTranscript = Array.isArray(session?.transcript) ? session.transcript : [];

  const downloadReportPdf = async () => {
    if (!reportCardRef.current) return;
    setDownloading(true);
    setError('');
    try {
      await exportElementToPdf(reportCardRef.current, `nyayai-report-${session?.sessionId || 'session'}.pdf`);
    } catch (e) {
      setError(e?.message || 'Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="nyay-container">
      <div className="nyay-card p-4" ref={reportCardRef}>
        <h2 className="heading text-center" style={{ color: '#C9A84C' }}>IN THE HON'BLE COURT OF NYAYAI</h2>
        <hr />

        {loading && <p className="mb-0">Loading report...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && session && (
          <>
            <h5 className="heading">Case Summary</h5>
            <p>
              Case: {session.caseTitle || 'Untitled Case'} | Type: {session.caseType || 'GENERAL_DISPUTE'} | Status: {session.status}
            </p>
            <p>Session ID: {session.sessionId}</p>
            <p>Total Score: {Number(session.totalScore || 0)}</p>

            <h5 className="heading mt-4">Applicable Laws</h5>
            <ul>
              {(session.applicableLaws || []).map((law, idx) => <li key={idx}>{law}</li>)}
            </ul>

            <h5 className="heading mt-4">Transcript</h5>
            {messageTranscript.length > 0 ? (
              <ol>
                {messageTranscript.map((m, idx) => (
                  <li key={`${m.role}-${idx}`}><strong>{m.role}:</strong> {m.text}</li>
                ))}
              </ol>
            ) : (
              <p>No transcript available.</p>
            )}

            <h5 className="heading mt-4">Verdict Engine Output</h5>
            {typeof verdict.winningProbability === 'number' || verdict.finalVerdict ? (
              <>
                <p className="mb-1"><strong>Winning Probability:</strong> {typeof verdict.winningProbability === 'number' ? `${verdict.winningProbability}%` : 'N/A'}</p>
                <p className="mb-1"><strong>Final Verdict:</strong> {verdict.finalVerdict || 'N/A'}</p>

                <h6 className="heading mt-3">Favorable Laws</h6>
                {Array.isArray(verdict.favorableLaws) && verdict.favorableLaws.length > 0 ? (
                  <ul>
                    {verdict.favorableLaws.map((item, idx) => <li key={`fav-${idx}`}>{item}</li>)}
                  </ul>
                ) : (
                  <p>No specific favourable sections identified yet.</p>
                )}

                <h6 className="heading mt-3">Laws Against User</h6>
                {Array.isArray(verdict.opposingLaws) && verdict.opposingLaws.length > 0 ? (
                  <ul>
                    {verdict.opposingLaws.map((item, idx) => <li key={`opp-${idx}`}>{item}</li>)}
                  </ul>
                ) : (
                  <p>No adverse sections detected from the current transcript.</p>
                )}

                <h6 className="heading mt-3">Strengths</h6>
                {Array.isArray(verdict.strengths) && verdict.strengths.length > 0 ? (
                  <ul>
                    {verdict.strengths.map((item, idx) => <li key={`str-${idx}`}>{item}</li>)}
                  </ul>
                ) : (
                  <p>No strengths captured.</p>
                )}

                <h6 className="heading mt-3">Weaknesses</h6>
                {Array.isArray(verdict.weaknesses) && verdict.weaknesses.length > 0 ? (
                  <ul>
                    {verdict.weaknesses.map((item, idx) => <li key={`weak-${idx}`}>{item}</li>)}
                  </ul>
                ) : (
                  <p>No weaknesses captured.</p>
                )}

                <h6 className="heading mt-3">Suggestions</h6>
                {Array.isArray(verdict.suggestions) && verdict.suggestions.length > 0 ? (
                  <ul>
                    {verdict.suggestions.map((item, idx) => <li key={`sug-${idx}`}>{item}</li>)}
                  </ul>
                ) : (
                  <p>No suggestions available.</p>
                )}

                {qaTranscript.length > 0 && (
                  <>
                    <h6 className="heading mt-3">Full Transcript</h6>
                    <div className="court-sim-feed">
                      {qaTranscript.map((row, idx) => (
                        <div className="p-3 my-2 rounded role-judge" key={`qa-${idx}`}>
                          <p className="mb-1"><strong>Q{idx + 1}:</strong> {row.question}</p>
                          <p className="mb-0"><strong>A{idx + 1}:</strong> {row.answer}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="alert alert-warning py-2">Verdict not available yet. Finish and generate verdict in Courtroom first.</div>
            )}

            {Array.isArray(verdict.improvements) && verdict.improvements.length > 0 && (
              <>
                <h5 className="heading mt-4">Recommendations</h5>
                <ul>
                  {verdict.improvements.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </>
            )}

            <h5 className="heading mt-4">Applicable Schemes (Based On Final Result)</h5>
            {schemesLoading && <p className="mb-2">Checking scheme eligibility...</p>}
            {schemesError && <div className="alert alert-warning py-2">{schemesError}</div>}
            {!schemesLoading && !schemesError && schemes.length === 0 && (
              <p className="mb-2">No government scheme matched your case profile.</p>
            )}
            {!schemesLoading && schemes.length > 0 && (
              <ul>
                {schemes.map((s) => (
                  <li key={s._id || s.schemeName}>
                    <strong>{s.schemeName}</strong> - {s.benefit || 'Benefit details available on official portal'}
                  </li>
                ))}
              </ul>
            )}

            <button className="btn nyay-btn mt-3" type="button" onClick={downloadReportPdf} disabled={downloading}>
              {downloading ? 'Preparing PDF...' : 'Download PDF'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Report;
