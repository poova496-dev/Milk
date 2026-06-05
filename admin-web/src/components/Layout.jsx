import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearSession } from '../lib/auth';
import { LOGO_BASE64 } from '../lib/logoBase64';
import { handleGlobalShortcut } from '../lib/keyboardShortcuts';
import { isKeyboardShortcutsEnabled, useKeyboardShortcutsEnabled } from '../lib/preferences';
import { FocusNavProvider } from '../context/FocusNavContext';
import FocusNavBar from './FocusNavBar';

const nav = [
  { to: '/', label: 'Dashboard', end: true, shortcut: 'Alt+D' },
  { to: '/customers', label: 'Customers', shortcut: 'Alt+C' },
  { to: '/entry', label: 'Add Entry', shortcut: 'Alt+E' },
  { to: '/rate', label: 'Fixed Rate', shortcut: 'Alt+F' },
  { to: '/billing', label: 'Billing & Print', shortcut: 'Alt+B' },
  { to: '/history', label: 'Entry History', shortcut: 'Alt+H' },
  { to: '/payments', label: 'Payment History', shortcut: 'Alt+P' },
  { to: '/reports', label: 'Reports', shortcut: 'Alt+R' },
  { to: '/orders', label: 'Orders', shortcut: 'Alt+O' },
  { to: '/settings', label: 'Settings', shortcut: 'Alt+S' },
  { to: '/shortcuts', label: 'Shortcuts', shortcut: 'Alt+K' },
];

export default function Layout() {
  const navigate = useNavigate();
  const shortcutsOn = useKeyboardShortcutsEnabled();

  useEffect(() => {
    const onKeyDown = (e) => handleGlobalShortcut(e, navigate, isKeyboardShortcutsEnabled());
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  const logout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          {LOGO_BASE64 ? (
            <img src={LOGO_BASE64} alt="Manjula Milk" className="brand-logo" />
          ) : (
            <span className="brand-icon">🥛</span>
          )}
          <div>
            <strong>Manjula Milk</strong>
            <small>Admin Panel</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
            >
              <span>{item.label}</span>
              {shortcutsOn && item.shortcut && <kbd className="nav-kbd">{item.shortcut}</kbd>}
            </NavLink>
          ))}
        </nav>
        {shortcutsOn ? (
          <p className="sidebar-hint">
            <kbd className="nav-kbd">Enter</kbd> then arrows &nbsp;·&nbsp; <kbd className="nav-kbd">?</kbd> help
          </p>
        ) : (
          <p className="sidebar-hint">Keyboard shortcuts are off — enable in Settings</p>
        )}
        <button type="button" className="btn btn-secondary logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>
      <main className="main-content">
        <FocusNavProvider>
          <FocusNavBar />
          <Outlet />
        </FocusNavProvider>
      </main>
      <style>{`
        .app-shell { display: flex; min-height: 100vh; }
        .sidebar {
          width: var(--sidebar);
          background: var(--primary);
          color: #fff;
          display: flex;
          flex-direction: column;
          padding: 20px 0;
          flex-shrink: 0;
          position: relative;
          z-index: 110;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.15);
        }
        .brand-icon { font-size: 32px; }
        .brand-logo {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: contain;
          background: #fff;
          flex-shrink: 0;
          padding: 2px;
        }
        .sidebar-brand strong { display: block; font-size: 16px; }
        .sidebar-brand small { opacity: 0.75; font-size: 11px; }
        .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
        .nav-link {
          padding: 10px 14px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          opacity: 0.85;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .nav-link:hover { background: rgba(255,255,255,0.1); opacity: 1; }
        .nav-link.active { background: rgba(255,255,255,0.2); opacity: 1; }
        .nav-kbd {
          font-size: 10px;
          font-family: inherit;
          padding: 2px 5px;
          border-radius: 4px;
          background: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.9);
          font-weight: 600;
          flex-shrink: 0;
        }
        .sidebar-hint {
          font-size: 11px;
          opacity: 0.75;
          padding: 8px 20px 0;
          margin: 0;
        }
        .logout-btn { margin: 12px 20px 0; }
        .main-content { flex: 1; padding: 28px 32px; overflow: auto; }
        @media (max-width: 768px) {
          .app-shell { flex-direction: column; }
          .sidebar { width: 100%; }
          .sidebar-nav { flex-direction: row; flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
