import React from 'react';

function CourtMessage({ role, text }) {
  return (
    <div className={`p-3 my-2 rounded role-${role}`}>
      <small className="text-uppercase fw-bold">{role}</small>
      <p className="mb-0">{text}</p>
    </div>
  );
}

export default CourtMessage;
