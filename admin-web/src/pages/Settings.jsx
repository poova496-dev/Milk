import { useRef, useState } from 'react';
import { FocusZone, useFocusZone } from '../context/FocusNavContext';
import {
  getAdminCreds,
  setAdminCreds,
  DEFAULT_ADMIN_ID,
  DEFAULT_ADMIN_PASSWORD,
} from '../lib/auth';
import { setKeyboardShortcutsEnabled, useKeyboardShortcutsEnabled } from '../lib/preferences';

export default function Settings() {
  const creds = getAdminCreds();
  const shortcutsOn = useKeyboardShortcutsEnabled();
  const [adminId, setAdminId] = useState(creds.id);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const formRef = useRef(null);

  const toggleShortcuts = (on) => {
    setKeyboardShortcutsEnabled(on);
    setMsg(on ? 'Keyboard shortcuts turned ON' : 'Keyboard shortcuts turned OFF');
    setErr('');
  };

  useFocusZone('adminId', 0, { label: 'Admin ID', allowTyping: true }, []);
  useFocusZone('currentPw', 1, { label: 'Current password', allowTyping: true }, []);
  useFocusZone('newPw', 2, { label: 'New password', allowTyping: true }, []);
  useFocusZone('confirmPw', 3, { label: 'Confirm password', allowTyping: true }, []);
  useFocusZone(
    'save',
    4,
    {
      label: 'Save password',
      onEnter: () => formRef.current?.requestSubmit(),
    },
    []
  );
  useFocusZone(
    'reset',
    5,
    {
      label: 'Reset default',
      onEnter: () => resetDefault(),
    },
    []
  );

  const changeAdminPassword = (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (currentPw !== creds.password) {
      setErr('Current password is incorrect');
      return;
    }
    if (newPw.length < 4) {
      setErr('New password must be at least 4 characters');
      return;
    }
    if (newPw !== confirmPw) {
      setErr('Passwords do not match');
      return;
    }
    setAdminCreds(adminId.trim() || DEFAULT_ADMIN_ID, newPw);
    setMsg('Admin login updated for this PC/browser. Mobile app seller login still uses its own settings unless you match manually.');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  };

  const resetDefault = () => {
    if (!window.confirm('Reset web admin login to Admin / 852585?')) return;
    setAdminCreds(DEFAULT_ADMIN_ID, DEFAULT_ADMIN_PASSWORD);
    setAdminId(DEFAULT_ADMIN_ID);
    setMsg('Reset to default Admin / 852585');
  };

  return (
    <div>
      <h1 className="page-title">Settings</h1>
      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <div className="card" style={{ maxWidth: 520, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8, color: 'var(--primary)' }}>Keyboard shortcuts</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Turn on <strong>Enter + arrow keys</strong> and <strong>Alt + letter</strong> shortcuts for faster
          navigation. Default is <strong>Off</strong> until you enable it.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '14px 16px',
            borderRadius: 10,
            background: shortcutsOn ? '#e8f3e8' : '#f5f5f5',
            border: `2px solid ${shortcutsOn ? 'var(--secondary)' : '#ddd'}`,
          }}
        >
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>
              Key functions: {shortcutsOn ? 'ON' : 'OFF'}
            </strong>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {shortcutsOn
                ? 'Enter, arrows, and Alt shortcuts are active'
                : 'Mouse and normal typing only — no shortcut keys'}
            </span>
          </div>
          <label className="toggle-switch" title="Enable or disable keyboard shortcuts">
            <input
              type="checkbox"
              checked={shortcutsOn}
              onChange={(e) => toggleShortcuts(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        {!shortcutsOn && (
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, marginBottom: 0 }}>
            Tip: Turn this ON when you want to use keyboard navigation on Add Entry, Billing, etc.
          </p>
        )}
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16, color: 'var(--primary)' }}>Change admin password</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          This changes login for the <strong>web admin panel only</strong> (stored in this browser).
          Customer app passwords are changed under Customers → Edit.
        </p>
        <form ref={formRef} onSubmit={changeAdminPassword}>
          <FocusZone id="adminId" className="field">
            <label>Admin ID</label>
            <input value={adminId} onChange={(e) => setAdminId(e.target.value)} />
          </FocusZone>
          <FocusZone id="currentPw" className="field">
            <label>Current password</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </FocusZone>
          <FocusZone id="newPw" className="field">
            <label>New password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </FocusZone>
          <FocusZone id="confirmPw" className="field">
            <label>Confirm new password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </FocusZone>
          <FocusZone id="save">
            <button type="submit" className="btn">
              Save
            </button>
          </FocusZone>
          <FocusZone id="reset">
            <button type="button" className="btn btn-secondary" style={{ marginLeft: 10 }} onClick={resetDefault}>
              Reset default
            </button>
          </FocusZone>
        </form>
      </div>

      <style>{`
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 52px;
          height: 28px;
          flex-shrink: 0;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background: #ccc;
          border-radius: 28px;
          transition: 0.2s;
        }
        .toggle-slider::before {
          content: '';
          position: absolute;
          height: 22px;
          width: 22px;
          left: 3px;
          bottom: 3px;
          background: #fff;
          border-radius: 50%;
          transition: 0.2s;
        }
        .toggle-switch input:checked + .toggle-slider {
          background: var(--secondary);
        }
        .toggle-switch input:checked + .toggle-slider::before {
          transform: translateX(24px);
        }
      `}</style>
    </div>
  );
}
