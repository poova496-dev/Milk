import { useEffect, useState } from 'react';
import {
  getPendingAmounts,
  getEntriesForBilling,
  savePayment,
  generateInvoiceNumber,
  saveInvoice,
} from '../lib/api';
import { formatCurrency, formatDateDB, formatLiters, todayDB } from '../lib/helpers';
import { generateInvoiceHTML, printInvoice } from '../lib/invoice';
import { FocusZone, useFocusZone } from '../context/FocusNavContext';
import { cycleSelectOption, PAYMENT_METHODS, shiftDateString } from '../lib/focusHelpers';

export default function Billing() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState(formatDateDB(new Date()));
  const [entries, setEntries] = useState([]);
  const [paid, setPaid] = useState('');
  const [method, setMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    getPendingAmounts()
      .then(setCustomers)
      .catch((e) => setErr(e.message));
  }, []);

  const calculate = async () => {
    if (!customerId) {
      setErr('Select a customer');
      return;
    }
    if (!start || !end) {
      setErr('Select start and end dates');
      return;
    }
    try {
      const rows = await getEntriesForBilling(customerId, start, end);
      if (!rows.length) {
        setErr('No unbilled entries in this period (already-billed entries are excluded).');
        setEntries([]);
        return;
      }
      setEntries(rows);
      const amt = rows.reduce((s, e) => s + parseFloat(e.total_amount), 0);
      setPaid(amt.toFixed(2));
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  };

  const totalLiters = entries.reduce((s, e) => s + parseFloat(e.quantity_liters), 0);
  const totalAmount = entries.reduce((s, e) => s + parseFloat(e.total_amount), 0);

  const processAndPrint = async (printOnly = false) => {
    if (!entries.length) {
      setErr('Calculate bill first');
      return;
    }
    const cust = customers.find((c) => c.customer_id === customerId);
    const paidNum = parseFloat(paid) || 0;
    if (!printOnly && paidNum <= 0) {
      setErr('Enter paid amount');
      return;
    }

    try {
      let invNo = 'PREVIEW';
      if (!printOnly) {
        const payment = await savePayment({
          customer_id: customerId,
          bill_start_date: start,
          bill_end_date: end,
          total_liters: totalLiters,
          total_amount: totalAmount,
          paid_amount: paidNum,
          payment_method: method,
          notes,
          entry_ids: entries.map((e) => e.entry_id),
        });
        invNo = await generateInvoiceNumber();
        await saveInvoice({
          invoice_number: invNo,
          payment_id: payment.payment_id,
          customer_id: customerId,
          customer_name: cust?.customer_name || 'Customer',
          invoice_date: formatDateDB(new Date()),
          bill_start_date: start,
          bill_end_date: end,
          total_liters: totalLiters,
          total_amount: totalAmount,
          paid_amount: paidNum,
        });
        setMsg('Payment saved. Opening print…');
      }

      const html = generateInvoiceHTML(
        {
          invoice_number: invNo,
          customer_name: cust?.customer_name,
          invoice_date: formatDateDB(new Date()),
          bill_start_date: start,
          bill_end_date: end,
          total_liters: totalLiters,
          total_amount: totalAmount,
          paid_amount: paidNum || totalAmount,
        },
        entries
      );
      printInvoice(html);

      if (!printOnly) {
        setEntries([]);
        setPaid('');
        getPendingAmounts().then(setCustomers);
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  const customerOptions = [{ customer_id: '', customer_name: 'Select…' }, ...customers];

  useFocusZone(
    'customer',
    0,
    {
      label: 'Customer',
      onArrowUp: () => {
        setCustomerId(String(cycleSelectOption(customerOptions, customerId, -1, (c) => c.customer_id)));
        return true;
      },
      onArrowDown: () => {
        setCustomerId(String(cycleSelectOption(customerOptions, customerId, 1, (c) => c.customer_id)));
        return true;
      },
    },
    [customers, customerId]
  );

  useFocusZone(
    'method',
    1,
    {
      label: 'Payment method',
      onArrowLeft: () => {
        setMethod((m) => cycleSelectOption(PAYMENT_METHODS, m, -1));
        return true;
      },
      onArrowRight: () => {
        setMethod((m) => cycleSelectOption(PAYMENT_METHODS, m, 1));
        return true;
      },
    },
    [method]
  );

  useFocusZone(
    'start',
    2,
    {
      label: 'Bill from date',
      onArrowLeft: () => {
        setStart((s) => shiftDateString(s || todayDB(), -1, end || todayDB()));
        return true;
      },
      onArrowRight: () => {
        setStart((s) => shiftDateString(s || todayDB(), 1, end || todayDB()));
        return true;
      },
    },
    [start, end]
  );

  useFocusZone(
    'end',
    3,
    {
      label: 'Bill to date',
      onArrowLeft: () => {
        setEnd((e) => shiftDateString(e || todayDB(), -1, todayDB()));
        return true;
      },
      onArrowRight: () => {
        setEnd((e) => shiftDateString(e || todayDB(), 1, todayDB()));
        return true;
      },
    },
    [end]
  );

  useFocusZone(
    'calculate',
    4,
    {
      label: 'Calculate bill',
      onEnter: () => calculate(),
    },
    [customerId, start, end]
  );

  useFocusZone(
    'paid',
    5,
    {
      label: 'Paid amount',
      allowTyping: true,
    },
    []
  );

  useFocusZone(
    'save',
    6,
    {
      label: 'Save & print bill',
      onEnter: () => {
        if (entries.length) processAndPrint(false);
      },
    },
    [entries.length]
  );

  return (
    <div>
      <h1 className="page-title">Billing & Print</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
        Press <kbd className="kbd">Enter</kbd> to start — ↑↓ customer → method ←→ → dates ←→ → Calculate → paid → Save
      </p>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
        Only <strong>not billed</strong> entries are included (same-day morning Cash/UPI orders are
        skipped).
      </p>
      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="grid-2">
          <FocusZone id="customer" className="field">
            <label>Customer (with pending)</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select…</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.customer_name} — {formatCurrency(c.pending_amount)} pending
                </option>
              ))}
            </select>
          </FocusZone>
          <FocusZone id="method" className="field">
            <label>Payment method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Cash</option>
              <option>UPI</option>
              <option>Bank</option>
            </select>
          </FocusZone>
          <FocusZone id="start" className="field">
            <label>Bill from</label>
            <input type="date" value={start} max={end || todayDB()} onChange={(e) => setStart(e.target.value)} />
          </FocusZone>
          <FocusZone id="end" className="field">
            <label>Bill to</label>
            <input type="date" value={end} min={start} max={todayDB()} onChange={(e) => setEnd(e.target.value)} />
          </FocusZone>
        </div>
        <FocusZone id="calculate">
          <button type="button" className="btn" onClick={calculate}>
            Calculate Bill
          </button>
        </FocusZone>
      </div>

      {entries.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Bill lines ({entries.length} entries)</h3>
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Liters</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.entry_id}>
                  <td>{e.entry_date}</td>
                  <td>{formatLiters(e.quantity_liters)}</td>
                  <td>{formatCurrency(e.rate_per_liter_used)}</td>
                  <td>{formatCurrency(e.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: '16px 0', fontSize: 18, fontWeight: 700 }}>
            Total: {formatLiters(totalLiters)} — {formatCurrency(totalAmount)}
          </p>
          <FocusZone id="paid" className="field" style={{ maxWidth: 280 }}>
            <label>Paid amount</label>
            <input value={paid} onChange={(e) => setPaid(e.target.value)} type="number" step="0.01" />
          </FocusZone>
          <div className="field">
            <label>Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <FocusZone id="save">
              <button type="button" className="btn" onClick={() => processAndPrint(false)}>
                Save & Print Bill
              </button>
            </FocusZone>
            <button type="button" className="btn btn-secondary" onClick={() => processAndPrint(true)}>
              Print Preview Only
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
