import React, { useState } from 'react';
import { createPortal } from 'react-dom';

function AdminDrivers({ token, drivers, refresh, toast }) {
  const API_URL = 'http://localhost:5001/api';

  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [status, setStatus] = useState('Available');
  const [viewingDriver, setViewingDriver] = useState(null);

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    try {
      const url = editingDriver ? `${API_URL}/drivers/${editingDriver.id}` : `${API_URL}/drivers`;
      const method = editingDriver ? 'PUT' : 'POST';
      const body = { name, phone, licenseNumber: license };
      if (editingDriver) {
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
      if (!res.ok) throw new Error(data.error || 'Failed to save driver');
      toast(editingDriver ? 'Driver profile updated!' : 'Driver registered successfully!', null);
      handleCloseModal();
      refresh();
    } catch (err) {
      toast(null, err.message);
    }
  };

  const handleEditClick = (d) => {
    setEditingDriver(d);
    setName(d.name);
    setPhone(d.phone);
    setLicense(d.licenseNumber);
    setStatus(d.status || 'Available');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDriver(null);
    setName('');
    setPhone('');
    setLicense('');
    setStatus('Available');
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
        <button className="btn btn-primary" onClick={() => { handleCloseModal(); setShowModal(true); }}>
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
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-indigo" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => setViewingDriver(d)}>
                        View
                      </button>
                      <button className="btn btn-warning" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleEditClick(d)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleDelete(d.id)}>
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

      {/* Modal: Add/Edit Driver */}
      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingDriver ? 'Update Driver' : 'Register Driver'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSaveDriver}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="e.g. Ramesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" placeholder="e.g. +91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">License Number</label>
                <input type="text" className="form-input" placeholder="e.g. DL-12345TN" value={license} onChange={(e) => setLicense(e.target.value)} required />
              </div>
              {editingDriver && (
                <div className="form-group" style={{ marginBottom: '25px' }}>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Driver</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: View Driver Details */}
      {viewingDriver && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ textAlign: 'left' }}>
            <div className="modal-header">
              <h3 className="modal-title">Driver Details</h3>
              <button className="modal-close" onClick={() => setViewingDriver(null)}>×</button>
            </div>
            <div className="details-list">
              <div className="details-row">
                <span className="details-label">Driver ID</span>
                <span className="details-value">{viewingDriver.id}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Full Name</span>
                <span className="details-value">{viewingDriver.name}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Phone Number</span>
                <span className="details-value">{viewingDriver.phone}</span>
              </div>
              <div className="details-row">
                <span className="details-label">License Number</span>
                <span className="details-value">{viewingDriver.licenseNumber}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Email Address</span>
                <span className="details-value">{viewingDriver.email || '—'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Account Role</span>
                <span className="details-value">{viewingDriver.role ? viewingDriver.role.toUpperCase() : 'DRIVER'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Status</span>
                <span className="details-value">
                  <span className={`badge badge-${viewingDriver.status === 'Available' ? 'inprogress' : viewingDriver.status === 'On Trip' ? 'confirmed' : 'pending'}`}>
                    {viewingDriver.status}
                  </span>
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setViewingDriver(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default AdminDrivers;
