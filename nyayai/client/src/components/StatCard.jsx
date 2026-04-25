import React from 'react';

function StatCard({ title, value, color = '#C9A84C' }) {
  return (
    <div className="nyay-card p-3 h-100">
      <p className="mb-1" style={{ color: '#A89060' }}>{title}</p>
      <h3 className="m-0 heading" style={{ color }}>{value}</h3>
    </div>
  );
}

export default StatCard;
