import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCustomers, getActiveRate, addDailyEntry } from '../lib/api';
import { FocusZone, useFocusZone } from '../context/FocusNavContext';
import { cycleSelectOption } from '../lib/focusHelpers';
import {
  formatCurrency,
  formatDate,
  formatDateDB,
  todayDB,
  calculateAmount,
  QUANTITY_OPTIONS,
} from '../lib/helpers';

export default function AddEntry() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [customerLocked, setCustomerLocked] = useState(false);
  const [entryDate, setEntryDate] = useState(todayDB());
  const [selectedQty, setSelectedQty] = useState(null);
  const [manualQty, setManualQty] = useState('');
  const [qtyIdx, setQtyIdx] = useState(0);
  const [activeRate, setActiveRate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const formRef = useRef(null);
  const customerRef = useRef(null);
  const manualRef = useRef(null);

  useEffect(() => {
    Promise.all([getCustomers(), getActiveRate()])
      .then(([list, rate]) => {
        setCustomers(list);
        setActiveRate(rate);
        if (list.length === 1) setCustomerId(String(list[0].customer_id));
        if (!rate) setErr('No milk rate set. Go to Fixed Rate in the menu and set a rate first.');
      })
      .catch((e) => setErr(e.message || 'Failed to load'));
  }, []);

  const getQuantity = () => {
    if (manualQty && parseFloat(manualQty) > 0) return parseFloat(manualQty);
    if (selectedQty !== null) return selectedQty;
    return 0;
  };

  const qty = getQuantity();
  const totalAmount = qty && activeRate ? calculateAmount(qty, activeRate.rate_per_liter) : 0;
  const isManual = Boolean(manualQty && parseFloat(manualQty) > 0);

  const selectPreset = (value) => {
    setSelectedQty(value);
    setManualQty('');
  };

  const onManualChange = (text) => {
    setManualQty(text);
    if (text) setSelectedQty(null);
  };

  const shiftDate = (days) => {
    const d = new Date(`${entryDate}T12:00:00`);
    d.setDate(d.getDate() + days);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d <= today) setEntryDate(formatDateDB(d));
  };

  const cycleCustomer = (dir) => {
    if (!customers.length) return;
    const next = cycleSelectOption(customers, customerId, dir, (c) => c.customer_id);
    setCustomerId(String(next));
    setCustomerLocked(false);
  };

  const applyQtyHighlight = (idx) => {
    setQtyIdx(idx);
    if (idx < QUANTITY_OPTIONS.length) {
      selectPreset(QUANTITY_OPTIONS[idx].value);
    } else {
      manualRef.current?.focus();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    const cust = customers.find((c) => String(c.customer_id) === String(customerId));
    if (!cust) {
      setErr('Please select a customer');
      return;
    }
    if (!qty || qty <= 0) {
      setErr('Select a milk type or enter manual quantity');
      return;
    }
    if (!activeRate) {
      setErr('No active rate. Set Fixed Rate first.');
      return;
    }

    const milkType = isManual ? 'custom' : String(selectedQty);
    const label = isManual ? 'Manual' : QUANTITY_OPTIONS.find((o) => o.value === selectedQty)?.label || `${qty} L`;

    if (
      !window.confirm(
        `Save entry?\n\nCustomer: ${cust.customer_name}\nDate: ${formatDate(entryDate)}\nType: ${label}\nQuantity: ${qty} L\nTotal: ${formatCurrency(totalAmount)}`
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      await addDailyEntry({
        customer_id: cust.customer_id,
        customer_name: cust.customer_name,
        entry_date: entryDate,
        milk_type_selected: milkType,
        quantity_liters: qty,
        rate_per_liter_used: activeRate.rate_per_liter,
        total_amount: totalAmount,
      });
      setMsg(`Saved ${qty} L (${label}) for ${cust.customer_name}`);
      setSelectedQty(null);
      setManualQty('');
      setCustomerLocked(false);
    } catch (ex) {
      setErr(ex.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  useFocusZone(
    'customer',
    0,
    {
      label: 'Customer',
      onActivate: () => customerRef.current?.focus(),
      onArrowUp: () => {
        if (!customerLocked) {
          cycleCustomer(-1);
          return true;
        }
        return false;
      },
      onArrowDown: () => {
        if (!customerLocked) {
          cycleCustomer(1);
          return true;
        }
        return false;
      },
      onEnter: () => {
        if (!customerId && customers[0]) setCustomerId(String(customers[0].customer_id));
        setCustomerLocked(true);
      },
    },
    [customers, customerId, customerLocked]
  );

  useFocusZone(
    'date',
    1,
    {
      label: 'Entry date',
      onArrowLeft: () => {
        shiftDate(-1);
        return true;
      },
      onArrowRight: () => {
        shiftDate(1);
        return true;
      },
    },
    [entryDate]
  );

  useFocusZone(
    'milk',
    2,
    {
      label: 'Milk type / quantity',
      onActivate: () => applyQtyHighlight(qtyIdx),
      onArrowLeft: () => {
        const n = Math.max(0, qtyIdx - 1);
        applyQtyHighlight(n);
        return true;
      },
      onArrowRight: () => {
        const n = Math.min(QUANTITY_OPTIONS.length, qtyIdx + 1);
        applyQtyHighlight(n);
        return true;
      },
      onArrowUp: () => {
        const n = Math.max(0, qtyIdx - 2);
        applyQtyHighlight(n);
        return true;
      },
      onArrowDown: () => {
        const n = Math.min(QUANTITY_OPTIONS.length, qtyIdx + 2);
        applyQtyHighlight(n);
        return true;
      },
      onEnter: () => {
        if (qtyIdx < QUANTITY_OPTIONS.length) {
          selectPreset(QUANTITY_OPTIONS[qtyIdx].value);
        } else {
          manualRef.current?.focus();
        }
      },
      allowTyping: true,
    },
    [qtyIdx]
  );

  useFocusZone(
    'save',
    3,
    {
      label: 'Save entry',
      onEnter: () => {
        if (!saving && activeRate) formRef.current?.requestSubmit();
      },
    },
    [saving, activeRate]
  );

  return (
    <div>
      <h1 className="page-title">Add Entry</h1>
      <p className="page-subtitle" style={{ color: 'var(--muted)', marginBottom: 20 }}>
        Press <kbd className="kbd">Enter</kbd> to start — ↑↓ customer → Enter → ↓ date → ←→ date → ↓ milk → Enter → ↓ Save
      </p>

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && (
        <div className="alert alert-error">
          {err}
          {err.includes('rate') && (
            <div style={{ marginTop: 8 }}>
              <Link to="/rate" className="btn btn-sm btn-secondary">
                Open Fixed Rate
              </Link>
            </div>
          )}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSave} className="card" style={{ maxWidth: 640 }}>
        <FocusZone id="customer" className="field">
          <label>Customer *</label>
          <select
            ref={customerRef}
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setCustomerLocked(false);
            }}
            required
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.customer_name}
                {c.mobile_number ? ` — ${c.mobile_number}` : ''}
              </option>
            ))}
          </select>
        </FocusZone>

        <FocusZone id="date" className="field">
          <label>Entry date</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => shiftDate(-1)}>
              ◀
            </button>
            <input
              type="date"
              value={entryDate}
              max={todayDB()}
              onChange={(e) => setEntryDate(e.target.value)}
              style={{ flex: 1, minWidth: 140 }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => shiftDate(1)}
              disabled={entryDate >= todayDB()}
            >
              ▶
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEntryDate(todayDB())}>
              Today
            </button>
          </div>
        </FocusZone>

        <FocusZone id="milk" className="field">
          <label>Milk type / quantity *</label>
          <div className="qty-grid">
            {QUANTITY_OPTIONS.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                className={`qty-btn ${selectedQty === opt.value && !isManual ? 'active' : ''} ${qtyIdx === i ? 'qty-btn-focus' : ''}`}
                onClick={() => {
                  setQtyIdx(i);
                  selectPreset(opt.value);
                }}
              >
                <span className="qty-btn-label">{opt.label}</span>
                <span className="qty-btn-sub">{opt.display} Liter</span>
              </button>
            ))}
          </div>
          <p className="qty-or">— OR manual quantity —</p>
          <input
            ref={manualRef}
            type="number"
            step="0.01"
            min="0"
            placeholder="Manual quantity (e.g. 2.5)"
            value={manualQty}
            onChange={(e) => onManualChange(e.target.value)}
            onFocus={() => setQtyIdx(QUANTITY_OPTIONS.length)}
            className={`${isManual ? 'manual-input-active' : ''} ${qtyIdx === QUANTITY_OPTIONS.length ? 'qty-btn-focus' : ''}`}
          />
        </FocusZone>

        {activeRate && (
          <div className="card" style={{ background: '#e8f3e8', marginBottom: 16, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Current rate</span>
              <strong>{formatCurrency(activeRate.rate_per_liter)} / L</strong>
            </div>
          </div>
        )}

        {qty > 0 && activeRate && (
          <div className="card" style={{ marginBottom: 16, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Quantity</span>
              <strong>{qty} L</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total</span>
              <strong style={{ fontSize: 18, color: 'var(--primary)' }}>{formatCurrency(totalAmount)}</strong>
            </div>
          </div>
        )}

        <FocusZone id="save">
          <button type="submit" className="btn" disabled={saving || !activeRate}>
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </FocusZone>
      </form>
    </div>
  );
}
