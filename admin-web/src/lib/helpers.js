export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

export const formatDateDB = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatCurrency = (amount) => {
  if (amount == null) return '₹0.00';
  return `₹${parseFloat(amount).toFixed(2)}`;
};

export const formatLiters = (liters) => `${parseFloat(liters || 0).toFixed(2)} L`;

export const todayDB = () => formatDateDB(new Date());

export const calculateAmount = (quantity, ratePerLiter) =>
  parseFloat((parseFloat(quantity) * parseFloat(ratePerLiter)).toFixed(2));

/** Milk type labels — matches mobile Add Entry (custom = manual quantity). */
export const getMilkTypeLabel = (type) => {
  switch (String(type)) {
    case '1':
      return '1 Liter';
    case '0.5':
      return '½ Liter';
    case '0.25':
      return '¼ Liter';
    case '1.75':
      return '1.75 Liter';
    case 'custom':
    case 'manual':
      return 'Manual';
    default:
      return type || '—';
  }
};

export const QUANTITY_OPTIONS = [
  { label: '¼ L', value: 0.25, display: '0.25' },
  { label: '½ L', value: 0.5, display: '0.5' },
  { label: '1 L', value: 1, display: '1' },
  { label: '1.75 L', value: 1.75, display: '1.75' },
];

/** Dashboard / report date range → { startDate, endDate, label }. */
export function getDashboardRange(range, customStart, customEnd) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const today = todayDB();

  if (range === 'today') {
    return { startDate: today, endDate: today, label: 'Today' };
  }
  if (range === 'week') {
    const w = new Date(now);
    w.setDate(w.getDate() - 7);
    return {
      startDate: `${w.getFullYear()}-${pad(w.getMonth() + 1)}-${pad(w.getDate())}`,
      endDate: today,
      label: 'Last 7 days',
    };
  }
  if (range === 'month') {
    return {
      startDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
      endDate: today,
      label: 'This month',
    };
  }
  if (range === 'custom' && customStart && customEnd) {
    const a = customStart <= customEnd ? customStart : customEnd;
    const b = customStart <= customEnd ? customEnd : customStart;
    return {
      startDate: a,
      endDate: b,
      label: `${formatDate(a)} – ${formatDate(b)}`,
    };
  }
  return { startDate: null, endDate: null, label: 'All time' };
}
