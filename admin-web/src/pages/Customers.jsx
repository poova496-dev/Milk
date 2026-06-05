import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from '../lib/api';
import { useAdminRefresh } from '../hooks/useAdminRefresh';
import { FocusZone, useFocusZone } from '../context/FocusNavContext';

export default function Customers() {
  const location = useLocation();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [rowIdx, setRowIdx] = useState(0);

  const load = async () => {
    try {
      setList(await getCustomers(true));
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useAdminRefresh(load);

  const filtered = list.filter(
    (c) =>
      !search ||
      c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile_number?.includes(search)
  );

  useEffect(() => {
    setRowIdx(0);
  }, [search, filtered.length]);

  useEffect(() => {
    setModal(null);
  }, [location.pathname]);

  useFocusZone(
    'search',
    0,
    { label: 'Search customers', allowTyping: true },
    []
  );

  useFocusZone(
    'add',
    1,
    {
      label: 'Add customer',
      onEnter: () => openNew(),
    },
    []
  );

  useFocusZone(
    'list',
    2,
    {
      label: 'Customer list',
      onArrowUp: () => {
        if (filtered.length) {
          setRowIdx((i) => Math.max(0, i - 1));
          return true;
        }
        return false;
      },
      onArrowDown: () => {
        if (filtered.length) {
          setRowIdx((i) => Math.min(filtered.length - 1, i + 1));
          return true;
        }
        return false;
      },
      onEnter: () => {
        const c = filtered[rowIdx];
        if (c) openEdit(c);
      },
    },
    [rowIdx, filtered.length, search, list]
  );

  useFocusZone(
    'save',
    3,
    {
      label: 'Save customer',
      onEnter: () => {
        if (modal) save();
      },
    },
    [modal, form]
  );

  const openNew = () => {
    setForm({ customer_name: '', mobile_number: '', email: '', is_active: true, newPassword: '' });
    setModal('new');
  };

  const openEdit = (c) => {
    setForm({
      customer_name: c.customer_name,
      mobile_number: c.mobile_number || '',
      email: c.email || '',
      is_active: c.is_active !== false,
      newPassword: '',
    });
    setModal(c.customer_id);
  };

  const save = async () => {
    try {
      if (!form.customer_name?.trim()) {
        setErr('Name is required');
        return;
      }
      if (modal === 'new') {
        await addCustomer(form);
        setMsg('Customer added');
      } else {
        await updateCustomer(modal, form);
        setMsg('Customer updated');
      }
      setModal(null);
      setErr('');
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.customer_name}"? This cannot be undone.`)) return;
    try {
      await deleteCustomer(c.customer_id);
      setMsg('Customer deleted');
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Customers</h1>
      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <FocusZone id="search" style={{ flex: 1, minWidth: 200 }}>
        <input
          placeholder="Search name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        </FocusZone>
        <FocusZone id="add">
        <button type="button" className="btn" onClick={openNew}>
          + Add Customer
        </button>
        </FocusZone>
      </div>
      <FocusZone id="list" className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.customer_id} style={{ background: i === rowIdx ? '#e8f3e8' : undefined }}>
                <td>{c.customer_name}</td>
                <td>{c.mobile_number || '—'}</td>
                <td>{c.email || '—'}</td>
                <td>
                  <span className={`badge ${c.is_active !== false ? 'badge-green' : 'badge-red'}`}>
                    {c.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>
                    Edit
                  </button>{' '}
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(c)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p style={{ padding: 20, color: 'var(--muted)' }}>No customers found</p>}
      </FocusZone>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal === 'new' ? 'Add Customer' : 'Edit Customer'}</h2>
            <div className="field">
              <label>Name *</label>
              <input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                value={form.mobile_number}
                onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {modal !== 'new' && (
              <>
                <div className="field">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />{' '}
                    Active (can place orders)
                  </label>
                </div>
                <div className="field">
                  <label>New app password (leave blank to keep)</label>
                  <input
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    placeholder="Min 4 characters"
                  />
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <FocusZone id="save">
              <button type="button" className="btn" onClick={save}>
                Save
              </button>
              </FocusZone>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
