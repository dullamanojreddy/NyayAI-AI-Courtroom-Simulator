import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import api from '../api/api';

function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(sessions.length / perPage));

  useEffect(() => {
    async function loadSessions() {
      setError('');
      setLoading(true);
      try {
        const userRaw = localStorage.getItem('nyayai_user');
        const user = userRaw ? JSON.parse(userRaw) : null;
        const userId = user?.userId || user?.id || user?._id;

        if (!userId) {
          setError('User not found. Please login again.');
          setSessions([]);
          return;
        }

        const { data } = await api.get(`/sessions/${userId}`);
        setSessions(Array.isArray(data) ? data : []);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to load sessions.');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, []);

  const pagedSessions = useMemo(() => {
    const start = (page - 1) * perPage;
    return sessions.slice(start, start + perPage);
  }, [page, sessions]);



  const completedSessions = sessions.filter((s) => s.status === 'completed').length;

  return (
    <div className="nyay-container">
      <h2 className="heading mb-3">Dashboard</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3 mb-4">
        <div className="col-md-4"><StatCard title="Total Sessions" value={String(sessions.length)} /></div>
        <div className="col-md-4"><StatCard title="Completed" value={String(completedSessions)} color="#2D5A27" /></div>
        <div className="col-md-4"><StatCard title="Active" value={String(sessions.length - completedSessions)} /></div>
      </div>


      <div className="nyay-card p-3 mb-4">
        <h5 className="heading">Session History</h5>
        {loading ? (
          <p className="mb-0">Loading sessions...</p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-dark table-striped">
                <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {pagedSessions.map((s) => (
                    <tr key={s._id || s.sessionId}>
                      <td>{s.caseTitle || 'Untitled Case'}</td>
                      <td>{s.caseType || 'GENERAL_DISPUTE'}</td>
                      <td>{s.status}</td>

                      <td>
                        <button
                          className="btn btn-sm nyay-btn"
                          type="button"
                          onClick={() => {
                            localStorage.setItem('nyayai_session_id', s.sessionId);
                            localStorage.setItem('nyayai_current_session_id', s.sessionId);
                            navigate(`/report?sessionId=${encodeURIComponent(s.sessionId)}`);
                          }}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pagedSessions.length === 0 && (
                    <tr><td colSpan="4">No sessions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <nav aria-label="Session pagination">
              <ul className="pagination mb-0">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <li key={idx + 1} className={`page-item ${page === idx + 1 ? 'disabled' : ''}`}>
                    <button className="page-link" type="button" onClick={() => setPage(idx + 1)}>{idx + 1}</button>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}
      </div>

      <div className="row g-3">
        <div className="col-md-4"><button className="btn nyay-btn w-100" type="button" onClick={() => navigate('/new-case')}>Start New Case</button></div>
        <div className="col-md-4"><button className="btn nyay-btn w-100" type="button" onClick={() => navigate('/courtroom')}>Resume</button></div>
        <div className="col-md-4"><button className="btn nyay-btn w-100" type="button" onClick={() => navigate('/report')}>View Latest Report</button></div>
      </div>
    </div>
  );
}

export default Dashboard;
