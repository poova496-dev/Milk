import { useEffect, useRef, useState } from 'react';
import { getActiveRate, getRateHistory, saveRate } from '../lib/api';
import { formatCurrency, formatDate, formatDateDB, todayDB } from '../lib/helpers';
import { useAdminRefresh } from '../hooks/useAdminRefresh';
import { FocusZone, useFocusZone } from '../context/FocusNavContext';

const emptyForm = {
  rate_name: '',
  rate_per_liter: '',
  rate_for_1_liter: '',
  rate_for_half_liter: '',
  rate_for_quarter_liter: '',
  rate_for_1_75_liter: '',
};

export default function FixedRate() {
  const [activeRate, setActiveRate] = useState(null);
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  const load = async () => {
    setErr('');
    try {
      const [active, list] = await Promise.all([getActiveRate(), getRateHistory()]);
      setActiveRate(active);
      setHistory(list);
    } catch (e) {
      setErr(e.message || 'Failed to load rates');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useAdminRefresh(load);

  useFocusZone(
    'open',
    0,
    {
      label: 'Set new rate',
      onEnter: () => {
        if (!showForm) setShowForm(true);
      },
    },
    [showForm]
  );

  useFocusZone(
    'rate',
    1,
    {
      label: 'Rate per liter',
      allowTyping: true,
    },
    []
  );

  useFocusZone(
    'save',
    2,
    {
      label: 'Save rate',
      onEnter: () => {
        if (showForm && !saving) formRef.current?.requestSubmit();
      },
    },
    [showForm, saving]
  );

  const onRatePerLiter = (text) => {
    const rate = parseFloat(text) || 0;
    setForm({
      ...form,
      rate_per_liter: text,
      rate_for_1_liter: rate ? String(rate) : '',
      rate_for_half_liter: rate ? String((rate * 0.5).toFixed(2)) : '',
      rate_for_quarter_liter: rate ? String((rate * 0.25).toFixed(2)) : '',
      rate_for_1_75_liter: rate ? String((rate * 1.75).toFixed(2)) : '',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (!form.rate_per_liter || parseFloat(form.rate_per_liter) <= 0) {
      setErr('Enter a valid rate per liter');
      return;
    }
    if (
      !window.confirm(
        `Set new rate to ${formatCurrency(form.rate_per_liter)} per liter?\n\nApplies to new entries from today.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await saveRate({
        rate_name: form.rate_name || `Rate - ${formatDate(new Date())}`,
        rate_per_liter: parseFloat(form.rate_per_liter),
        rate_for_1_liter: parseFloat(form.rate_for_1_liter) || parseFloat(form.rate_per_liter),
        rate_for_half_liter: parseFloat(form.rate_for_half_liter) || parseFloat(form.rate_per_liter) * 0.5,
        rate_for_quarter_liter: parseFloat(form.rate_for_quarter_liter) || parseFloat(form.rate_per_liter) * 0.25,
        rate_for_1_75_liter: parseFloat(form.rate_for_1_75_liter) || parseFloat(form.rate_per_liter) * 1.75,
        effective_from: todayDB(),
      });
      setMsg('New milk rate saved');
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (ex) {
      setErr(ex.message || 'Failed to save rate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Fixed Rate</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
        Same as mobile app — set price per liter for Add Entry and billing.
      </p>

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      {activeRate ? (
        <div className="card" style={{ maxWidth: 520, marginBottom: 20, border: '2px solid var(--secondary)' }}>
          <p style={{ fontSize: 13, color: 'var(--secondary)', fontWeight: 700, marginBottom: 8 }}>
            Current active rate
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginBottom: 12 }}>
            {formatCurrency(activeRate.rate_per_liter)} / Liter
          </p>
          <div className="grid-4" style={{ marginBottom: 12 }}>
            <div style={{ background: '#e8f3e8', padding: 10, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>1 L</div>
              <strong>{formatCurrency(activeRate.rate_for_1_liter)}</strong>
            </div>
            <div style={{ background: '#e8f3e8', padding: 10, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>½ L</div>
              <strong>{formatCurrency(activeRate.rate_for_half_liter)}</strong>
            </div>
            <div style={{ background: '#e8f3e8', padding: 10, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>¼ L</div>
              <strong>{formatCurrency(activeRate.rate_for_quarter_liter)}</strong>
            </div>
            <div style={{ background: '#e8f3e8', padding: 10, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>1.75 L</div>
              <strong>{formatCurrency(activeRate.rate_for_1_75_liter)}</strong>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Effective from: {formatDate(activeRate.effective_from)}
          </p>
        </div>
      ) : (
        <div className="alert alert-error" style={{ maxWidth: 520, marginBottom: 20 }}>
          No rate set yet. Set a rate before adding milk entries.
        </div>
      )}

      {!showForm ? (
        <FocusZone id="open">
        <button type="button" className="btn" onClick={() => setShowForm(true)}>
          Set new rate
        </button>
        </FocusZone>
      ) : (
        <form ref={formRef} onSubmit={handleSave} className="card" style={{ maxWidth: 520, marginTop: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16, color: 'var(--primary)' }}>Set new milk rate</h2>
          <div className="field">
            <label>Rate name (optional)</label>
            <input
              value={form.rate_name}
              onChange={(e) => setForm({ ...form, rate_name: e.target.value })}
              placeholder="e.g. Summer 2026"
            />
          </div>
          <FocusZone id="rate" className="field">
            <label>Rate per liter (₹) *</label>
            <input
              value={form.rate_per_liter}
              onChange={(e) => onRatePerLiter(e.target.value)}
              placeholder="e.g. 40"
              type="number"
              step="0.01"
              min="0"
              style={{ fontSize: 18, fontWeight: 700, textAlign: 'center' }}
            />
          </FocusZone>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Auto-calculated (editable)</p>
          <div className="grid-2">
            <div className="field">
              <label>1 Liter</label>
              <input
                value={form.rate_for_1_liter}
                onChange={(e) => setForm({ ...form, rate_for_1_liter: e.target.value })}
                type="number"
                step="0.01"
              />
            </div>
            <div className="field">
              <label>½ Liter</label>
              <input
                value={form.rate_for_half_liter}
                onChange={(e) => setForm({ ...form, rate_for_half_liter: e.target.value })}
                type="number"
                step="0.01"
              />
            </div>
            <div className="field">
              <label>¼ Liter</label>
              <input
                value={form.rate_for_quarter_liter}
                onChange={(e) => setForm({ ...form, rate_for_quarter_liter: e.target.value })}
                type="number"
                step="0.01"
              />
            </div>
            <div className="field">
              <label>1.75 Liter</label>
              <input
                value={form.rate_for_1_75_liter}
                onChange={(e) => setForm({ ...form, rate_for_1_75_liter: e.target.value })}
                type="number"
                step="0.01"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <FocusZone id="save">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save rate'}
            </button>
            </FocusZone>
          </div>
        </form>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 32, maxWidth: 520 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12, color: 'var(--primary)' }}>Rate history</h2>
          {history.map((r) => (
            <div
              key={r.rate_id}
              className="card"
              style={{
                marginBottom: 8,
                padding: 14,
                borderLeft: r.is_active ? '4px solid var(--secondary)' : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{r.rate_name}</strong>
                {r.is_active && <span className="badge badge-green">ACTIVE</span>}
              </div>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>
                {formatCurrency(r.rate_per_liter)} / L
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>From: {formatDate(r.effective_from)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
