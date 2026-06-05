/** Keyboard shortcut definitions — single source for handler + help page. */

export const NAV_ORDER = [
  '/',
  '/customers',
  '/entry',
  '/rate',
  '/billing',
  '/history',
  '/payments',
  '/reports',
  '/orders',
  '/settings',
  '/shortcuts',
];

export const SHORTCUT_GROUPS = [
  {
    title: 'Enable keyboard shortcuts',
    hint: 'Default is OFF. Go to Settings → Keyboard shortcuts and turn ON to use the keys below.',
    items: [
      { keys: 'Settings', action: 'Settings page → Keyboard shortcuts toggle (ON / OFF)' },
      { keys: 'Default', action: 'Key functions are OFF until you enable them' },
    ],
  },
  {
    title: 'Page keyboard navigation (when ON)',
    hint: 'Press Enter first to start. Arrows move inside the page — not between sidebar menu items.',
    items: [
      { keys: 'Enter', action: 'Start page navigation / lock selection / save' },
      { keys: '↓', action: 'Next field on the page' },
      { keys: '↑', action: 'Previous field on the page' },
      { keys: '← / →', action: 'Change value in current field (date, tabs, milk type, payment method)' },
      { keys: 'Add Entry', action: 'Enter → ↑↓ customer → Enter → ↓ date → ←→ date → ↓ milk → arrows → Enter → ↓ Save → Enter' },
      { keys: 'Billing', action: 'Enter → ↑↓ customer → ↓ method ←→ → ↓ dates ←→ → ↓ Calculate → Enter → ↓ paid → ↓ Save → Enter' },
      { keys: 'Dashboard / History', action: 'Enter → ←→ change date range tab → ↓ refresh → Enter' },
      { keys: 'Orders', action: 'Enter → ←→ tab → ↓ order list ↑↓ → Enter accept/deliver → ↑↓ payment → Enter' },
    ],
  },
  {
    title: 'Open pages (Alt + letter)',
    hint: 'Hold Alt and press the letter. Works when you are not typing in a box.',
    items: [
      { keys: 'Alt + D', action: 'Go to Dashboard' },
      { keys: 'Alt + C', action: 'Go to Customers' },
      { keys: 'Alt + E', action: 'Go to Add Entry' },
      { keys: 'Alt + F', action: 'Go to Fixed Rate' },
      { keys: 'Alt + B', action: 'Go to Billing & Print' },
      { keys: 'Alt + H', action: 'Go to Entry History' },
      { keys: 'Alt + P', action: 'Go to Payment History' },
      { keys: 'Alt + R', action: 'Go to Reports' },
      { keys: 'Alt + O', action: 'Go to Orders' },
      { keys: 'Alt + S', action: 'Go to Settings' },
      { keys: 'Alt + K', action: 'Go to Shortcuts (this page)' },
      { keys: '?', action: 'Go to Shortcuts (same as Alt + K)' },
    ],
  },
  {
    title: 'Quick actions',
    items: [
      { keys: 'Alt + Shift + R', action: 'Refresh data on the current page' },
      { keys: 'Esc', action: 'Close open dialog / popup (browser)' },
    ],
  },
  {
    title: 'Browser (built-in)',
    items: [
      { keys: 'Ctrl + P', action: 'Print (use on Billing, Reports, Payment History)' },
      { keys: 'Ctrl + R', action: 'Reload entire browser tab' },
      { keys: 'F5', action: 'Reload entire browser tab' },
    ],
  },
];

/** Alt + letter → route path */
export const NAV_SHORTCUTS = {
  d: '/',
  c: '/customers',
  e: '/entry',
  f: '/rate',
  b: '/billing',
  h: '/history',
  p: '/payments',
  r: '/reports',
  o: '/orders',
  s: '/settings',
  k: '/shortcuts',
};

export function isTypingInField(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable === true;
}

/**
 * Handle global menu shortcuts (Alt+letter, ?, refresh). Arrow/Enter handled by FocusNav.
 */
export function handleGlobalShortcut(e, navigate, shortcutsEnabled = true) {
  if (!shortcutsEnabled) return false;
  if (isTypingInField(e.target)) return false;

  const key = e.key.toLowerCase();

  if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
    e.preventDefault();
    navigate('/shortcuts');
    return true;
  }

  if (e.altKey && e.shiftKey && key === 'r') {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('admin-refresh'));
    return true;
  }

  if (e.altKey && !e.ctrlKey && !e.metaKey) {
    const navPath = NAV_SHORTCUTS[key];
    if (navPath) {
      e.preventDefault();
      navigate(navPath);
      return true;
    }
  }

  return false;
}
