import { useEffect, useState } from 'react';
import client from '../api/client';

export default function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({ label: '', capacity: 2 });

  const loadReservations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await client.get('/admin/reservations', { params });
      setReservations(res.data.reservations);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const res = await client.get('/tables');
      setTables(res.data.tables);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  useEffect(() => {
    loadReservations();
    loadTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadReservations();
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await client.patch(`/admin/reservations/${id}/cancel`);
      loadReservations();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      await client.post('/tables', {
        label: newTable.label,
        capacity: Number(newTable.capacity),
      });
      setNewTable({ label: '', capacity: 2 });
      loadTables();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleTable = async (table) => {
    try {
      await client.patch(`/tables/${table._id}`, { isActive: !table.isActive });
      loadTables();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <p className="page-subtitle">Every reservation, every table, one ledger</p>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <section className="card">
        <h2>All reservations</h2>
        <form onSubmit={handleFilter} className="inline-form">
          <label>
            Date
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary">
            Filter
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setDateFilter('');
              setStatusFilter('');
              loadReservations();
            }}
          >
            Clear
          </button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : reservations.length === 0 ? (
          <p className="muted">No reservations found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Date</th>
                <th>Time</th>
                <th>Table</th>
                <th>Guests</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r._id}>
                  <td>
                    {r.user?.name}
                    <br />
                    <span className="muted">{r.user?.email}</span>
                  </td>
                  <td>{new Date(r.reservationDate).toISOString().slice(0, 10)}</td>
                  <td>{r.timeSlot}</td>
                  <td>{r.table?.label}</td>
                  <td>{r.guests}</td>
                  <td>
                    <span className={`status-badge status-${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    {r.status === 'confirmed' && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleCancel(r._id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Manage tables</h2>
        <form onSubmit={handleAddTable} className="inline-form">
          <label>
            Label
            <input
              required
              value={newTable.label}
              onChange={(e) => setNewTable({ ...newTable, label: e.target.value })}
              placeholder="e.g. T7"
            />
          </label>
          <label>
            Capacity
            <input
              type="number"
              min={1}
              required
              value={newTable.capacity}
              onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Add table
          </button>
        </form>

        <table className="data-table" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Label</th>
              <th>Capacity</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t._id}>
                <td>{t.label}</td>
                <td>{t.capacity}</td>
                <td>{t.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggleTable(t)}>
                    {t.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}