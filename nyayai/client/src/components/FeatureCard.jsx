import React from 'react';

function FeatureCard({ title, description }) {
  return (
    <div className="nyay-card p-4 h-100 text-center">
      <h5 className="heading" style={{ color: '#C9A84C' }}>{title}</h5>
      <p className="mb-0" style={{ color: '#A89060' }}>{description}</p>
    </div>
  );
}

export default FeatureCard;
