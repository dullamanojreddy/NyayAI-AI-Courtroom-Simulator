import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('nyayai_user') || '{}');
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('nyayai_token');
    localStorage.removeItem('nyayai_user');
    localStorage.removeItem('nyayai_session_id');
    localStorage.removeItem('nyayai_latest_verdict');
    navigate('/auth');
  };

  return (
    <nav className="navbar navbar-expand-lg" style={{ 
      background: 'rgba(5, 5, 7, 0.6)', 
      backdropFilter: 'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '12px 0'
    }}>
      <div className="container-fluid px-4">
        <NavLink className="navbar-brand heading" to="/" style={{ color: '#C9A84C' }}>NyayAI</NavLink>
        <button className="navbar-toggler" type="button" onClick={() => setOpen((p) => !p)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0" style={{ gap: '20px' }}>
            {['Dashboard', 'New Case', 'Courtroom', 'Learn Law', 'Report'].map((item) => {
               const route = `/${item.toLowerCase().replace(' ', '-')}`;
               const finalRoute = item === 'Learn Law' ? '/learn' : route;
               return (
                 <li className="nav-item" key={item}>
                   <NavLink 
                     className="nav-link" 
                     to={finalRoute} 
                     style={({isActive}) => ({ 
                       color: isActive ? '#fff' : '#8a8a9e', 
                       fontWeight: isActive ? '600' : '500', 
                       letterSpacing: '0.5px',
                       transition: 'all 0.3s ease',
                       position: 'relative',
                       textTransform: 'uppercase',
                       fontSize: '13px'
                     })}
                     onMouseEnter={(e) => { e.target.style.color = '#fff'; e.target.style.transform = 'translateY(-1px)'; }}
                     onMouseLeave={(e) => { 
                       const isActive = e.target.classList.contains('active');
                       e.target.style.color = isActive ? '#fff' : '#8a8a9e';
                       e.target.style.transform = 'translateY(0)';
                     }}
                   >
                     {item}
                     <span style={{
                       position: 'absolute',
                       bottom: '-4px',
                       left: '50%',
                       transform: 'translateX(-50%)',
                       width: '100%',
                       height: '2px',
                       background: 'var(--gold)',
                       opacity: 0,
                       transition: 'opacity 0.3s ease'
                     }} className="nav-indicator" />
                   </NavLink>
                 </li>
               )
            })}
          </ul>
          <div className="dropdown">
            <button className="btn btn-sm nyay-btn dropdown-toggle" data-bs-toggle="dropdown" type="button" style={{ borderRadius: '12px', padding: '8px 16px' }}>{currentUser?.name || 'Authorized User'}</button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><button className="dropdown-item" type="button" onClick={() => navigate('/dashboard')}>Profile</button></li>
              <li><button className="dropdown-item" type="button" onClick={handleLogout}>Logout</button></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
