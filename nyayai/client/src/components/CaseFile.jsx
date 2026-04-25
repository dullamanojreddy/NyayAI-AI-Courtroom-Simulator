import React from 'react';

function CaseFile({ selectedLaws = [], caseTitle = 'Landlord Deposit Dispute', roundInfo = '2 of 5' }) {
  return (
    <div className="nyay-card p-3 h-100">
      <h6 className="heading" style={{ color: '#C9A84C' }}>Case File</h6>
      <p className="mb-1"><strong>Case:</strong> {caseTitle}</p>
      <p className="mb-1"><strong>Round:</strong> {roundInfo}</p>
      <p className="mb-2"><strong>Laws:</strong></p>
      <ul>
        {selectedLaws.map((law, idx) => (
          <li key={law.id || idx}>{law.section} - {law.title}</li>
        ))}
      </ul>
      <button className="btn btn-sm nyay-btn" type="button" onClick={() => console.log('Hint requested')}>Get Hint</button>
    </div>
  );
}

export default CaseFile;
