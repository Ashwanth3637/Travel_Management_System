import React, { useState } from 'react';

function AdminBookings({ token, bookings, vehicles, drivers, refresh, toast }) {
  const API_URL = 'http://localhost:5001/api';

  const [showAddModal, setShowAddModal] = useState(false);
  const [assigningBooking, setAssigningBooking] = useState(null);

  // New booking form fields
  const [custName, setCustName] = useState('');
  const [bPickup, setBPickup] = useState('');
  const [bDrop, setBDrop] = useState('');
  const [bDateTime, setBDateTime] = useState('');
  const [bType, setBType] = useState('Sedan');
  const [bNotes, setBNotes] = useState('');

  // Assignment selection fields
  const [selVehicleId, setSelVehicleId] = useState('');
  const [selDriverId, setSelDriverId] = useState('');

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: custName,
          pickupLocation: bPickup,
          dropLocation: bDrop,
          pickupDateTime: bDateTime,
          vehicleType: bType,
          notes: bNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create booking');
      toast('Booking created successfully!', null);
      setShowAddModal(false);
      // Reset
      setCustName(''); setBPickup(''); setBDrop(''); setBDateTime(''); setBType('Sedan'); setBNotes('');
      refresh();
    } catch (err) {
      toast(null, err.message);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`${API_URL}/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');
      toast('Booking cancelled.', null);
      refresh();
    } catch (err) {
      toast(null, err.message);
    }
  };

  const handleOpenAssignModal = (booking) => {
    setAssigningBooking(booking);
    setSelVehicleId('');
    setSelDriverId('');
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selVehicleId || !selDriverId) {
      toast(null, 'Please select both a vehicle and a driver.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/bookings/${assigningBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Confirmed',
          assignedVehicleId: selVehicleId,
          assignedDriverId: selDriverId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch trip');
      toast('Trip confirmed and vehicle/driver dispatched!', null);
      setAssigningBooking(null);
      refresh();
    } catch (err) {
      toast(null, err.message);
    }
  };

  // Helper status changer (e.g. advance trip to In Progress, Completed manually)
  const handleForceStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      toast(`Trip marked as ${status}!`, null);
      refresh();
    } catch (err) {
      toast(null, err.message);
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Active Bookings & Dispatch</h3>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Create New Booking
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Route (From - Destination)</th>
              <th>Pickup Time</th>
              <th>Vehicle Requested</th>
              <th>Estimated Fare</th>
              <th>Status</th>
              <th>Assigned Resources</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No bookings currently in system.</td>
              </tr>
            ) : (
              bookings.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.id}</strong></td>
                  <td>{b.customerName}</td>
                  <td>{b.pickupLocation} ➔ {b.dropLocation}</td>
                  <td>{new Date(b.pickupDateTime).toLocaleString()}</td>
                  <td>{b.vehicleType}</td>
                  <td>₹{b.fareEstimated}</td>
                  <td>
                    <span className={`badge badge-${b.status.toLowerCase().replace(' ', '')}`}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {b.assignedVehicleId ? (
                      <div>🚙 {vehicles.find(v => v.id === b.assignedVehicleId)?.name}</div>
                    ) : null}
                    {b.assignedDriverId ? (
                      <div>👤 {drivers.find(d => d.id === b.assignedDriverId)?.name}</div>
                    ) : (
                      !b.assignedVehicleId && 'Unassigned'
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {b.status === 'Pending' && (
                        <>
                          <button className="btn btn-indigo" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOpenAssignModal(b)}>
                            Confirm & Assign
                          </button>
                          <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleCancelBooking(b.id)}>
                            Cancel
                          </button>
                        </>
                      )}
                      {b.status === 'Confirmed' && (
                        <>
                          <button className="btn btn-indigo" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleForceStatus(b.id, 'In Progress')}>
                            Start Trip
                          </button>
                          <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleCancelBooking(b.id)}>
                            Cancel
                          </button>
                        </>
                      )}
                      {b.status === 'In Progress' && (
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleForceStatus(b.id, 'Completed')}>
                          Complete Trip
                        </button>
                      )}
                      {(b.status === 'Completed' || b.status === 'Cancelled') && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Archived</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Booking */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Book New Ride Request</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateBooking}>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input type="text" className="form-input" placeholder="e.g. Ashwanth S" value={custName} onChange={(e) => setCustName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Pickup Address</label>
                <input type="text" className="form-input" placeholder="e.g. Salem Bus Stand" value={bPickup} onChange={(e) => setBPickup(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Destination Address</label>
                <input type="text" className="form-input" placeholder="e.g. Coimbatore Railway Station" value={bDrop} onChange={(e) => setBDrop(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input type="datetime-local" className="form-input" value={bDateTime} onChange={(e) => setBDateTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Requested Vehicle Category</label>
                <select className="form-select" value={bType} onChange={(e) => setBType(e.target.value)}>
                  <option value="Sedan">Sedan (Max 4 PAX)</option>
                  <option value="SUV">SUV (Max 7 PAX)</option>
                  <option value="Minivan">Minivan (Max 12 PAX)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label className="form-label">Trip Notes</label>
                <input type="text" className="form-input" placeholder="e.g. client meeting, need clean car" value={bNotes} onChange={(e) => setBNotes(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm and Assign Dispatch */}
      {assigningBooking && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Assign Fleet & Driver</h3>
              <button className="modal-close" onClick={() => setAssigningBooking(null)}>×</button>
            </div>
            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              <div>Booking ID: <strong>{assigningBooking.id}</strong></div>
              <div>Route: {assigningBooking.pickupLocation} ➔ {assigningBooking.dropLocation}</div>
              <div>Type required: <strong>{assigningBooking.vehicleType}</strong></div>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label className="form-label">Select Available Vehicle ({assigningBooking.vehicleType})</label>
                <select className="form-select" value={selVehicleId} onChange={(e) => setSelVehicleId(e.target.value)} required>
                  <option value="">-- Select Available Vehicle --</option>
                  {vehicles
                    .filter(v => v.status === 'Available' && v.type === assigningBooking.vehicleType)
                    .map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.plateNumber})</option>
                    ))}
                </select>
                {vehicles.filter(v => v.status === 'Available' && v.type === assigningBooking.vehicleType).length === 0 && (
                  <div style={{ color: 'var(--status-cancelled)', fontSize: '12px', marginTop: '4px' }}>
                    ⚠ No available vehicles found for class {assigningBooking.vehicleType}.
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label className="form-label">Select Available Driver</label>
                <select className="form-select" value={selDriverId} onChange={(e) => setSelDriverId(e.target.value)} required>
                  <option value="">-- Select Available Driver --</option>
                  {drivers
                    .filter(d => d.status === 'Available')
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                    ))}
                </select>
                {drivers.filter(d => d.status === 'Available').length === 0 && (
                  <div style={{ color: 'var(--status-cancelled)', fontSize: '12px', marginTop: '4px' }}>
                    ⚠ No available drivers registered.
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningBooking(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!selVehicleId || !selDriverId}>
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminBookings;
