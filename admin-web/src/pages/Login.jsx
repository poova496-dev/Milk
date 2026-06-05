import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAdmin, saveSession } from '../lib/auth';
import { LOGO_BASE64 } from '../lib/logoBase64';

export default function Login() {
  const navigate = useNavigate();
  const [id, setId] = useState('Admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!verifyAdmin(id.trim(), password)) {
      setError('Invalid admin ID or password');
      return;
    }
    saveSession();
    navigate('/');
  };

  return (
    <div className="login-page">
      <form className="login-card card" onSubmit={submit}>
        <div className="login-brand">
          {LOGO_BASE64 ? (
            <img src={LOGO_BASE64} alt="Manjula Milk" className="login-logo" />
          ) : (
            <span className="login-logo-fallback">🥛</span>
          )}
          <div>
            <h1>Manjula Milk Admin</h1>
            <p className="sub">PC web panel — same data as mobile app</p>
          </div>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label>Admin ID</label>
          <input value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn" style={{ width: '100%' }}>
          Login
        </button>
        <p className="hint">Default: Admin / 852585 (change in Settings)</p>
      </form>
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1f4d1c 0%, #2e7d32 100%);
          padding: 20px;
        }
        .login-card { max-width: 400px; width: 100%; }
        .login-brand {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .login-logo {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          object-fit: contain;
          background: #fff;
          padding: 4px;
          flex-shrink: 0;
          border: 2px solid var(--secondary);
        }
        .login-logo-fallback {
          font-size: 48px;
          line-height: 1;
          flex-shrink: 0;
        }
        .login-card h1 { color: var(--primary); margin-bottom: 4px; font-size: 22px; }
        .sub { color: var(--muted); margin-bottom: 0; font-size: 14px; }
        .hint { margin-top: 16px; font-size: 12px; color: var(--muted); text-align: center; }
      `}</style>
    </div>
  );
}
