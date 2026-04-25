import React from 'react';

function LawCard({ law, onOpen }) {
  return (
    <div className="nyay-card p-4 h-100 d-flex flex-column" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="card-ambient-glow"></div>
      <small style={{ color: '#A89060', fontWeight: '600', letterSpacing: '1px', fontSize: '11px', textTransform: 'uppercase' }}>{law.section} • {law.act}</small>
      <h5 className="heading mt-2 mb-3" style={{ color: '#FDFDFD', flexGrow: 1, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{law.title}</h5>
      <div className="mb-4">
        <span style={{ 
          background: 'rgba(212, 175, 55, 0.1)', 
          border: '1px solid rgba(212, 175, 55, 0.4)', 
          color: '#d4af37', 
          padding: '4px 10px', 
          borderRadius: '20px', 
          fontSize: '11px', 
          fontWeight: '700',
          letterSpacing: '0.5px',
          boxShadow: '0 0 10px rgba(212, 175, 55, 0.15)'
        }}>
          {law.penalty}
        </span>
      </div>
      <button className="btn w-100 nyay-btn" onClick={() => onOpen(law)} style={{ marginTop: 'auto' }}>Read Full Section</button>
    </div>
  );
}

export default LawCard;
