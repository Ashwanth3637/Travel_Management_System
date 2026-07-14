import React, { useState } from 'react';

function AdminDrivers({ token, drivers, refresh, toast }) {
  const API_URL = 'http://localhost:5001/api';

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');

  const handleAddDriver = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, licenseNumber: license })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save driver');
      toast('Driver registered successfully!', null);
      setShowModal(false);
      setName(''); setPhone(''); setLicense('');
      refresh();
    } catch (err) {
      toast(null, err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this driver?')) return;
    try {
      const res = await fetch(`${API_URL}/drivers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete driver');
      toast('Driver profile deleted.', null);
      refresh();
    } catch (err) {
      toast(null, err.message);
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Drivers Registry</h3>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Driver
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver ID</th>
              <th>Full Name</th>
              <th>Phone Number</th>
              <th>License Number</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No drivers registered.</td>
              </tr>
            ) : (
              drivers.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.id}</strong></td>
                  <td>{d.name}</td>
                  <td>{d.phone}</td>
                  <td>{d.licenseNumber}</td>
                  <td>
                    <span className={`badge badge-${d.status === 'Available' ? 'inprogress' : d.status === 'On Trip' ? 'confirmed' : 'pending'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDelete(d.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Driver */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Register Driver</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddDriver}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="e.g. Ramesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" placeholder="e.g. +91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label className="form-label">License Number</label>
                <input type="text" className="form-input" placeholder="e.g. DL-12345TN" value={license} onChange={(e) => setLicense(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDrivers;
