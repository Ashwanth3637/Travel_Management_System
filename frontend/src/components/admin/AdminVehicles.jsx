import React, { useState } from 'react';

function AdminVehicles({ token, vehicles, refresh, toast }) {
  const API_URL = 'http://localhost:5001/api';

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [type, setType] = useState('Sedan');
  const [acpreference, setacPreference] = useState('AC');
  const [capacity, setCapacity] = useState(4);
  const [rate, setRate] = useState(12);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          plateNumber: plate,
          type,
          acpreference,
          capacity: parseInt(capacity),
          ratePerKm: parseFloat(rate)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save vehicle');
      toast('Vehicle added to registry!', null);
      setShowModal(false);
      // Reset
      setName(''); setPlate(''); setType('Sedan'); setacPreference('AC'); setCapacity(4); setRate(12);
      refresh();
    } catch (err) {
      toast(null, err.message);
    }
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
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
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
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No vehicles registered in fleet.</td>
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
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDelete(v.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Vehicle */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Register Vehicle</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddVehicle}>
              <div className="form-group">
                <label className="form-label">Model Name</label>
                <input type="text" className="form-input" placeholder="e.g. Swift Dzire" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Plate Number</label>
                <input type="text" className="form-input" placeholder="e.g. TN-37-AB-1234" value={plate} onChange={(e) => setPlate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
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
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label className="form-label">Rate per KM (INR)</label>
                <input type="number" className="form-input" value={rate} onChange={(e) => setRate(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminVehicles;
