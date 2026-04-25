import React from 'react';

import ReactDOM from 'react-dom';

function Modal({ show, title, children, onClose }) {
  if (!show) return null;

  return ReactDOM.createPortal(
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 9999, backdropFilter: 'blur(10px)' }}>
      <div className="nyay-card p-4" style={{ width: 'min(650px, 90vw)', animation: 'modalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="heading m-0" style={{ color: '#E4C580', textShadow: '0 2px 15px rgba(228, 197, 128, 0.5)' }}>{title}</h4>
        </div>
        <div style={{ fontSize: '16px', lineHeight: '1.6' }}>{children}</div>
        <button className="btn nyay-btn w-100 mt-4" onClick={onClose}>Close Archive</button>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
