import React, { useState } from 'react';
import { createPortal } from 'react-dom';

function AdminVehicles({ token, vehicles, refresh, toast }) {
  const API_URL = 'http://localhost:5001/api';

  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [type, setType] = useState('Sedan');
  const [acpreference, setacPreference] = useState('AC');
  const [capacity, setCapacity] = useState(4);
  const [rate, setRate] = useState(12);
  const [status, setStatus] = useState('Available');
  const [viewingVehicle, setViewingVehicle] = useState(null);

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    try {
      const url = editingVehicle ? `${API_URL}/vehicles/${editingVehicle.id}` : `${API_URL}/vehicles`;
      const method = editingVehicle ? 'PUT' : 'POST';
      const body = {
        name,
        plateNumber: plate,
        type,
        acpreference,
        capacity: parseInt(capacity),
        ratePerKm: parseFloat(rate)
      };
      if (editingVehicle) {
        body.status = status;
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
      if (!res.ok) throw new Error(data.error || 'Failed to save vehicle');
      toast(editingVehicle ? 'Vehicle updated successfully!' : 'Vehicle added to registry!', null);
      handleCloseModal();
      refresh();
    } catch (err) {
      toast(null, err.message);
    }
  };

  const handleEditClick = (v) => {
    setEditingVehicle(v);
    setName(v.name);
    setPlate(v.plateNumber);
    setType(v.type);
    setacPreference(v.acpreference);
    setCapacity(v.capacity);
    setRate(v.ratePerKm);
    setStatus(v.status || 'Available');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setName('');
    setPlate('');
    setType('Sedan');
    setacPreference('AC');
    setCapacity(4);
    setRate(12);
    setStatus('Available');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      const res = await fetch(`${API_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete vehicle');
      toast('Vehicle removed.', null);
      refresh();
    } catch (err) {
      toast(null, err.message);
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Active Fleet (Vehicles)</h3>
        <button className="btn btn-primary" onClick={() => { handleCloseModal(); setShowModal(true); }}>
          + Add Vehicle
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle ID</th>
              <th>Model Name</th>
              <th>Registration Number</th>
              <th>Category</th>
              <th>AC Preference</th>
              <th>Seating Capacity</th>
              <th>Rate / KM</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No vehicles registered in fleet.</td>
              </tr>
            ) : (
              vehicles.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.id}</strong></td>
                  <td>{v.name}</td>
                  <td>{v.plateNumber}</td>
                  <td>{v.type}</td>
                  <td>{v.acpreference}</td>
                  <td>{v.capacity} Passengers</td>
                  <td>₹{v.ratePerKm}/km</td>
                  <td>
                    <span className={`badge badge-${v.status === 'Available' ? 'inprogress' : v.status === 'Assigned' ? 'confirmed' : 'cancelled'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-indigo" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => setViewingVehicle(v)}>
                        View
                      </button>
                      <button className="btn btn-warning" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleEditClick(v)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleDelete(v.id)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add/Edit Vehicle */}
      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSaveVehicle}>
              <div className="form-group">
                <label className="form-label">Model Name</label>
                <input type="text" className="form-input" placeholder="e.g. Swift Dzire" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Plate Number</label>
                <input type="text" className="form-input" placeholder="e.g. TN-33-CC-1234" value={plate} onChange={(e) => setPlate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Minivan">Minivan</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">AC/Non AC Preference</label>
                <select className="form-select" value={acpreference} onChange={(e) => setacPreference(e.target.value)}>
                  <option value="AC">AC</option>
                  <option value="Non-AC">Non-AC</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Seating Capacity</label>
                <input type="number" className="form-input" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Rate per KM (INR)</label>
                <input type="number" className="form-input" value={rate} onChange={(e) => setRate(e.target.value)} required />
              </div>
              {editingVehicle && (
                <div className="form-group" style={{ marginBottom: '25px' }}>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: View Vehicle Details */}
      {viewingVehicle && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ textAlign: 'left' }}>
            <div className="modal-header">
              <h3 className="modal-title">Vehicle Details</h3>
              <button className="modal-close" onClick={() => setViewingVehicle(null)}>×</button>
            </div>
            <div className="details-list">
              <div className="details-row">
                <span className="details-label">Vehicle ID</span>
                <span className="details-value">{viewingVehicle.id}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Model Name</span>
                <span className="details-value">{viewingVehicle.name}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Registration Number</span>
                <span className="details-value">{viewingVehicle.plateNumber}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Category</span>
                <span className="details-value">{viewingVehicle.type}</span>
              </div>
              <div className="details-row">
                <span className="details-label">AC/Non AC Preference</span>
                <span className="details-value">{viewingVehicle.acpreference}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Seating Capacity</span>
                <span className="details-value">{viewingVehicle.capacity} Passengers</span>
              </div>
              <div className="details-row">
                <span className="details-label">Rate Per KM</span>
                <span className="details-value">₹{viewingVehicle.ratePerKm}/km</span>
              </div>
              <div className="details-row">
                <span className="details-label">Status</span>
                <span className="details-value">
                  <span className={`badge badge-${viewingVehicle.status === 'Available' ? 'inprogress' : viewingVehicle.status === 'Assigned' ? 'confirmed' : 'cancelled'}`}>
                    {viewingVehicle.status}
                  </span>
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setViewingVehicle(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default AdminVehicles;
