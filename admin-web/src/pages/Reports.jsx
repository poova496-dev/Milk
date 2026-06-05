import { useEffect, useState } from 'react';
import { getBusinessReport, getCustomers } from '../lib/api';
import {
  formatCurrency,
  formatLiters,
  formatDate,
  todayDB,
  getDashboardRange,
} from '../lib/helpers';
import { generateReportHTML, printReport } from '../lib/report';
import { useAdminRefresh } from '../hooks/useAdminRefresh';
import { FocusZone, useFocusZone } from '../context/FocusNavContext';
import { cycleSelectOption, cycleTab } from '../lib/focusHelpers';

export default function Reports() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [range, setRange] = useState('month');
  const [customStart, setCustomStart] = useState(todayDB());
  const [customEnd, setCustomEnd] = useState(todayDB());
  const [periodLabel, setPeriodLabel] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [view, setView] = useState('customer');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const { startDate, endDate, label } = getDashboardRange(range, customStart, customEnd);
      setPeriodLabel(label);
      const data = await getBusinessReport({
        startDate,
        endDate,
        customer_id: customerId || undefined,
      });
      setReport(data);
    } catch (e) {
      setErr(e.message || 'Failed to load report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCustomers(true).then(setCustomers).catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [range, customStart, customEnd, customerId]);

  useAdminRefresh(load);

  const handlePrint = () => {
    if (!report) return;
    const cust = customers.find((c) => String(c.customer_id) === String(customerId));
    const html = generateReportHTML({
      periodLabel,
      summary: report.summary,
      customers: report.customers,
      daily: report.daily,
      byMethod: report.byMethod,
      customerFilter: cust?.customer_name,
    });
    printReport(html);
  };

  const allCustomers = [{ customer_id: '', customer_name: 'All customers' }, ...customers];
  const viewTabs = ['customer', 'daily'];

  useFocusZone(
    'customer',
    0,
    {
      label: 'Customer filter',
      onArrowUp: () => {
        setCustomerId(String(cycleSelectOption(allCustomers, customerId, -1, (c) => c.customer_id)));
        return true;
      },
      onArrowDown: () => {
        setCustomerId(String(cycleSelectOption(allCustomers, customerId, 1, (c) => c.customer_id)));
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

  useFocusZone(
    'view',
    2,
    {
      label: 'Report view',
      onArrowLeft: () => {
        setView((v) => viewTabs[Math.max(0, viewTabs.indexOf(v) - 1)]);
        return true;
      },
      onArrowRight: () => {
        setView((v) => viewTabs[Math.min(viewTabs.length - 1, viewTabs.indexOf(v) + 1)]);
        return true;
      },
    },
    [view]
  );

  useFocusZone(
    'print',
    3,
    {
      label: 'Print report',
      onEnter: () => handlePrint(),
    },
    [report, periodLabel, customers, customerId]
  );

  const s = report?.summary;

  return (
    <div>
      <h1 className="page-title">Reports</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
        Milk sales, collections, and customer-wise summary. Print or save as PDF from the browser.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <FocusZone id="customer">
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          style={{ padding: 10, borderRadius: 8, minWidth: 180 }}
        >
          <option value="">All customers</option>
          {customers.map((c) => (
            <option key={c.customer_id} value={c.customer_id}>
              {c.customer_name}
            </option>
          ))}
        </select>
        </FocusZone>
        <FocusZone id="range" className="tabs">
          {['today', 'week', 'month', 'all', 'custom'].map((r) => (
            <button
              key={r}
              type="button"
              className={`tab ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === 'all' ? 'All time' : r === 'custom' ? 'Custom' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </FocusZone>
        {range === 'custom' && (
          <>
            <input type="date" value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)} />
            <span>to</span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              max={todayDB()}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </>
        )}
        <button type="button" className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
        <FocusZone id="print">
          <button type="button" className="btn btn-sm" onClick={handlePrint} disabled={!report}>
            Print report
          </button>
        </FocusZone>
      </div>

      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        Period: <strong>{periodLabel}</strong>
      </p>

      {err && <div className="alert alert-error">{err}</div>}
      {loading && !report ? (
        <p>Loading…</p>
      ) : s ? (
        <>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="stat-value">{formatLiters(s.totalLiters)}</div>
              <div className="stat-label">Total liters</div>
            </div>
            <div className="card">
              <div className="stat-value">{formatCurrency(s.totalAmount)}</div>
              <div className="stat-label">Milk amount</div>
            </div>
            <div className="card">
              <div className="stat-value" style={{ color: 'var(--secondary)' }}>
                {formatCurrency(s.totalCollected)}
              </div>
              <div className="stat-label">Collected ({s.paymentCount} payments)</div>
            </div>
            <div className="card">
              <div
                className="stat-value"
                style={s.notBilledAmount > 0 ? { color: 'var(--warn)' } : undefined}
              >
                {formatCurrency(s.notBilledAmount)}
              </div>
              <div className="stat-label">Not billed ({s.entryCount} entries)</div>
            </div>
          </div>

          {report.byMethod.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, marginBottom: 12, color: 'var(--primary)' }}>Collections by method</h2>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {report.byMethod.map((m) => (
                  <span key={m.method} className="badge badge-green" style={{ padding: '8px 14px', fontSize: 13 }}>
                    {m.method}: {formatCurrency(m.amount)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <FocusZone id="view" className="tabs" style={{ marginBottom: 16 }}>
            {[
              { id: 'customer', label: 'By customer' },
              { id: 'daily', label: 'By day' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tab ${view === t.id ? 'active' : ''}`}
                onClick={() => setView(t.id)}
              >
                {t.label}
              </button>
            ))}
          </FocusZone>

          {view === 'customer' && (
            <div className="card table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Entries</th>
                    <th>Liters</th>
                    <th>Amount</th>
                    <th>Not billed</th>
                    <th>Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {report.customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                        No data for this period
                      </td>
                    </tr>
                  ) : (
                    report.customers.map((c) => (
                      <tr key={c.customer_id}>
                        <td>
                          <strong>{c.customer_name}</strong>
                        </td>
                        <td>{c.entryCount}</td>
                        <td>{formatLiters(c.liters)}</td>
                        <td>{formatCurrency(c.amount)}</td>
                        <td>{formatCurrency(c.notBilled)}</td>
                        <td>{formatCurrency(c.collected)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {view === 'daily' && (
            <div className="card table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Entries</th>
                    <th>Liters</th>
                    <th>Amount</th>
                    <th>Not billed</th>
                  </tr>
                </thead>
                <tbody>
                  {report.daily.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                        No entries in this period
                      </td>
                    </tr>
                  ) : (
                    report.daily.map((d) => (
                      <tr key={d.date}>
                        <td>{formatDate(d.date)}</td>
                        <td>{d.entries}</td>
                        <td>{formatLiters(d.liters)}</td>
                        <td>{formatCurrency(d.amount)}</td>
                        <td>{formatCurrency(d.notBilled)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
