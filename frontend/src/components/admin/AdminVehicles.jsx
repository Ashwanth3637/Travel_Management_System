import React, { useState } from 'react';
import { createPortal } from 'react-dom';

function AdminVehicles({ token, vehicles, refresh, toast }) {
  const API_URL = 'http://localhost:5001/api';

  const CATEGORIES = [
    { type: 'Sedan', img: '/cars/sedan/vitara_brezza.png', defaultCapacity: 4, defaultRate: 12, color: 'var(--color-primary)' },
    { type: 'SUV', img: '/cars/suv/mahindra_thar.png', defaultCapacity: 6, defaultRate: 18, color: '#f59e0b' },
    { type: 'Luxury', img: '/cars/luxury/bmw.png', defaultCapacity: 4, defaultRate: 28, color: '#10b981' },
    { type: 'Minivan', img: '/cars/minivan/tempo_traveller.png', defaultCapacity: 12, defaultRate: 25, color: '#6366f1' }
  ];

  const [activeCategory, setActiveCategory] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [type, setType] = useState('Sedan');
  const [vehicleType, setVehicleType] = useState('AC');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [fuelType, setFuelType] = useState('Petrol');
  const [rate, setRate] = useState(12);
  const [status, setStatus] = useState('Available');
  const [availability, setAvailability] = useState(true);
  const [registrationDetails, setRegistrationDetails] = useState('');
  const [insuranceDetails, setInsuranceDetails] = useState('');
  const [image, setImage] = useState('');
  const [viewingVehicle, setViewingVehicle] = useState(null);

  const handleAddWithCategory = (cat) => {
    handleCloseModal();
    setType(cat.type);
    setCapacity(cat.defaultCapacity);
    setRate(cat.defaultRate);
    setImage('');
    setName('');
    setActiveCategory(cat.type);
    setShowModal(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    try {
      const url = editingVehicle ? `${API_URL}/vehicles/${editingVehicle.id}` : `${API_URL}/vehicles`;
      const method = editingVehicle ? 'PUT' : 'POST';
      const body = {
        name,
        plateNumber: plate,
        vehicleNumber: vehicleNumber || plate,
        type,
        vehicleType,
        acpreference: vehicleType,
        brand,
        model,
        capacity: parseInt(capacity),
        fuelType,
        status,
        availability,
        registrationDetails,
        insuranceDetails,
        ratePerKm: parseFloat(rate),
        image
      };

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
    setVehicleNumber(v.vehicleNumber || v.plateNumber || '');
    setType(v.type);
    setVehicleType(v.vehicleType || v.acpreference || 'AC');
    setBrand(v.brand || '');
    setModel(v.model || '');
    setCapacity(v.capacity);
    setFuelType(v.fuelType || 'Petrol');
    setRate(v.ratePerKm);
    setStatus(v.status || 'Available');
    setAvailability(v.availability !== undefined ? v.availability : true);
    setRegistrationDetails(v.registrationDetails || '');
    setInsuranceDetails(v.insuranceDetails || '');
    setImage(v.image || '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setName('');
    setPlate('');
    setVehicleNumber('');
    setType('Sedan');
    setVehicleType('AC');
    setBrand('');
    setModel('');
    setCapacity(4);
    setFuelType('Petrol');
    setRate(12);
    setStatus('Available');
    setAvailability(true);
    setRegistrationDetails('');
    setInsuranceDetails('');
    setImage('');
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
      {!activeCategory ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Vehicle Management Registry</h3>
            <button className="btn btn-primary" onClick={() => { handleCloseModal(); setShowModal(true); }}>
              + Add Vehicle
            </button>
          </div>

          {/* Category Cards (Folders) Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {CATEGORIES.map(cat => {
              const count = vehicles.filter(v => v.type && v.type.toLowerCase() === cat.type.toLowerCase()).length;
              return (
                <div 
                  key={cat.type}
                  className="glass-panel"
                  onClick={() => setActiveCategory(cat.type)}
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
                      width: '100px',
                      height: '65px',
                      objectFit: 'contain',
                      marginBottom: '8px',
                      borderRadius: '4px'
                    }}
                  />
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>{cat.type} Folder</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    {count} {count === 1 ? 'vehicle' : 'vehicles'} stored
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddWithCategory(cat);
                    }}
                    style={{ 
                      marginTop: '15px', 
                      width: '100%', 
                      padding: '8px 0', 
                      fontSize: '13px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    + Add {cat.type}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Detail View Header */}
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
                onClick={() => setActiveCategory(null)}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '13px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  borderRadius: '8px'
                }}
              >
                ← Back to Registry
              </button>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: CATEGORIES.find(c => c.type.toLowerCase() === activeCategory.toLowerCase())?.color || 'var(--color-primary)'
                  }}></span>
                  {activeCategory} Folder
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Showing all {vehicles.filter(v => v.type && v.type.toLowerCase() === activeCategory.toLowerCase()).length} registered {activeCategory.toLowerCase()}(s)
                </span>
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => handleAddWithCategory(CATEGORIES.find(c => c.type.toLowerCase() === activeCategory.toLowerCase()) || { type: activeCategory, defaultCapacity: 4, defaultRate: 12 })}
            >
              + Add {activeCategory}
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th>Vehicle Details</th>
                  <th>Vehicle Number</th>
                  <th>Category & Type</th>
                  <th>Specs & Fuel</th>
                  <th>Status & Availability</th>
                  <th>Reg & Ins Details</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.filter(v => v.type && v.type.toLowerCase() === activeCategory.toLowerCase()).length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                      No vehicles stored in the <strong>{activeCategory}</strong> folder.
                    </td>
                  </tr>
                ) : (
                  vehicles.filter(v => v.type && v.type.toLowerCase() === activeCategory.toLowerCase()).map(v => (
                    <tr key={`${v.id}-${v.type}`}>
                      <td><strong>{v.id}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {v.image ? (
                            <img 
                              src={v.image} 
                              alt={v.name} 
                              style={{ 
                                width: '45px', 
                                height: '30px', 
                                objectFit: 'contain', 
                                borderRadius: '4px', 
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)' 
                              }} 
                            />
                          ) : (
                            <span style={{ fontSize: '18px' }}>🚗</span>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                            <span style={{ fontWeight: '700' }}>{v.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Brand: {v.brand || 'N/A'} | Model: {v.model || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{v.vehicleNumber || v.plateNumber}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span>{v.type}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Type: {v.vehicleType || v.acpreference || 'AC'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span>{v.capacity} Passengers</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fuel: {v.fuelType || 'Petrol'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span className={`badge badge-${
                            v.status === 'Available' ? 'inprogress' : 
                            v.status === 'Assigned' ? 'confirmed' : 
                            v.status === 'On Trip' ? 'inprogress' :
                            v.status === 'Under Maintenance' ? 'pending' : 'cancelled'
                          }`}>
                            {v.status || 'Available'}
                          </span>
                          <span style={{ fontSize: '11px', color: v.availability !== false ? '#10b981' : '#f87171' }}>
                            {v.availability !== false ? '● Active' : '○ Blocked'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', maxWidth: '160px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.registrationDetails || 'No Registration Details'}>
                            Reg: {v.registrationDetails || 'N/A'}
                          </div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.insuranceDetails || 'No Insurance Details'}>
                            Ins: {v.insuranceDetails || 'N/A'}
                          </div>
                        </div>
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
        </>
      )}

      {/* Modal: Add/Edit Vehicle */}
      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSaveVehicle}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-select" 
                  value={type} 
                  onChange={(e) => {
                    const newType = e.target.value;
                    setType(newType);
                    const catInfo = CATEGORIES.find(c => c.type === newType);
                    if (catInfo) {
                      setCapacity(catInfo.defaultCapacity);
                      setRate(catInfo.defaultRate);
                    }
                  }}
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Minivan">Minivan</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input type="text" className="form-input" placeholder="e.g. Maruti Suzuki" value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input type="text" className="form-input" placeholder="e.g. Swift" value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Name</label>
                <input type="text" className="form-input" placeholder="e.g. Swift Dzire" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Number (Plate Number)</label>
                <input type="text" className="form-input" placeholder="e.g. TN-33-CC-1234" value={plate} onChange={(e) => { setPlate(e.target.value); setVehicleNumber(e.target.value); }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <input type="text" className="form-input" placeholder="e.g. AC, Non-AC, Sleeper" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Fuel Type</label>
                  <select className="form-select" value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="EV">EV</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Seating Capacity</label>
                  <input type="number" className="form-input" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Rate per KM (INR)</label>
                  <input type="number" className="form-input" value={rate} onChange={(e) => setRate(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Registration Details</label>
                <input type="text" className="form-input" placeholder="e.g. Reg valid till Dec 2030" value={registrationDetails} onChange={(e) => setRegistrationDetails(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Insurance Details</label>
                <input type="text" className="form-input" placeholder="e.g. Policy #INS-8832, Exp 06/29" value={insuranceDetails} onChange={(e) => setInsuranceDetails(e.target.value)} />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0' }}>
                <input 
                  type="checkbox" 
                  id="chk-availability" 
                  checked={availability} 
                  onChange={(e) => setAvailability(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                />
                <label htmlFor="chk-availability" className="form-label" style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>Vehicle is Available for Dispatch</label>
              </div>

              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label className="form-label">Vehicle Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Car Image URL</label>
                <input type="text" className="form-input" placeholder="e.g. /cars/swift_dzire.png" value={image || ''} onChange={(e) => setImage(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Or Upload Car Image File</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="form-input" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImage(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
                {image && (
                  <div style={{ margin: '15px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <img src={image} alt="Car Preview" style={{ maxWidth: '160px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', padding: '5px' }} />
                    <button type="button" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => setImage('')}>Remove Image</button>
                  </div>
                )}
              </div>



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
            
            {viewingVehicle.image && (
              <div style={{ textAlign: 'center', marginBottom: '20px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <img src={viewingVehicle.image} alt={viewingVehicle.name} style={{ maxWidth: '240px', height: '140px', objectFit: 'contain' }} />
              </div>
            )}

            <div className="details-list">
              <div className="details-row">
                <span className="details-label">Vehicle ID</span>
                <span className="details-value">{viewingVehicle.id}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Vehicle Name</span>
                <span className="details-value">{viewingVehicle.name}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Brand</span>
                <span className="details-value">{viewingVehicle.brand || viewingVehicle.name?.split(' ')[0] || 'N/A'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Model</span>
                <span className="details-value">{viewingVehicle.model || viewingVehicle.name?.split(' ').slice(1).join(' ') || 'N/A'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Vehicle Number</span>
                <span className="details-value">{viewingVehicle.vehicleNumber || viewingVehicle.plateNumber}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Vehicle Category</span>
                <span className="details-value">{viewingVehicle.type}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Vehicle Type</span>
                <span className="details-value">{viewingVehicle.vehicleType || viewingVehicle.acpreference || 'AC'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Seating Capacity</span>
                <span className="details-value">{viewingVehicle.capacity} Passengers</span>
              </div>
              <div className="details-row">
                <span className="details-label">Fuel Type</span>
                <span className="details-value">{viewingVehicle.fuelType || 'Petrol'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Rate Per KM</span>
                <span className="details-value">₹{viewingVehicle.ratePerKm}/km</span>
              </div>
              <div className="details-row">
                <span className="details-label">Registration Details</span>
                <span className="details-value">{viewingVehicle.registrationDetails || 'N/A'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Insurance Details</span>
                <span className="details-value">{viewingVehicle.insuranceDetails || 'N/A'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Availability</span>
                <span className="details-value">{viewingVehicle.availability !== false ? 'Yes' : 'No'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Status</span>
                <span className="details-value">
                  <span className={`badge badge-${
                    viewingVehicle.status === 'Available' ? 'inprogress' : 
                    viewingVehicle.status === 'Assigned' ? 'confirmed' : 
                    viewingVehicle.status === 'On Trip' ? 'inprogress' :
                    viewingVehicle.status === 'Under Maintenance' ? 'pending' : 'cancelled'
                  }`}>
                    {viewingVehicle.status || 'Available'}
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
