import { useEffect, useState } from 'react';
import client from '../api/client';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function CustomerDashboard() {
  const [reservations, setReservations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [date, setDate] = useState(todayStr());
  const [guests, setGuests] = useState(2);
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);

  const [selectedTable, setSelectedTable] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState(null);

  const loadReservations = async () => {
    setLoadingList(true);
    try {
      const res = await client.get('/reservations/me');
      setReservations(res.data.reservations);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const checkAvailability = async (e) => {
    e?.preventDefault();
    setChecking(true);
    setMessage(null);
    setAvailability(null);
    setSelectedTable('');
    setSelectedSlot('');
    try {
      const res = await client.get('/reservations/availability', {
        params: { date, guests },
      });
      setAvailability(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setChecking(false);
    }
  };

  const handleBook = async () => {
    if (!selectedTable || !selectedSlot) {
      setMessage({ type: 'error', text: 'Select a table and time slot first' });
      return;
    }
    setBooking(true);
    setMessage(null);
    try {
      await client.post('/reservations', {
        tableId: selectedTable,
        reservationDate: date,
        timeSlot: selectedSlot,
        guests: Number(guests),
      });
      setMessage({ type: 'success', text: 'Reservation confirmed!' });
      setAvailability(null);
      setSelectedTable('');
      setSelectedSlot('');
      loadReservations();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await client.patch(`/reservations/${id}/cancel`);
      loadReservations();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="page">
      <h1>My Reservations</h1>

      <section className="card">
        <h2>Book a table</h2>
        <form onSubmit={checkAvailability} className="inline-form">
          <label>
            Date
            <input
              type="date"
              min={todayStr()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label>
            Guests
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={checking}>
            {checking ? 'Checking...' : 'Check availability'}
          </button>
        </form>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        {availability && (
          <div className="availability-grid">
            {availability.availability.length === 0 && (
              <p>No tables can seat {guests} guests. Try a smaller party size.</p>
            )}
            {availability.availability.map(({ table, availableSlots }) => (
              <div key={table.id} className="table-card">
                <div className="table-card-header">
                  <strong>{table.label}</strong> · seats {table.capacity}
                </div>
                {availableSlots.length === 0 ? (
                  <p className="muted">Fully booked</p>
                ) : (
                  <div className="slot-list">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={
                          'slot-btn' +
                          (selectedTable === table.id && selectedSlot === slot ? ' selected' : '')
                        }
                        onClick={() => {
                          setSelectedTable(table.id);
                          setSelectedSlot(slot);
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {availability && availability.availability.length > 0 && (
          <button
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={handleBook}
            disabled={booking || !selectedTable || !selectedSlot}
          >
            {booking ? 'Booking...' : 'Confirm reservation'}
          </button>
        )}
      </section>

      <section className="card">
        <h2>Upcoming & past reservations</h2>
        {loadingList ? (
          <p>Loading...</p>
        ) : reservations.length === 0 ? (
          <p className="muted">No reservations yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
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
    </div>
  );
}