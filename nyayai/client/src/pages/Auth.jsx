import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSuccess = (data) => {
    // Reset per-session pointers so a fresh login does not inherit stale case IDs.
    localStorage.removeItem('nyayai_session_id');
    localStorage.removeItem('nyayai_current_session_id');

    localStorage.setItem('nyayai_token', data.token);
    localStorage.setItem('nyayai_user', JSON.stringify({
      userId: data.user?.id || data.user?._id || '',
      name: data.user?.name || '',
      email: data.user?.email || '',
      role: data.user?.role || 'user'
    }));
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    try {
      if (mode === 'login') {
        const { data } = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        handleSuccess(data);
      } else {
        if (!formData.name) {
          setError('Name is required for registration.');
          setLoading(false);
          return;
        }
        const { data } = await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'user'
        });
        handleSuccess(data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        (mode === 'login' ? 'Invalid email or password!' : 'Registration failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    wrapper: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
      fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '48px 40px',
      width: '100%',
      maxWidth: '440px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      textAlign: 'center'
    },
    logo: {
      width: '64px',
      height: '64px',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      borderRadius: '16px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 'bold',
      fontSize: '28px',
      marginBottom: '24px',
      boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)'
    },
    title: {
      color: '#fafafa',
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '10px',
      letterSpacing: '-0.025em'
    },
    subtitle: {
      color: '#a1a1aa',
      fontSize: '15px',
      marginBottom: '36px',
      lineHeight: '1.5'
    },
    formGroup: {
      marginBottom: '22px',
      textAlign: 'left'
    },
    label: {
      display: 'block',
      color: '#e4e4e7',
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      background: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '12px',
      color: '#fafafa',
      fontSize: '15px',
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '15px',
      background: 'linear-gradient(to right, #4f46e5, #6366f1)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginTop: '12px',
      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
    },
    error: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      color: '#fca5a5',
      padding: '14px',
      borderRadius: '10px',
      marginBottom: '24px',
      fontSize: '14px',
      fontWeight: '500'
    },
    toggleText: {
      color: '#a1a1aa',
      fontSize: '15px',
      marginTop: '28px'
    },
    toggleLink: {
      color: '#818cf8',
      cursor: 'pointer',
      fontWeight: '600',
      marginLeft: '6px',
      textDecoration: 'none',
      background: 'none',
      border: 'none',
      padding: 0,
      font: 'inherit',
      transition: 'color 0.2s ease'
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logo}>⚖️</div>
        <h2 style={styles.title}>
          {mode === 'login' ? 'Welcome to NyayAI' : 'Create Account'}
        </h2>
        <p style={styles.subtitle}>
          {mode === 'login' 
            ? 'Sign in to powerfully simulate legal cases.' 
            : 'Register securely to access your AI courtroom.'}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
             <div style={styles.formGroup}>
               <label style={styles.label}>Full Name</label>
               <input
                 type="text"
                 placeholder="Arun Kumar"
                 value={formData.name}
                 onChange={(e) => setFormData({...formData, name: e.target.value})}
                 style={styles.input}
                 onFocus={(e) => e.target.style.borderColor = '#818cf8'}
                 onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                 required
               />
             </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={styles.input}
              onFocus={(e) => e.target.style.borderColor = '#818cf8'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={styles.input}
              onFocus={(e) => e.target.style.borderColor = '#818cf8'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              required
            />
          </div>

          <button 
            type="submit" 
            style={{...styles.button, opacity: loading ? 0.7 : 1}} 
            disabled={loading}
            onMouseOver={(e) => { if(!loading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.6)'; } }}
            onMouseOut={(e) => { if(!loading) { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.4)'; } }}
          >
            {loading ? 'Authenticating...' : (mode === 'login' ? 'Secure Sign In' : 'Register Now')}
          </button>
        </form>

        <div style={styles.toggleText}>
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={(e) => {
              e.preventDefault();
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }} 
            style={styles.toggleLink}
            onMouseOver={(e) => e.target.style.color = '#c7d2fe'}
            onMouseOut={(e) => e.target.style.color = '#818cf8'}
          >
            {mode === 'login' ? 'Create one here' : 'Sign in instead'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
