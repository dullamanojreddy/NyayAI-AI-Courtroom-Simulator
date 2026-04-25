import React from 'react';

function SchemeCard({ scheme }) {
  return (
    <div className="nyay-card p-3 mb-3">
      <h6 className="heading" style={{ color: '#C9A84C' }}>{scheme.name}</h6>
      <p className="mb-1"><strong>Body:</strong> {scheme.body}</p>
      <p className="mb-1"><strong>Eligibility:</strong> {scheme.eligibility}</p>
      <p className="mb-2"><strong>Benefit:</strong> {scheme.benefit}</p>
      <button className="btn btn-sm nyay-btn" onClick={() => console.log('Add scheme to report', scheme.id)}>Add to Report</button>
    </div>
  );
}

export default SchemeCard;
