import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isTypingInField } from '../lib/keyboardShortcuts';
import { isKeyboardShortcutsEnabled, KEYBOARD_SHORTCUTS_EVENT } from '../lib/preferences';

const FocusNavContext = createContext(null);

export function FocusNavProvider({ children }) {
  const location = useLocation();
  const zonesRef = useRef([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [tick, setTick] = useState(0);
  const [shortcutsOn, setShortcutsOn] = useState(isKeyboardShortcutsEnabled);

  const bump = () => setTick((t) => t + 1);

  useEffect(() => {
    setActiveIndex(-1);
    zonesRef.current = [];
    bump();
  }, [location.pathname]);

  useEffect(() => {
    const onPrefChange = (e) => {
      const enabled = Boolean(e.detail?.enabled);
      setShortcutsOn(enabled);
      if (!enabled) setActiveIndex(-1);
    };
    window.addEventListener(KEYBOARD_SHORTCUTS_EVENT, onPrefChange);
    return () => window.removeEventListener(KEYBOARD_SHORTCUTS_EVENT, onPrefChange);
  }, []);

  const registerZone = useCallback((zone) => {
    const list = zonesRef.current.filter((z) => z.id !== zone.id);
    list.push(zone);
    list.sort((a, b) => a.order - b.order);
    zonesRef.current = list;
    bump();
    return () => {
      zonesRef.current = zonesRef.current.filter((z) => z.id !== zone.id);
      bump();
    };
  }, []);

  const zones = useMemo(() => [...zonesRef.current].sort((a, b) => a.order - b.order), [tick]);

  const goTo = useCallback((index) => {
    const list = zonesRef.current;
    if (!list.length) return;
    const next = Math.max(0, Math.min(list.length - 1, index));
    setActiveIndex(next);
    list[next]?.onActivate?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!shortcutsOn) return;
      const list = zonesRef.current;
      if (!list.length) return;

      // Allow Alt shortcuts and ? to pass through (handled in Layout)
      if (e.altKey || e.key === '?') return;

      const inField = isTypingInField(e.target);
      const idx = activeIndex;
      const zone = idx >= 0 ? list[idx] : null;

      if (e.key === 'Enter') {
        if (inField && idx < 0) return;
        e.preventDefault();
        if (idx < 0) {
          goTo(0);
          return;
        }
        zone?.onEnter?.();
        return;
      }

      if (idx < 0) return;
      if (inField && !zone?.allowTyping) return;

      const consume = (fn) => {
        if (!fn) return false;
        e.preventDefault();
        const handled = fn();
        return handled !== false;
      };

      if (e.key === 'ArrowUp') {
        if (consume(zone?.onArrowUp)) return;
        e.preventDefault();
        goTo(idx - 1);
        return;
      }
      if (e.key === 'ArrowDown') {
        if (consume(zone?.onArrowDown)) return;
        e.preventDefault();
        goTo(idx + 1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (consume(zone?.onArrowLeft)) return;
        return;
      }
      if (e.key === 'ArrowRight') {
        if (consume(zone?.onArrowRight)) return;
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, goTo, shortcutsOn]);

  const value = useMemo(
    () => ({
      registerZone,
      activeIndex: shortcutsOn ? activeIndex : -1,
      activeZoneId: shortcutsOn ? zones[activeIndex]?.id ?? null : null,
      zones,
      goTo,
      shortcutsOn,
    }),
    [registerZone, activeIndex, zones, goTo, shortcutsOn]
  );

  return <FocusNavContext.Provider value={value}>{children}</FocusNavContext.Provider>;
}

export function useFocusNav() {
  const ctx = useContext(FocusNavContext);
  if (!ctx) throw new Error('useFocusNav requires FocusNavProvider');
  return ctx;
}

/** Register keyboard focus zone for current page. */
export function useFocusZone(id, order, handlers, deps = []) {
  const { registerZone } = useFocusNav();

  useEffect(() => {
    return registerZone({ id, order, label: handlers.label, ...handlers });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, order, registerZone, ...deps]);
}

export function FocusZone({ id, children, className = '' }) {
  const { activeZoneId } = useFocusNav();
  const active = activeZoneId === id;
  return (
    <div className={`focus-zone ${active ? 'focus-zone-active' : ''} ${className}`.trim()} data-focus-zone={id}>
      {active && <span className="focus-zone-hint">Active — use arrow keys, Enter ↵</span>}
      {children}
    </div>
  );
}
