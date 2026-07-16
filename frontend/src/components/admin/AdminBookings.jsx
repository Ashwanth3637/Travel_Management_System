import React, { useState } from 'react';
import { createPortal } from 'react-dom';

function AdminBookings({ token, bookings, vehicles, drivers, refresh, toast, onlyActive, onlyHistory }) {
  const API_URL = 'http://localhost:5001/api';

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [assigningBooking, setAssigningBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);

  // New booking form fields
  const [custName, setCustName] = useState('');
  const [bPickup, setBPickup] = useState('');
  const [bDrop, setBDrop] = useState('');
  const [bDateTime, setBDateTime] = useState('');
  const [bType, setBType] = useState('Sedan');
  const [bNotes, setBNotes] = useState('');
  const [bStatus, setBStatus] = useState('Pending');

  // Assignment selection fields
  const [selVehicleId, setSelVehicleId] = useState('');
  const [selDriverId, setSelDriverId] = useState('');

  const handleSaveBooking = async (e) => {
    e.preventDefault();
    try {
      const url = editingBooking ? `${API_URL}/bookings/${editingBooking.id}` : `${API_URL}/bookings`;
      const method = editingBooking ? 'PUT' : 'POST';
      const body = {
        customerName: custName,
        pickupLocation: bPickup,
        dropLocation: bDrop,
        pickupDateTime: bDateTime,
        vehicleType: bType,
        notes: bNotes
      };
      if (editingBooking) {
        body.status = bStatus;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save booking');
      toast(editingBooking ? 'Booking updated successfully!' : 'Booking created successfully!', null);
      handleCloseAddModal();
      refresh();
    } catch (err) {
      toast(null, err.message);
    }
  };

  const handleEditBookingClick = (b) => {
    setEditingBooking(b);
    setCustName(b.customerName);
    setBPickup(b.pickupLocation);
    setBDrop(b.dropLocation);

    let formattedDate = '';
    if (b.pickupDateTime) {
      try {
        const d = new Date(b.pickupDateTime);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (e) {
        formattedDate = b.pickupDateTime;
      }
    }
    setBDateTime(formattedDate);
    setBType(b.vehicleType);
    setBNotes(b.notes || '');
    setBStatus(b.status || 'Pending');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingBooking(null);
    setCustName('');
    setBPickup('');
    setBDrop('');
    setBDateTime('');
    setBType('Sedan');
    setBNotes('');
    setBStatus('Pending');
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

  const activeBookings = bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'In Progress');
  const archivedBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Active Bookings & Dispatch */}
      {!onlyHistory && (
        <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Active Bookings & Dispatch</h3>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>ID</th>
                <th>Customer</th>
                <th>Route (From - Destination)</th>
                <th style={{ whiteSpace: 'nowrap' }}>Pickup Time</th>
                <th>Vehicle Requested</th>
                <th>Estimated Fare</th>
                <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                <th>Assigned Resources</th>
                <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeBookings.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active bookings currently in system.</td>
                </tr>
              ) : (
                activeBookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ whiteSpace: 'nowrap' }}><strong>{b.id}</strong></td>
                    <td>{b.customerName}</td>
                    <td>{b.pickupLocation} ➔ {b.dropLocation}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(b.pickupDateTime).toLocaleString()}</td>
                    <td>{b.vehicleType}</td>
                    <td>₹{b.fareEstimated}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
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
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                        {b.status === 'Pending' && (
                          <>
                            <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleOpenAssignModal(b)}>
                              Confirm
                            </button>
                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleCancelBooking(b.id)}>
                              Cancel
                            </button>
                          </>
                        )}
                        {b.status === 'Confirmed' && (
                          <>
                            <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleForceStatus(b.id, 'In Progress')}>
                              Start
                            </button>
                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleCancelBooking(b.id)}>
                              Cancel
                            </button>
                          </>
                        )}
                        {b.status === 'In Progress' && (
                          <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleForceStatus(b.id, 'Completed')}>
                            Complete
                          </button>
                        )}
                        <button className="btn btn-indigo" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => setViewingBooking(b)}>
                          View
                        </button>
                        <button className="btn btn-warning" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleEditBookingClick(b)}>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Booking History (Archived) */}
      {!onlyActive && (
        <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Booking History (Archived)</h3>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>ID</th>
                <th>Customer</th>
                <th>Route (From - Destination)</th>
                <th style={{ whiteSpace: 'nowrap' }}>Pickup Time</th>
                <th>Vehicle Requested</th>
                <th>Estimated Fare</th>
                <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                <th>Assigned Resources</th>
                <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedBookings.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No archived bookings found.</td>
                </tr>
              ) : (
                archivedBookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ whiteSpace: 'nowrap' }}><strong>{b.id}</strong></td>
                    <td>{b.customerName}</td>
                    <td>{b.pickupLocation} ➔ {b.dropLocation}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(b.pickupDateTime).toLocaleString()}</td>
                    <td>{b.vehicleType}</td>
                    <td>₹{b.fareEstimated}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
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
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginRight: '6px' }}>Archived</span>
                        <button className="btn btn-indigo" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => setViewingBooking(b)}>
                          View
                        </button>
                        <button className="btn btn-warning" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleEditBookingClick(b)}>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal: Create/Edit Booking */}
      {showAddModal && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingBooking ? 'Update Booking Details' : 'Book New Ride Request'}</h3>
              <button className="modal-close" onClick={handleCloseAddModal}>×</button>
            </div>
            <form onSubmit={handleSaveBooking}>
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
              <div className="form-group">
                <label className="form-label">Trip Notes</label>
                <input type="text" className="form-input" placeholder="e.g. client meeting, need clean car" value={bNotes} onChange={(e) => setBNotes(e.target.value)} />
              </div>
              {editingBooking && (
                <div className="form-group" style={{ marginBottom: '25px' }}>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={bStatus} onChange={(e) => setBStatus(e.target.value)}>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseAddModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Booking</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Confirm and Assign Dispatch */}
      {assigningBooking && createPortal(
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
        </div>,
        document.body
      )}

      {/* Modal: View Booking / Customer Details */}
      {viewingBooking && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Ride & Customer Details</h3>
              <button className="modal-close" onClick={() => setViewingBooking(null)}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Customer Name</label>
                <div style={{ fontWeight: '600', fontSize: '16px' }}>{viewingBooking.customerName}</div>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Booking ID</label>
                  <div style={{ fontWeight: '500' }}>#{viewingBooking.id}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status</label>
                  <div>
                    <span className={`badge badge-${viewingBooking.status.toLowerCase().replace(' ', '')}`}>
                      {viewingBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Route</label>
                <div style={{ fontWeight: '500' }}>
                  {viewingBooking.pickupLocation} ➔ {viewingBooking.dropLocation}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pickup Date & Time</label>
                  <div style={{ fontWeight: '500' }}>{new Date(viewingBooking.pickupDateTime).toLocaleString()}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Fare</label>
                  <div style={{ fontWeight: '600', color: '#10b981' }}>₹{viewingBooking.fareEstimated}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vehicle Class Requested</label>
                  <div style={{ fontWeight: '500' }}>{viewingBooking.vehicleType}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Requested Date</label>
                  <div style={{ fontWeight: '500', fontSize: '12px' }}>{new Date(viewingBooking.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trip Notes</label>
                <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', fontStyle: viewingBooking.notes ? 'normal' : 'italic' }}>
                  {viewingBooking.notes || 'No special requirements listed'}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-muted)' }}>Dispatch Information</h4>
                {viewingBooking.assignedVehicleId || viewingBooking.assignedDriverId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {viewingBooking.assignedVehicleId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span></span>
                        <div>
                          <div style={{ fontWeight: '500' }}>{vehicles.find(v => v.id === viewingBooking.assignedVehicleId)?.name || 'Unknown Vehicle'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Plate: {vehicles.find(v => v.id === viewingBooking.assignedVehicleId)?.plateNumber || 'N/A'}</div>
                        </div>
                      </div>
                    )}
                    {viewingBooking.assignedDriverId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span></span>
                        <div>
                          <div style={{ fontWeight: '500' }}>{drivers.find(d => d.id === viewingBooking.assignedDriverId)?.name || 'Unknown Driver'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone: {drivers.find(d => d.id === viewingBooking.assignedDriverId)?.phone || 'N/A'} | License: {drivers.find(d => d.id === viewingBooking.assignedDriverId)?.licenseNumber || 'N/A'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-muted)' }}>
                    No vehicle or driver assigned to this booking yet.
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn-primary" onClick={() => setViewingBooking(null)}>Close Details</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default AdminBookings;
