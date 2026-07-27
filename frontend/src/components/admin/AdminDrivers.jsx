import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const MALE_AVATARS = [
  '/drivers/driver_avatar_1.png',
  '/drivers/driver_avatar_2.png',
  '/drivers/driver_avatar_3.png',
  '/drivers/driver_avatar_5.png',
  '/drivers/driver_avatar_6.png'
];

const FEMALE_AVATARS = [
  '/drivers/driver_avatar_4.png'
];

const getDriverAvatar = (gender, index) => {
  const isFemale = gender && gender.toLowerCase() === 'female';
  const list = isFemale ? FEMALE_AVATARS : MALE_AVATARS;
  return list[index % list.length];
};

function AdminDrivers({ token, drivers, refresh, toast }) {
  const API_URL = 'http://localhost:5001/api';

  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [photo, setPhoto] = useState(null);
  const [gender, setGender] = useState('Male');
  const [status, setStatus] = useState('Available');
  const [viewingDriver, setViewingDriver] = useState(null);

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    try {
      const url = editingDriver ? `${API_URL}/drivers/${editingDriver.id}` : `${API_URL}/drivers`;
      const method = editingDriver ? 'PUT' : 'POST';
      const body = { name, phone, licenseNumber: license, photo, gender };
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
    setPhoto(d.photo || '');
    setGender(d.gender || 'Male');
    setStatus(d.status || 'Available');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDriver(null);
    setName('');
    setPhone('');
    setLicense('');
    setPhoto('');
    setGender('Male');
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
      <div className="flex justify-between items-center mb-5">
        <h3 className="m-0 text-xl font-bold">Drivers Registry</h3>
        <button 
          className="px-4 py-2.5 font-bold text-sm bg-blue-600 text-white border-none rounded-lg cursor-pointer shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition"
          onClick={() => { handleCloseModal(); setShowModal(true); }}
        >
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
                <td colSpan="6" className="text-center text-slate-400">No drivers registered.</td>
              </tr>
            ) : (
              drivers.map((d, idx) => {
                const avatarColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#8b5cf6', '#06b6d4'];
                const bgColor = avatarColors[idx % avatarColors.length];
                const photoSrc = d.photo || getDriverAvatar(d.gender, idx);
                const initial = d.name ? d.name.charAt(0).toUpperCase() : '?';
                return (
                  <tr key={d.id}>
                    <td><strong>{d.id}</strong></td>
                    <td className="font-semibold flex items-center gap-2.5">
                      <div className="relative inline-block">
                        <img
                          src={photoSrc}
                          alt={d.name}
                          className="w-8 h-8 rounded-full object-cover border-2 block"
                          style={{ borderColor: bgColor }}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <div
                          className="hidden w-8 h-8 rounded-full items-center justify-center text-sm font-bold text-white border-2"
                          style={{ backgroundColor: bgColor, borderColor: bgColor }}
                        >
                          {initial}
                        </div>
                      </div>
                      <span>{d.name}</span>
                    </td>
                    <td>{d.phone}</td>
                    <td>{d.licenseNumber}</td>
                    <td>
                      <span className={`badge badge-${d.status === 'Assigned' ? 'assigned' : d.status === 'On Trip' ? 'ontrip' : d.status === 'Inactive' ? 'inactive' : 'available'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1.5 items-center">
                        <button 
                          onClick={() => setViewingDriver(d)}
                          className="px-2.5 h-7 text-[11px] font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-white border-none cursor-pointer transition inline-flex items-center justify-center"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleEditClick(d)}
                          className="px-2.5 h-7 text-[11px] font-bold rounded-md bg-blue-600 hover:bg-blue-700 text-white border-none cursor-pointer transition inline-flex items-center justify-center"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(d.id)} 
                          title="Remove"
                          className="w-7 h-7 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300 cursor-pointer transition inline-flex items-center justify-center shrink-0"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Driver Photo URL/Path</label>
                <input type="text" className="form-input" placeholder="e.g. /drivers/driver_avatar_1.png" value={photo || ''} onChange={(e) => setPhoto(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Or Upload Driver Photo File</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPhoto(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {photo && (
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <img src={photo} alt="Driver preview" className="w-[50px] h-[50px] rounded-full object-cover border-2 border-blue-600" />
                    <button type="button" className="btn btn-secondary px-2 py-1 text-[11px]" onClick={() => setPhoto('')}>Remove Photo</button>
                  </div>
                )}
              </div>
              {editingDriver && (
                <div className="form-group mb-6">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2.5 mt-5">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 font-bold text-sm bg-blue-600 text-white border-none rounded-lg cursor-pointer shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: View Driver Details */}
      {viewingDriver && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content text-left">
            <div className="modal-header">
              <h3 className="modal-title">Driver Details</h3>
              <button className="modal-close" onClick={() => setViewingDriver(null)}>×</button>
            </div>
            <div className="details-list">
              {[
                { label: 'Driver ID', value: viewingDriver.id },
                { label: 'Full Name', value: viewingDriver.name },
                { label: 'Phone Number', value: viewingDriver.phone },
                { label: 'License Number', value: viewingDriver.licenseNumber },
                { label: 'Email Address', value: viewingDriver.email || '—' },
                { label: 'Gender', value: viewingDriver.gender || 'Male' },
                { label: 'Account Role', value: viewingDriver.role ? viewingDriver.role.toUpperCase() : 'DRIVER' },
                {
                  label: 'Status',
                  value: (
                    <span className={`badge badge-${viewingDriver.status === 'Assigned' ? 'assigned' : viewingDriver.status === 'On Trip' ? 'ontrip' : viewingDriver.status === 'Inactive' ? 'inactive' : 'available'}`}>
                      {viewingDriver.status}
                    </span>
                  )
                }
              ].map((row, idx) => (
                <div key={idx} className="details-row">
                  <span className="details-label">{row.label}</span>
                  <span className="details-value">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-5">
              <button className="btn btn-secondary px-3 py-1.5 text-xs" onClick={() => setViewingDriver(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminDrivers;
