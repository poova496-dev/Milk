import { useEffect, useState } from 'react';

const KEYBOARD_KEY = 'mmf_keyboard_shortcuts';
export const KEYBOARD_SHORTCUTS_EVENT = 'mmf-keyboard-shortcuts-change';

/** Default is OFF — enable in Settings when ready. */
export function isKeyboardShortcutsEnabled() {
  try {
    const raw = localStorage.getItem(KEYBOARD_KEY);
    if (raw === null) return false;
    return raw === '1' || raw === 'true';
  } catch (e) {
    return false;
  }
}

export function setKeyboardShortcutsEnabled(enabled) {
  localStorage.setItem(KEYBOARD_KEY, enabled ? '1' : '0');
  window.dispatchEvent(
    new CustomEvent(KEYBOARD_SHORTCUTS_EVENT, { detail: { enabled: Boolean(enabled) } })
  );
}

export function useKeyboardShortcutsEnabled() {
  const [enabled, setEnabled] = useState(isKeyboardShortcutsEnabled);

  useEffect(() => {
    const onChange = (e) => setEnabled(Boolean(e.detail?.enabled));
    window.addEventListener(KEYBOARD_SHORTCUTS_EVENT, onChange);
    return () => window.removeEventListener(KEYBOARD_SHORTCUTS_EVENT, onChange);
  }, []);

  return enabled;
}
