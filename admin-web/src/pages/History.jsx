import { useEffect, useState } from 'react';
import { getDailyEntries, deleteEntry, getCustomers } from '../lib/api';
import { formatCurrency, formatLiters, formatDate, todayDB, getMilkTypeLabel } from '../lib/helpers';
import { useAdminRefresh } from '../hooks/useAdminRefresh';
import { FocusZone, useFocusZone } from '../context/FocusNavContext';
import { cycleSelectOption, cycleTab } from '../lib/focusHelpers';

export default function History() {
  const [entries, setEntries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [range, setRange] = useState('month');

  const load = async () => {
    const filters = {};
    if (customerId) filters.customer_id = customerId;
    const now = new Date();
    if (range === 'today') {
      filters.startDate = todayDB();
      filters.endDate = todayDB();
    } else if (range === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      filters.startDate = `${w.getFullYear()}-${String(w.getMonth() + 1).padStart(2, '0')}-${String(w.getDate()).padStart(2, '0')}`;
      filters.endDate = todayDB();
    } else if (range === 'month') {
      filters.startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      filters.endDate = todayDB();
    }
    const list = await getDailyEntries(filters);
    setEntries(list.map((e) => ({ ...e, is_billed: e.is_billed === true })));
  };

  useEffect(() => {
    getCustomers(true).then(setCustomers);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [customerId, range]);

  useAdminRefresh(load);

  const allCustomers = [{ customer_id: '', customer_name: 'All customers' }, ...customers];

  useFocusZone(
    'customer',
    0,
    {
      label: 'Customer filter',
      onArrowUp: () => {
        const next = cycleSelectOption(allCustomers, customerId, -1, (c) => c.customer_id);
        setCustomerId(String(next));
        return true;
      },
      onArrowDown: () => {
        const next = cycleSelectOption(allCustomers, customerId, 1, (c) => c.customer_id);
        setCustomerId(String(next));
        return true;
      },
    },
    [customers, customerId]
  );

  useFocusZone(
    'range',
    1,
    {
      label: 'Date range',
      onArrowLeft: () => {
        setRange((r) => cycleTab(r, 'prev'));
        return true;
      },
      onArrowRight: () => {
        setRange((r) => cycleTab(r, 'next'));
        return true;
      },
    },
    [range]
  );

  const remove = async (e) => {
    if (!window.confirm('Delete this entry?')) return;
    await deleteEntry(e.entry_id);
    load();
  };

  const notBilled = entries.filter((e) => !e.is_billed).length;

  return (
    <div>
      <h1 className="page-title">Entry History</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <FocusZone id="customer">
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={{ padding: 10, borderRadius: 8 }}>
          <option value="">All customers</option>
          {customers.map((c) => (
            <option key={c.customer_id} value={c.customer_id}>
              {c.customer_name}
            </option>
          ))}
        </select>
        </FocusZone>
        <FocusZone id="range" className="tabs">
          {['today', 'week', 'month', 'all'].map((r) => (
            <button
              key={r}
              type="button"
              className={`tab ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === 'all' ? 'All time' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </FocusZone>
      </div>
      <p style={{ marginBottom: 12 }}>
        <strong>{entries.length}</strong> entries · <strong style={{ color: 'var(--danger)' }}>{notBilled}</strong> not billed
      </p>
      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Date</th>
              <th>Type</th>
              <th>Liters</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.entry_id}>
                <td>{e.customer_name}</td>
                <td>{formatDate(e.entry_date)}</td>
                <td>{getMilkTypeLabel(e.milk_type_selected)}</td>
                <td>{formatLiters(e.quantity_liters)}</td>
                <td>{formatCurrency(e.total_amount)}</td>
                <td>
                  <span className={`badge ${e.is_billed ? 'badge-green' : 'badge-red'}`}>
                    {e.is_billed ? 'Billed' : 'Not Billed'}
                  </span>
                </td>
                <td>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(e)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
