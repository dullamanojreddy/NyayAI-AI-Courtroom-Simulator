import React from 'react';

function ProgressBar({ label, value, color = '#C9A84C' }) {
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between small">
        <span>{label}</span><span>{value}%</span>
      </div>
      <div className="progress" style={{ height: 8, background: '#2b2217' }}>
        <div className="progress-bar" role="progressbar" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default ProgressBar;
