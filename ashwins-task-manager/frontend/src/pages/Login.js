import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
        <div style={styles.grid} />
      </div>

      <div style={styles.container}>
        <div style={styles.logoWrap}>
          <div style={styles.logo}>A</div>
          <div>
            <h1 style={styles.appName}>Ashwin's Task Manager</h1>
            <p style={styles.tagline}>Office Productivity Suite</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.formTitle}>Welcome back</h2>
          <p style={styles.formSub}>Sign in to your workspace</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Username</label>
            <input
              className="input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px', marginTop: '8px' }}
          >
            {loading ? '⏳ Signing in...' : '→ Sign In'}
          </button>

          <div style={styles.hint}>
            <span style={{ color: 'var(--text3)', fontSize: '13px' }}>Admin: username <strong style={{ color: 'var(--text2)' }}>admin</strong> / password <strong style={{ color: 'var(--text2)' }}>admin</strong></span>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  bg: { position: 'fixed', inset: 0, zIndex: 0 },
  orb1: {
    position: 'absolute', top: '-20%', left: '-10%',
    width: '600px', height: '600px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)',
  },
  orb2: {
    position: 'absolute', bottom: '-20%', right: '-10%',
    width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(78,205,196,0.1) 0%, transparent 70%)',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
  },
  container: { position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' },
  logo: {
    width: '52px', height: '52px', borderRadius: '14px',
    background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '800', color: '#fff',
    boxShadow: '0 8px 24px rgba(108,99,255,0.4)',
  },
  appName: { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', lineHeight: 1.2 },
  tagline: { fontSize: '13px', color: 'var(--text3)', marginTop: '2px' },
  form: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
  },
  formTitle: { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700', marginBottom: '6px' },
  formSub: { color: 'var(--text2)', fontSize: '14px', marginBottom: '24px' },
  hint: { textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' },
};
