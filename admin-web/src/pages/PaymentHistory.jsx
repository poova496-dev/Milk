import { useEffect, useState } from 'react';
import {
  getPaymentHistory,
  getCustomers,
  getInvoiceByPaymentId,
  getEntriesInPeriod,
} from '../lib/api';
import { formatCurrency, formatLiters, formatDate, todayDB } from '../lib/helpers';
import { generateInvoiceHTML, printInvoice } from '../lib/invoice';
import { useAdminRefresh } from '../hooks/useAdminRefresh';
import { FocusZone, useFocusZone } from '../context/FocusNavContext';
import { cycleList, cycleSelectOption, PAYMENT_RANGE_TABS } from '../lib/focusHelpers';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [range, setRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [printingId, setPrintingId] = useState(null);

  const dateFilters = () => {
    const now = new Date();
    if (range === 'today') {
      return { startDate: todayDB(), endDate: todayDB() };
    }
    if (range === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      const pad = (n) => String(n).padStart(2, '0');
      return {
        startDate: `${w.getFullYear()}-${pad(w.getMonth() + 1)}-${pad(w.getDate())}`,
        endDate: todayDB(),
      };
    }
    if (range === 'month') {
      return {
        startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
        endDate: todayDB(),
      };
    }
    return {};
  };

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const filters = { ...dateFilters() };
      if (customerId) filters.customer_id = customerId;
      const list = await getPaymentHistory(filters);
      setPayments(list);
    } catch (e) {
      setErr(e.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCustomers(true).then(setCustomers).catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [customerId, range]);

  useAdminRefresh(load);

  const allCustomers = [{ customer_id: '', customer_name: 'All customers' }, ...customers];

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
        setRange((r) => cycleList(PAYMENT_RANGE_TABS, r, 'prev'));
        return true;
      },
      onArrowRight: () => {
        setRange((r) => cycleList(PAYMENT_RANGE_TABS, r, 'next'));
        return true;
      },
    },
    [range]
  );

  useFocusZone(
    'refresh',
    2,
    {
      label: 'Refresh list',
      onEnter: () => load(),
    },
    [loading]
  );

  const handlePrint = async (payment) => {
    setPrintingId(payment.payment_id);
    setErr('');
    try {
      let invoice = await getInvoiceByPaymentId(payment.payment_id);
      if (!invoice) {
        invoice = {
          invoice_number: `MMF/${new Date(payment.payment_date).getFullYear()}/—`,
          customer_name: payment.customers?.customer_name || 'Customer',
          invoice_date: payment.payment_date,
          bill_start_date: payment.bill_start_date,
          bill_end_date: payment.bill_end_date,
          total_liters: payment.total_liters,
          total_amount: payment.total_amount,
          paid_amount: payment.paid_amount,
        };
      }

      const entries = await getEntriesInPeriod(
        payment.customer_id,
        payment.bill_start_date,
        payment.bill_end_date
      );

      const html = generateInvoiceHTML(invoice, entries);
      printInvoice(html);
    } catch (e) {
      setErr(e.message || 'Failed to print invoice');
    } finally {
      setPrintingId(null);
    }
  };

  const totalCollected = payments.reduce((s, p) => s + parseFloat(p.paid_amount || 0), 0);

  return (
    <div>
      <h1 className="page-title">Payment History</h1>
      <p className="page-subtitle" style={{ color: 'var(--muted)', marginBottom: 16 }}>
        View past payments and reprint invoices (same as mobile app).
      </p>

      {err && <div className="alert alert-error">{err}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <FocusZone id="customer">
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          style={{ padding: 10, borderRadius: 8, minWidth: 200 }}
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
        <FocusZone id="refresh">
        <button type="button" className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
        </FocusZone>
      </div>

      <div className="grid-2" style={{ marginBottom: 20, maxWidth: 520 }}>
        <div className="card">
          <div className="stat-value">{payments.length}</div>
          <div className="stat-label">Payments shown</div>
        </div>
        <div className="card">
          <div className="stat-value" style={{ color: 'var(--secondary)' }}>
            {formatCurrency(totalCollected)}
          </div>
          <div className="stat-label">Total collected</div>
        </div>
      </div>

      {loading && !payments.length ? (
        <p>Loading…</p>
      ) : payments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 18, marginBottom: 8 }}>No payments found</p>
          <p style={{ color: 'var(--muted)' }}>Records appear here after billing or delivery payment.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Date</th>
                <th>Period</th>
                <th>Method</th>
                <th>Liters</th>
                <th>Bill</th>
                <th>Paid</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const name = p.customers?.customer_name || '—';
                return (
                  <tr key={p.payment_id}>
                    <td>
                      <strong>{name}</strong>
                      {p.customers?.mobile_number && (
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.customers.mobile_number}</div>
                      )}
                    </td>
                    <td>{formatDate(p.payment_date)}</td>
                    <td style={{ fontSize: 13 }}>
                      {formatDate(p.bill_start_date)} — {formatDate(p.bill_end_date)}
                    </td>
                    <td>
                      <span className="badge badge-green">{p.payment_method || 'Cash'}</span>
                    </td>
                    <td>{formatLiters(p.total_liters)}</td>
                    <td>{formatCurrency(p.total_amount)}</td>
                    <td>
                      <strong style={{ color: 'var(--secondary)' }}>{formatCurrency(p.paid_amount)}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        disabled={printingId === p.payment_id}
                        onClick={() => handlePrint(p)}
                      >
                        {printingId === p.payment_id ? '…' : 'Print bill'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
