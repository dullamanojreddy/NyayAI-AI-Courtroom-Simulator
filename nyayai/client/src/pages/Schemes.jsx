import React, { useEffect, useMemo, useState } from 'react';
import SchemeCard from '../components/SchemeCard';
import api from '../api/api';

function Schemes() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const displaySchemes = useMemo(() => {
    return results.map((s, idx) => ({
      id: s._id || idx,
      name: s.schemeName || 'Unnamed Scheme',
      body: s.governmentBody || 'N/A',
      eligibility: (s.categories || s.eligibilityCriteria?.categories || []).join(', ') || 'All',
      benefit: s.benefit || 'N/A'
    }));
  }, [results]);

  useEffect(() => {
    async function loadSchemes() {
      setLoading(true);
      setError('');
      try {
        const userRaw = localStorage.getItem('nyayai_user');
        const user = userRaw ? JSON.parse(userRaw) : null;

        const payload = {
          state: user?.state || undefined,
          income: user?.income || undefined,
          category: user?.category || undefined
        };

        const { data } = await api.post('/schemes/match', payload);
        setResults(Array.isArray(data) ? data : []);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to fetch schemes.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    loadSchemes();
  }, []);

  const refreshSchemes = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/schemes/match', {});
      setResults(Array.isArray(data) ? data : []);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to fetch schemes.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nyay-container">
      <h2 className="heading mb-3">Government Schemes</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <p>Loading schemes...</p>}
      {displaySchemes.map((scheme) => <SchemeCard key={scheme.id} scheme={scheme} />)}
      {!loading && !error && displaySchemes.length === 0 && (
        <div className="nyay-card p-3">
          <p className="mb-2">No matching schemes found right now.</p>
          <button className="btn nyay-btn" type="button" onClick={refreshSchemes}>Try Again</button>
        </div>
      )}
    </div>
  );
}

export default Schemes;
