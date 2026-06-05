export const DATE_RANGE_TABS = ['today', 'week', 'month', 'all', 'custom'];
export const PAYMENT_RANGE_TABS = ['today', 'week', 'month', 'all'];
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank'];

export function cycleList(list, current, direction) {
  const idx = list.indexOf(current);
  if (idx === -1) return current;
  if (direction === 'prev') {
    return list[idx <= 0 ? list.length - 1 : idx - 1];
  }
  return list[idx >= list.length - 1 ? 0 : idx + 1];
}

export function cycleTab(current, direction) {
  const idx = DATE_RANGE_TABS.indexOf(current);
  if (idx === -1) return current;
  if (direction === 'prev') {
    return DATE_RANGE_TABS[idx <= 0 ? DATE_RANGE_TABS.length - 1 : idx - 1];
  }
  return DATE_RANGE_TABS[idx >= DATE_RANGE_TABS.length - 1 ? 0 : idx + 1];
}

export function cycleSelectOption(options, currentValue, direction, getValue = (o) => o) {
  if (!options.length) return currentValue;
  const values = options.map(getValue);
  let idx = values.findIndex((v) => String(v) === String(currentValue));
  if (idx < 0) idx = 0;
  const next = direction > 0
    ? (idx + 1) % values.length
    : (idx - 1 + values.length) % values.length;
  return values[next];
}

export function shiftDateString(dateStr, days, maxDate) {
  const base = dateStr || maxDate;
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  if (maxDate) {
    const max = new Date(`${maxDate}T23:59:59`);
    if (d > max) return maxDate;
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
