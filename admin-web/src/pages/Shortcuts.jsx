import { Link } from 'react-router-dom';
import { SHORTCUT_GROUPS } from '../lib/keyboardShortcuts';

export default function Shortcuts() {
  return (
    <div>
      <h1 className="page-title">Keyboard shortcuts</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 20, maxWidth: 640 }}>
        Use these keys for faster work on the admin panel. Shortcuts work when your cursor is
        not inside a text box, dropdown, or date field.
      </p>

      <div className="alert alert-success" style={{ maxWidth: 640, marginBottom: 24 }}>
        <strong>Default is OFF.</strong> Go to <strong>Settings → Keyboard shortcuts</strong> and turn the switch{' '}
        <strong>ON</strong> to use Enter, arrows, and Alt shortcuts. When OFF, use mouse and normal typing only.
      </div>

      {SHORTCUT_GROUPS.map((group) => (
        <div key={group.title} className="card" style={{ marginBottom: 20, maxWidth: 720 }}>
          <h2 style={{ fontSize: 17, color: 'var(--primary)', marginBottom: 8 }}>{group.title}</h2>
          {group.hint && (
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{group.hint}</p>
          )}
          <table className="data shortcuts-table">
            <thead>
              <tr>
                <th style={{ width: 200 }}>Shortcut</th>
                <th>Function</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((item) => (
                <tr key={item.keys + item.action}>
                  <td>
                    {item.keys.split(' + ').map((part, i) => (
                      <span key={part}>
                        {i > 0 && <span className="kbd-plus"> + </span>}
                        <kbd className="kbd">{part}</kbd>
                      </span>
                    ))}
                  </td>
                  <td>{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 17, color: 'var(--primary)', marginBottom: 12 }}>Sidebar quick reference</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          Each menu item shows its shortcut on the left panel.
        </p>
        <Link to="/" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
