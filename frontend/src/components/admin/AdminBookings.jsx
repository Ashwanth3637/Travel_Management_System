import React, { useState } from 'react';
import { createPortal } from 'react-dom';

function AdminBookings({ token, bookings, vehicles, drivers, refresh, toast, onlyActive, onlyHistory }) {
  const API_URL = 'http://localhost:5001/api';

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [assigningBooking, setAssigningBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);

  const [historyCategory, setHistoryCategory] = useState(null);

  const HISTORY_CATEGORIES = [
    { type: 'Sedan', img: '/cars/sedan/swift_dzire.png', color: 'var(--color-primary)' },
    { type: 'SUV', img: '/cars/suv/mahindra_thar.png', color: '#f59e0b' },
    { type: 'Luxury', img: '/cars/luxury/bmw.png', color: '#10b981' },
    { type: 'Minivan', img: '/cars/minivan/tempo_traveller.png', color: '#6366f1' }
  ];

  const shortenAddress = (address) => {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length <= 2) return address;
    return parts.slice(0, 2).map(p => p.trim()).join(', ');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      // Format to DD/MM/YY, HH:MM
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  };

  // New booking form fields
  const [custName, setCustName] = useState('');
  const [custContact, setCustContact] = useState('');
  const [bPickup, setBPickup] = useState('');
  const [bDrop, setBDrop] = useState('');
  const [bDateTime, setBDateTime] = useState('');
  const [bType, setBType] = useState('Sedan');
  const [bNotes, setBNotes] = useState('');
  const [bPassengers, setBPassengers] = useState(1);
  const [bTripType, setBTripType] = useState('One Way');
  const [bSpecialRequirements, setBSpecialRequirements] = useState('');
  const [bStatus, setBStatus] = useState('Pending');

  // Assignment selection fields
  const [selVehicleId, setSelVehicleId] = useState('');
  const [selDriverId, setSelDriverId] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      toast(null, 'Failed to refresh data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveBooking = async (e) => {
    e.preventDefault();
    try {
      const url = editingBooking ? `${API_URL}/bookings/${editingBooking.id}` : `${API_URL}/bookings`;
      const method = editingBooking ? 'PUT' : 'POST';
      const body = {
        customerName: custName,
        customerContact: custContact,
        pickupLocation: bPickup,
        dropLocation: bDrop,
        pickupDateTime: bDateTime,
        vehicleType: bType,
        passengersCount: parseInt(bPassengers) || 1,
        tripType: bTripType,
        specialRequirements: bSpecialRequirements || bNotes || '',
        notes: bNotes || bSpecialRequirements || ''
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
    setCustContact(b.customerContact || '');
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
    setBPassengers(b.passengersCount || 1);
    setBTripType(b.tripType || 'One Way');
    setBSpecialRequirements(b.specialRequirements || b.notes || '');
    setBStatus(b.status || 'Pending');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingBooking(null);
    setCustName('');
    setCustContact('');
    setBPickup('');
    setBDrop('');
    setBDateTime('');
    setBType('Sedan');
    setBNotes('');
    setBPassengers(1);
    setBTripType('One Way');
    setBSpecialRequirements('');
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
    setSelVehicleId(booking.assignedVehicleId || '');
    setSelDriverId(booking.assignedDriverId || '');
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selVehicleId || !selDriverId) {
      toast(null, 'Please select both a vehicle and a driver.');
      return;
    }
    // Soft warning for low capacity — admin can override
    const vehicle = vehicles.find(v => v.id === selVehicleId);
    if (vehicle && vehicle.capacity < (assigningBooking.passengersCount || 1)) {
      const ok = window.confirm(
        `⚠️ Capacity Warning:\n${vehicle.name} has ${vehicle.capacity} seats but this booking needs ${assigningBooking.passengersCount || 1} passengers.\n\nProceed with assignment anyway? (Admin override)`
      );
      if (!ok) return;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* Active Bookings & Dispatch */}
      {!onlyHistory && (
        <div className="glass-panel" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Active Bookings & Dispatch</h3>
          <button
            onClick={handleManualRefresh}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer'
            }}
            disabled={isRefreshing}
          >
            <span
              style={{
                display: 'inline-block',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                fontSize: '14px',
                lineHeight: '1'
              }}
            >
              ⟳
            </span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
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
                    <td title={`${b.pickupLocation} ➔ ${b.dropLocation}`} style={{ lineHeight: '1.4' }}>
                      {shortenAddress(b.pickupLocation)} ➔ {shortenAddress(b.dropLocation)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(b.pickupDateTime)}</td>
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
                            <button className="btn btn-assign" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleOpenAssignModal(b)}>
                              Confirm
                            </button>
                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleCancelBooking(b.id)}>
                              Cancel
                            </button>
                          </>
                        )}
                        {b.status === 'Confirmed' && (
                          <>
                            <button className="btn btn-start" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleForceStatus(b.id, 'In Progress')}>
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
                        <button className="btn btn-view" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => setViewingBooking(b)}>
                          View
                        </button>
                        <button className="btn btn-edit" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleEditBookingClick(b)}>
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
        <div className="glass-panel" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          {!historyCategory ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Booking History (Archived)</h3>
              </div>

              {/* Category Folders (Grid) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                {HISTORY_CATEGORIES.map(cat => {
                  const count = archivedBookings.filter(b => b.vehicleType && b.vehicleType.toLowerCase() === cat.type.toLowerCase()).length;
                  return (
                    <div 
                      key={cat.type}
                      className="glass-panel"
                      onClick={() => setHistoryCategory(cat.type)}
                      style={{
                        padding: '30px 20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease-in-out',
                        borderLeft: `4px solid ${cat.color}`,
                        borderTop: '1px solid transparent',
                        borderRight: '1px solid transparent',
                        borderBottom: '1px solid transparent',
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        boxSizing: 'border-box'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.25)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.borderTop = `1px solid ${cat.color}`;
                        e.currentTarget.style.borderRight = `1px solid ${cat.color}`;
                        e.currentTarget.style.borderBottom = `1px solid ${cat.color}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                        e.currentTarget.style.borderTop = '1px solid transparent';
                        e.currentTarget.style.borderRight = '1px solid transparent';
                        e.currentTarget.style.borderBottom = '1px solid transparent';
                      }}
                    >
                      <img
                        src={cat.img}
                        alt={cat.type}
                        style={{
                          width: '90px',
                          height: '60px',
                          objectFit: 'contain',
                          marginBottom: '8px',
                          borderRadius: '4px'
                        }}
                      />
                      <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{cat.type} History</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {count} {count === 1 ? 'booking' : 'bookings'} archived
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* Category History Detail View Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setHistoryCategory(null)}
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '13px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      borderRadius: '8px'
                    }}
                  >
                    ← Back to History
                  </button>
                  <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: HISTORY_CATEGORIES.find(c => c.type.toLowerCase() === historyCategory.toLowerCase())?.color || 'var(--color-primary)'
                      }}></span>
                      {historyCategory} Booking History
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Showing all {archivedBookings.filter(b => b.vehicleType && b.vehicleType.toLowerCase() === historyCategory.toLowerCase()).length} archived booking(s)
                    </span>
                  </div>
                </div>
              </div>

              <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
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
                      <th>Feedback</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedBookings.filter(b => b.vehicleType && b.vehicleType.toLowerCase() === historyCategory.toLowerCase()).length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                          No archived bookings found in the <strong>{historyCategory}</strong> history folder.
                        </td>
                      </tr>
                    ) : (
                      archivedBookings.filter(b => b.vehicleType && b.vehicleType.toLowerCase() === historyCategory.toLowerCase()).map(b => (
                        <tr key={b.id}>
                          <td style={{ whiteSpace: 'nowrap' }}><strong>{b.id}</strong></td>
                          <td>{b.customerName}</td>
                          <td title={`${b.pickupLocation} ➔ ${b.dropLocation}`} style={{ lineHeight: '1.4' }}>
                            {shortenAddress(b.pickupLocation)} ➔ {shortenAddress(b.dropLocation)}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(b.pickupDateTime)}</td>
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
                            {b.rating > 0 ? (
                              <div>
                                <span style={{ color: '#fbbf24', fontWeight: '700' }}>{'★'.repeat(b.rating)}</span>
                                {b.feedback && (
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.feedback}>
                                    "{b.feedback}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No feedback</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginRight: '6px' }}>Archived</span>
                              <button className="btn btn-view" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => setViewingBooking(b)}>
                                View
                              </button>
                              <button className="btn btn-edit" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleEditBookingClick(b)}>
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
            </>
          )}
        </div>
      )}

      {/* Modal: Create/Edit Booking */}
      {showAddModal && createPortal(
        <div className="modal-overlay" onClick={handleCloseAddModal}>
          <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingBooking ? 'Update Booking Details' : 'Book New Ride Request'}</h3>
              <button type="button" className="modal-close" onClick={handleCloseAddModal}>×</button>
            </div>
            <form onSubmit={handleSaveBooking} action="javascript:void(0)">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input type="text" className="form-input" placeholder="e.g. Ashwanth S" value={custName} onChange={(e) => setCustName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Contact Details</label>
                <input type="tel" className="form-input" placeholder="e.g. +91 9876543210" value={custContact} onChange={(e) => setCustContact(e.target.value)} required />
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
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Requested Vehicle Category</label>
                  <select className="form-select" value={bType} onChange={(e) => setBType(e.target.value)}>
                    <option value="Sedan">Sedan (Max 4 PAX)</option>
                    <option value="SUV">SUV (Max 7 PAX)</option>
                    <option value="Luxury">Luxury (Max 4 PAX)</option>
                    <option value="Minivan">Minivan (Max 12 PAX)</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Trip Type</label>
                  <select className="form-select" value={bTripType} onChange={(e) => setBTripType(e.target.value)}>
                    <option value="One Way">One Way</option>
                    <option value="Round Trip">Round Trip</option>
                    <option value="Local Travel">Local Travel</option>
                    <option value="Outstation Travel">Outstation Travel</option>
                    <option value="Airport Pickup">Airport Pickup</option>
                    <option value="Airport Drop">Airport Drop</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">No. of Passengers</label>
                  <input type="number" className="form-input" min="1" max="50" value={bPassengers} onChange={(e) => setBPassengers(parseInt(e.target.value) || 1)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Special Requirements</label>
                  <input type="text" className="form-input" placeholder="e.g. infant seat, extra boot space" value={bSpecialRequirements} onChange={(e) => setBSpecialRequirements(e.target.value)} />
                </div>
              </div>
              {editingBooking && (
                <div className="form-group" style={{ marginBottom: '25px' }}>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={bStatus} onChange={(e) => setBStatus(e.target.value)}>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Driver Assigned">Driver Assigned</option>
                    <option value="Vehicle Assigned">Vehicle Assigned</option>
                    <option value="Trip Scheduled">Trip Scheduled</option>
                    <option value="Ongoing">Ongoing</option>
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
        <div className="modal-overlay" onClick={() => setAssigningBooking(null)}>
          <div className="glass-panel modal-content" style={{ maxWidth: '680px', width: '95vw' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🚀 Assign Vehicle & Driver</h3>
              <button className="modal-close" type="button" onClick={() => setAssigningBooking(null)}>×</button>
            </div>

            {/* Booking Summary Banner */}
            <div style={{ marginBottom: '22px', padding: '14px 16px', background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(16,185,129,0.08))', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.25)', fontSize: '13px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Booking ID: </span><strong style={{ color: 'var(--color-primary)' }}>#{assigningBooking.id}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Customer: </span><strong>{assigningBooking.customerName}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Category: </span><strong>{assigningBooking.vehicleType}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Passengers: </span><strong>{assigningBooking.passengersCount || 1}</strong></div>
              <div style={{ width: '100%', marginTop: '4px', color: 'var(--text-muted)', fontSize: '12px' }}>
                📍 {assigningBooking.pickupLocation} ➔ {assigningBooking.dropLocation}
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} action="javascript:void(0)">
              {/* ── Auto-Assigned Vehicle Info (Customer Chosen) ── */}
              {(() => {
                const assignedVehicle = vehicles.find(v => v.id === assigningBooking.assignedVehicleId || v._id === assigningBooking.assignedVehicleId);
                return (
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '32px', padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      🚙
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selected Vehicle (Customer Choice)</div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                        {assignedVehicle ? assignedVehicle.name : 'Unassigned Vehicle'}
                      </div>
                      <div style={{ display: 'flex', gap: '15px', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {assignedVehicle && (
                          <>
                            <div>📋 <b>Number:</b> {assignedVehicle.plateNumber}</div>
                            <div>👥 <b>Capacity:</b> {assignedVehicle.capacity} Seats</div>
                            <div>💰 <b>Rate:</b> ₹{assignedVehicle.ratePerKm}/km</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}


              {/* ── Driver Selection ── */}
              <div style={{ marginBottom: '26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>
                    👤 Select Available Driver
                  </label>
                  <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', background: drivers.filter(d => d.status === 'Available' || d.id === assigningBooking.assignedDriverId || d._id === assigningBooking.assignedDriverId).length > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: drivers.filter(d => d.status === 'Available' || d.id === assigningBooking.assignedDriverId || d._id === assigningBooking.assignedDriverId).length > 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                    {drivers.filter(d => d.status === 'Available' || d.id === assigningBooking.assignedDriverId || d._id === assigningBooking.assignedDriverId).length} Available
                  </span>
                </div>

                {drivers.filter(d => d.status === 'Available' || d.id === assigningBooking.assignedDriverId || d._id === assigningBooking.assignedDriverId).length === 0 ? (
                  <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#ef4444', textAlign: 'center', fontSize: '13px' }}>
                    🚫 No available drivers. All {drivers.length} drivers are currently on trips or inactive.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', padding: '4px 2px' }}>
                    {drivers
                      .filter(d => d.status === 'Available' || d.id === assigningBooking.assignedDriverId || d._id === assigningBooking.assignedDriverId)
                      .map(d => {
                        const isSelected = selDriverId === d.id || selDriverId === d._id;
                        return (
                          <div
                            key={d.id || d._id}
                            onClick={() => {
                              const driverId = d.id || d._id || '';
                              console.log("AdminBookings - Driver Row Clicked:", d, "Selected ID:", driverId);
                              setSelDriverId(driverId);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--border-color)',
                              background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              position: 'relative'
                            }}
                            onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
                            onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border-color)'; } }}
                          >
                            {isSelected && (
                              <div style={{ position: 'absolute', right: '14px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff' }}>✓</div>
                            )}
                            {/* Avatar */}
                            {d.photo ? (
                              <img src={d.photo} alt={d.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                            ) : (
                              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                                {d.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '700', fontSize: '13px' }}>{d.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📞 {d.phone}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🪪 License: {d.licenseNumber}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: '700' }}>Available</span>
                              {d.gender && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{d.gender}</div>}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
                {selDriverId === '' && drivers.filter(d => d.status === 'Available').length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>Click a driver row to select</div>
                )}
              </div>

              {/* Selected Summary */}
              {(selVehicleId || selDriverId) && (
                <div style={{ marginBottom: '18px', padding: '12px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', fontSize: '12px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {selVehicleId && <div>🚗 <strong>Vehicle:</strong> {vehicles.find(v => v.id === selVehicleId || v._id === selVehicleId)?.name} ({vehicles.find(v => v.id === selVehicleId || v._id === selVehicleId)?.plateNumber})</div>}
                  {selDriverId && <div>👤 <strong>Driver:</strong> {drivers.find(d => d.id === selDriverId || d._id === selDriverId)?.name}</div>}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningBooking(null)}>Cancel</button>
                <button type="submit" className="btn btn-assign" disabled={!selVehicleId || !selDriverId}>
                  ✅ Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: View Booking / Customer Details */}
      {viewingBooking && createPortal(
        <div className="modal-overlay" onClick={() => setViewingBooking(null)}>
          <div className="glass-panel modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Ride & Customer Details</h3>
              <button type="button" className="modal-close" onClick={() => setViewingBooking(null)}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Customer Name</label>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{viewingBooking.customerName}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contact Details</label>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>{viewingBooking.customerContact || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Booking ID</label>
                  <div style={{ fontWeight: '700', color: 'var(--color-primary)' }}>#{viewingBooking.id}</div>
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

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Booking Date</label>
                  <div style={{ fontWeight: '500', fontSize: '13px' }}>
                    {viewingBooking.bookingDate || (viewingBooking.createdAt ? new Date(viewingBooking.createdAt).toLocaleDateString() : 'N/A')}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trip Type</label>
                  <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{viewingBooking.tripType || 'One Way'}</div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pickup Location</label>
                <div style={{ fontWeight: '500', fontSize: '13.5px' }}>{viewingBooking.pickupLocation}</div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Drop Location</label>
                <div style={{ fontWeight: '500', fontSize: '13.5px' }}>{viewingBooking.dropLocation}</div>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Travel Date</label>
                  <div style={{ fontWeight: '500' }}>{viewingBooking.travelDate || (viewingBooking.pickupDateTime ? viewingBooking.pickupDateTime.split('T')[0] : 'N/A')}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Travel Time</label>
                  <div style={{ fontWeight: '500' }}>{viewingBooking.travelTime || (viewingBooking.pickupDateTime ? viewingBooking.pickupDateTime.split('T')[1] : 'N/A')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Requested Category</label>
                  <div style={{ fontWeight: '500' }}>{viewingBooking.vehicleType}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No. of Passengers</label>
                  <div style={{ fontWeight: '600' }}>{viewingBooking.passengersCount || 1} Passengers</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Fare</label>
                  <div style={{ fontWeight: '700', fontSize: '17px', color: '#10b981' }}>₹{viewingBooking.fareEstimated}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Request Logged At</label>
                  <div style={{ fontWeight: '500', fontSize: '12px' }}>{new Date(viewingBooking.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Special Requirements</label>
                <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', fontStyle: (viewingBooking.specialRequirements || viewingBooking.notes) ? 'normal' : 'italic' }}>
                  {viewingBooking.specialRequirements || viewingBooking.notes || 'No special requirements listed'}
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

              {viewingBooking.rating > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-muted)' }}>Customer Feedback</h4>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(251, 191, 36, 0.03)', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rating:</span>
                      <span style={{ fontSize: '16px', color: '#fbbf24' }}>
                        {'★'.repeat(viewingBooking.rating)}{'☆'.repeat(5 - viewingBooking.rating)}
                      </span>
                    </div>
                    {viewingBooking.feedback && (
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', fontStyle: 'italic' }}>
                        "{viewingBooking.feedback}"
                      </div>
                    )}
                  </div>
                </div>
              )}
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
