import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCustomerCount,
  getEntriesSummary,
  getCollectedInPeriod,
  getTotalPendingAmount,
  getOrderSummaryCounts,
} from '../lib/api';
import { formatCurrency, formatLiters, formatDate, todayDB, getDashboardRange } from '../lib/helpers';
import { useAdminRefresh } from '../hooks/useAdminRefresh';
import { FocusZone, useFocusZone } from '../context/FocusNavContext';
import { cycleTab } from '../lib/focusHelpers';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');
  const [range, setRange] = useState('today');
  const [customStart, setCustomStart] = useState(todayDB());
  const [customEnd, setCustomEnd] = useState(todayDB());
  const [rangeLabel, setRangeLabel] = useState('Today');

  const load = async () => {
    try {
      const { startDate, endDate, label } = getDashboardRange(range, customStart, customEnd);
      setRangeLabel(label);

      const [customers, entries, collected, pending, orders] = await Promise.all([
        getCustomerCount(),
        getEntriesSummary(startDate, endDate),
        getCollectedInPeriod(startDate, endDate),
        getTotalPendingAmount(),
        getOrderSummaryCounts(),
      ]);
      setStats({ customers, entries, collected, pending, orders, startDate, endDate });
      setErr('');
    } catch (e) {
      setErr(e.message || 'Failed to load dashboard');
    }
  };

  useEffect(() => {
    load();
  }, [range, customStart, customEnd]);

  useAdminRefresh(load);

  useFocusZone(
    'range',
    0,
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
    'refresh',
    1,
    {
      label: 'Refresh',
      onEnter: () => load(),
    },
    []
  );

  if (!stats && !err) return <p>Loading…</p>;

  const periodSuffix = range === 'today' ? '' : ` (${rangeLabel})`;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <FocusZone id="range" className="tabs">
          {['today', 'week', 'month', 'all', 'custom'].map((r) => (
            <button
              key={r}
              type="button"
              className={`tab ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === 'all'
                ? 'All time'
                : r === 'custom'
                  ? 'Custom'
                  : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </FocusZone>
        {range === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              From
              <input
                type="date"
                value={customStart}
                max={customEnd || todayDB()}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{ marginLeft: 6, padding: 8, borderRadius: 8 }}
              />
            </label>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              To
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={todayDB()}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{ marginLeft: 6, padding: 8, borderRadius: 8 }}
              />
            </label>
          </div>
        )}
      </div>

      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        Showing data for: <strong>{rangeLabel}</strong>
        {stats?.startDate && stats?.endDate && (
          <span>
            {' '}
            ({formatDate(stats.startDate)} – {formatDate(stats.endDate)})
          </span>
        )}
      </p>

      {err && <div className="alert alert-error">{err}</div>}
      {stats && (
        <>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="stat-value">{formatLiters(stats.entries.totalLiters)}</div>
              <div className="stat-label">Liters{periodSuffix}</div>
            </div>
            <div className="card">
              <div className="stat-value">{formatCurrency(stats.entries.totalAmount)}</div>
              <div className="stat-label">Milk amount{periodSuffix}</div>
            </div>
            <div className="card">
              <div className="stat-value">{stats.entries.entryCount}</div>
              <div className="stat-label">Entries{periodSuffix}</div>
            </div>
            <div className="card">
              <div className="stat-value" style={{ color: 'var(--secondary)' }}>
                {formatCurrency(stats.collected)}
              </div>
              <div className="stat-label">Collected{periodSuffix}</div>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="card">
              <div
                className="stat-value"
                style={stats.pending > 0 ? { color: 'var(--danger)' } : undefined}
              >
                {formatCurrency(stats.pending)}
              </div>
              <div className="stat-label">Pending collections (all time)</div>
            </div>
            <div className="card">
              <div
                className="stat-value"
                style={stats.entries.notBilledAmount > 0 ? { color: 'var(--warn)' } : undefined}
              >
                {formatCurrency(stats.entries.notBilledAmount)}
              </div>
              <div className="stat-label">Not billed in period</div>
            </div>
            <div className="card">
              <div className="stat-value">{stats.customers}</div>
              <div className="stat-label">Active customers</div>
            </div>
          </div>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--primary)' }}>Orders (live)</h2>
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <Link to="/orders?tab=pending" className="card" style={{ textDecoration: 'none' }}>
              <div className="stat-value" style={{ color: 'var(--warn)' }}>
                {stats.orders.pendingToAccept}
              </div>
              <div className="stat-label">To Accept →</div>
            </Link>
            <Link to="/orders?tab=accepted" className="card" style={{ textDecoration: 'none' }}>
              <div className="stat-value" style={{ color: '#1565c0' }}>
                {stats.orders.pendingToDeliver}
              </div>
              <div className="stat-label">To Deliver →</div>
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/entry" className="btn">
              Add milk entry
            </Link>
            <Link to="/rate" className="btn btn-secondary">
              Fixed rate
            </Link>
            <Link to="/billing" className="btn btn-secondary">
              Billing &amp; print
            </Link>
            <Link to="/reports" className="btn btn-secondary">
              Reports
            </Link>
            <Link to="/shortcuts" className="btn btn-secondary">
              Shortcuts (?)
            </Link>
          </div>
        </>
      )}
      <FocusZone id="refresh">
        <button type="button" className="btn btn-secondary" style={{ marginTop: 20 }} onClick={load}>
          Refresh
        </button>
      </FocusZone>
    </div>
  );
}
