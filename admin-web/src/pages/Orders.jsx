import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getOrders, acceptOrder, cancelOrder, deliverOrder } from '../lib/api';
import { formatCurrency, formatDate, formatLiters } from '../lib/helpers';
import { useAdminRefresh } from '../hooks/useAdminRefresh';
import { FocusZone, useFocusZone } from '../context/FocusNavContext';
import { cycleList } from '../lib/focusHelpers';

const TABS = [
  { key: 'pending', label: 'New (to accept)' },
  { key: 'accepted', label: 'To deliver' },
  { key: 'delivered', label: 'Delivered' },
];

export default function Orders() {
  const [params] = useSearchParams();
  const initial = params.get('tab') || 'pending';
  const [tab, setTab] = useState(initial);
  const [orders, setOrders] = useState([]);
  const [deliver, setDeliver] = useState(null);
  const [orderIdx, setOrderIdx] = useState(0);
  const [payMethodIdx, setPayMethodIdx] = useState(0);
  const [err, setErr] = useState('');

  const PAY_METHODS = ['Cash', 'UPI', 'Billing'];
  const tabKeys = TABS.map((t) => t.key);

  const load = async () => {
    try {
      setOrders(await getOrders(tab));
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    const t = params.get('tab');
    if (t) setTab(t);
  }, [params]);

  useEffect(() => {
    load();
  }, [tab]);

  useAdminRefresh(load);

  useEffect(() => {
    setOrderIdx(0);
  }, [tab, orders.length]);

  const onDeliver = async (method) => {
    if (!deliver) return;
    try {
      await deliverOrder(deliver, method);
      setDeliver(null);
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const runOrderAction = async () => {
    const o = orders[orderIdx];
    if (!o) return;
    if (o.status === 'pending') {
      await acceptOrder(o.order_id);
      load();
    } else if (o.status === 'accepted') {
      setDeliver(o);
      setPayMethodIdx(0);
    }
  };

  useFocusZone(
    'tab',
    0,
    {
      label: 'Order tab',
      onArrowLeft: () => {
        setTab((t) => cycleList(tabKeys, t, 'prev'));
        return true;
      },
      onArrowRight: () => {
        setTab((t) => cycleList(tabKeys, t, 'next'));
        return true;
      },
    },
    [tab]
  );

  useFocusZone(
    'orders',
    1,
    {
      label: 'Order list',
      onArrowUp: () => {
        if (orders.length) {
          setOrderIdx((i) => Math.max(0, i - 1));
          return true;
        }
        return false;
      },
      onArrowDown: () => {
        if (orders.length) {
          setOrderIdx((i) => Math.min(orders.length - 1, i + 1));
          return true;
        }
        return false;
      },
      onEnter: () => runOrderAction(),
    },
    [orders, orderIdx, tab]
  );

  useFocusZone(
    'payment',
    2,
    {
      label: 'Delivery payment',
      onArrowUp: () => {
        if (!deliver) return false;
        setPayMethodIdx((i) => Math.max(0, i - 1));
        return true;
      },
      onArrowDown: () => {
        if (!deliver) return false;
        setPayMethodIdx((i) => Math.min(PAY_METHODS.length - 1, i + 1));
        return true;
      },
      onEnter: () => {
        if (deliver) onDeliver(PAY_METHODS[payMethodIdx]);
      },
    },
    [deliver, payMethodIdx]
  );

  return (
    <div>
      <h1 className="page-title">Orders</h1>
      {err && <div className="alert alert-error">{err}</div>}
      <FocusZone id="tab" className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </FocusZone>
      <FocusZone id="orders" className="card">
        {orders.map((o, i) => (
          <div
            key={o.order_id}
            style={{
              padding: 16,
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 12,
              outline: i === orderIdx ? '2px solid var(--secondary)' : undefined,
              borderRadius: i === orderIdx ? 8 : undefined,
            }}
          >
            <div>
              <strong>{o.customer_name}</strong>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {formatLiters(o.quantity_liters)} · {formatCurrency(o.total_amount)} ·{' '}
                {formatDate(o.ordered_at)}
              </div>
              {o.customers?.mobile_number && (
                <a href={`tel:${o.customers.mobile_number}`}>📞 {o.customers.mobile_number}</a>
              )}
              {o.status === 'delivered' && o.payment_method && (
                <div>
                  Paid: <strong>{o.payment_method}</strong>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {o.status === 'pending' && (
                <>
                  <button type="button" className="btn btn-sm" onClick={() => acceptOrder(o.order_id).then(load)}>
                    Accept
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => cancelOrder(o.order_id).then(load)}>
                    Cancel
                  </button>
                </>
              )}
              {o.status === 'accepted' && (
                <button type="button" className="btn btn-sm" onClick={() => setDeliver(o)}>
                  Delivered
                </button>
              )}
            </div>
          </div>
        ))}
        {!orders.length && <p style={{ padding: 20, color: 'var(--muted)' }}>No orders in this tab</p>}
      </FocusZone>

      {deliver && (
        <div className="modal-backdrop" onClick={() => setDeliver(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Payment for delivery</h2>
            <p style={{ marginBottom: 16 }}>
              {deliver.customer_name} — {formatCurrency(deliver.total_amount)}
            </p>
            <FocusZone id="payment">
            {PAY_METHODS.map((m, i) => (
              <button
                key={m}
                type="button"
                className="btn"
                style={{
                  width: '100%',
                  marginBottom: 8,
                  outline: i === payMethodIdx ? '2px solid var(--secondary)' : undefined,
                }}
                onClick={() => onDeliver(m)}
              >
                {m === 'Billing' ? '🧾 Billing (add to account)' : m}
              </button>
            ))}
            </FocusZone>
            <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setDeliver(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
