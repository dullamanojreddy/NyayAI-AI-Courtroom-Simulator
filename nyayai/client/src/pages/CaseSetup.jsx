import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import api from '../api/api';

function CaseSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [classification, setClassification] = useState(null);
  const [loadingStart, setLoadingStart] = useState(false);
  const [error, setError] = useState('');
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [form, setForm] = useState({
    situation: '',
    title: '',
    judgeStyle: 'Balanced',
    difficulty: 'Intermediate',
    rounds: 5
  });

  const progress = useMemo(() => Math.round((step / 3) * 100), [step]);
  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const handleType = (e) => {
    setForm({ ...form, situation: e.target.value });
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 400);
  };

  const startCourtroom = async () => {
    setError('');
    setLoadingStart(true);

    try {
      let cls = classification;
      if (!cls) {
        const { data } = await api.post('/classify', { text: form.situation });
        cls = data;
        setClassification(data);
      }

      const sessionId = `session-${Date.now()}`;
      const { data: session } = await api.post('/courtroom/start', {
        sessionId,
        caseDetails: {
          caseTitle: form.title || 'Untitled Case',
          caseType: cls.caseType || 'GENERAL_DISPUTE',
          applicableLaws: cls.laws || [],
          situation: form.situation,
          role: 'Complainant'
        },
        courtConfig: {
          judgeStyle: form.judgeStyle,
          difficulty: form.difficulty,
          rounds: form.rounds
        }
      });

      localStorage.setItem('nyayai_session_id', session.sessionId || sessionId);
      localStorage.setItem('nyayai_current_session_id', session.sessionId || sessionId);
      navigate('/courtroom');
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to start courtroom session.');
    } finally {
      setLoadingStart(false);
    }
  };

  return (
    <div className="nyay-container">
      <h2 className="heading mb-3">Case Setup</h2>
      <ProgressBar label={`Step ${step} of 3`} value={progress} />
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      <div className="nyay-card p-3 mt-3">
        {step === 1 && (
          <>
            <h5 className="heading">Step 1: Situation</h5>
            <textarea 
              className="form-control mb-2" 
              rows="14" 
              placeholder="Describe your legal issue, timeline, and involved parties here..." 
              value={form.situation} 
              onChange={handleType} 
              style={{
                transition: 'all 0.15s ease-out',
                boxShadow: typing ? '0 0 24px rgba(201, 168, 76, 0.5)' : 'none',
                borderColor: typing ? '#C9A84C' : 'rgba(255, 255, 255, 0.15)',
                transform: typing ? 'scale(1.015)' : 'scale(1)',
                background: typing ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0,0,0,0.3)',
                resize: 'none'
              }}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h5 className="heading">Step 2: Case Details</h5>
            <input className="form-control mb-2" placeholder="Case Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </>
        )}

        {step === 3 && (
          <>
            <h5 className="heading">Step 3: Summary</h5>
            <p><strong>Title:</strong> {form.title || 'Untitled'}</p>
            <p><strong>Role:</strong> Citizen / Victim (Complainant)</p>
            <button className="btn nyay-btn" type="button" onClick={startCourtroom} disabled={loadingStart}>
              {loadingStart ? 'Starting Courtroom...' : 'Enter Courtroom'}
            </button>
          </>
        )}

        <div className="mt-3 d-flex justify-content-between">
          <button className="btn nyay-btn" type="button" onClick={prev}>Back</button>
          {step < 3 && (
            <button className="btn nyay-btn" type="button" onClick={next}>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CaseSetup;
