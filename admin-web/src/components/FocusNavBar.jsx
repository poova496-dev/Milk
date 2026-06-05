import { useFocusNav } from '../context/FocusNavContext';

export default function FocusNavBar() {
  const { activeIndex, zones, shortcutsOn } = useFocusNav();

  if (!shortcutsOn) return null;

  if (activeIndex < 0) {
    return (
      <p className="focus-nav-prompt">
        Press <kbd className="kbd">Enter</kbd> to start keyboard navigation on this page
      </p>
    );
  }

  const zone = zones[activeIndex];
  return (
    <p className="focus-nav-prompt focus-nav-active">
      Step {activeIndex + 1}/{zones.length}: <strong>{zone?.label || zone?.id}</strong>
      <span className="focus-nav-keys">
        <kbd className="kbd">↑↓</kbd> move &nbsp;
        <kbd className="kbd">←→</kbd> change value &nbsp;
        <kbd className="kbd">Enter</kbd> confirm
      </span>
    </p>
  );
}
