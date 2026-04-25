import React, { useEffect, useMemo, useState } from 'react';
import LawCard from '../components/LawCard';
import Modal from '../components/Modal';
import api from '../api/api';

function LearnLaw() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedLaw, setSelectedLaw] = useState(null);
  const [laws, setLaws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLaws() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/laws');
        const rows = Array.isArray(data?.laws) ? data.laws : [];
        const mapped = rows.map((l, idx) => ({
          id: l._id || idx,
          section: l.sectionId || l.sectionNumber || '-',
          act: l.actName || 'Indian Law',
          title: l.title || 'Untitled',
          penalty: l.penalty || 'N/A',
          category: l.category || 'Other',
          description: l.fullText || l.plainLanguage || '',
          meaning: l.meaning || l.plainLanguage || 'Consult a legal expert.'
        }));
        setLaws(mapped);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to load laws.');
      } finally {
        setLoading(false);
      }
    }

    loadLaws();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(laws.map((l) => l.category).filter(Boolean)));
    return ['All', ...unique];
  }, [laws]);

  const filtered = useMemo(() => {
    return laws.filter((l) => {
      const byQuery = `${l.section} ${l.title} ${l.description}`.toLowerCase().includes(query.toLowerCase());
      const byCategory = category === 'All' || l.category === category;
      return byQuery && byCategory;
    });
  }, [query, category, laws]);

  return (
    <div className="nyay-container">
      <h2 className="heading mb-3">Learn Law</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="nyay-card p-4 mb-4">
        <input className="form-control mb-3" placeholder="Search IPC section, act or legal term..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="d-flex flex-wrap gap-2 mt-2">
          {categories.map((c) => (
            <button 
              key={c} 
              className="btn nyay-btn" 
              style={{
                background: category === c ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05))' : '',
                borderColor: category === c ? '#d4af37' : 'var(--gold-dim)',
                boxShadow: category === c ? '0 0 16px rgba(212, 175, 55, 0.3)' : 'none',
              }}
              type="button" 
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p>Loading laws...</p>
      ) : (
        <div className="row g-3">
          {filtered.map((law) => (
            <div className="col-md-4" key={law.id}><LawCard law={law} onOpen={setSelectedLaw} /></div>
          ))}
        </div>
      )}

      <Modal show={!!selectedLaw} title={selectedLaw?.title || ''} onClose={() => setSelectedLaw(null)}>
        <p><strong>Section:</strong> {selectedLaw?.section}</p>
        <p><strong>Description:</strong> {selectedLaw?.description}</p>
        <p><strong>Penalty:</strong> {selectedLaw?.penalty}</p>
        <p><strong>What this means for you:</strong> {selectedLaw?.meaning || 'This law provides structural legal guidelines. Consult a legal expert for application specifics.'}</p>
      </Modal>
    </div>
  );
}

export default LearnLaw;
