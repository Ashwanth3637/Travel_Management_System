import React, { useState } from 'react';
import { createPortal } from 'react-dom';

function AdminVehicles({ token, vehicles, refresh, toast }) {
  const API_URL = 'http://localhost:5001/api';

  const CATEGORIES = [
    { type: 'Sedan', img: '/cars/sedan/vitara_brezza.png', defaultCapacity: 4, defaultRate: 12, color: '#2563eb' },
    { type: 'SUV', img: '/cars/suv/mahindra_thar.png', defaultCapacity: 6, defaultRate: 18, color: '#f97316' },
    { type: 'Luxury', img: '/cars/luxury/bmw.png', defaultCapacity: 4, defaultRate: 28, color: '#8b5cf6' },
    { type: 'Minivan', img: '/cars/minivan/tempo_traveller.png', defaultCapacity: 12, defaultRate: 25, color: '#10b981' }
  ];

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubModel, setActiveSubModel] = useState(null);

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

  const matchVehicleToSubmodel = (vName = '', fName = '') => {
    const vn = vName.toLowerCase();
    const fn = fName.toLowerCase();
    if (vn.includes(fn) || fn.includes(vn)) return true;

    if (fn.includes('dzire') && (vn.includes('dzire') || vn.includes('swift'))) return true;
    if (fn.includes('brezza') && vn.includes('brezza')) return true;
    if (fn.includes('wagon') && vn.includes('wagon')) return true;
    if (fn.includes('baleno') && vn.includes('baleno')) return true;
    if (fn.includes('aura') && vn.includes('aura')) return true;

    if (fn.includes('innova') && (vn.includes('innova') || vn.includes('crysta'))) return true;
    if (fn.includes('thar') && vn.includes('thar')) return true;
    if (fn.includes('scorpio') && vn.includes('scorpio')) return true;
    if (fn.includes('fortuner') && vn.includes('fortuner')) return true;
    if (fn.includes('bolero') && vn.includes('bolero')) return true;

    if (fn.includes('bmw') && vn.includes('bmw')) return true;
    if (fn.includes('audi') && vn.includes('audi')) return true;
    if (fn.includes('benz') && (vn.includes('benz') || vn.includes('mercedes'))) return true;

    if (fn.includes('traveller') && (vn.includes('traveller') || vn.includes('tempo'))) return true;
    if (fn.includes('urbania') && vn.includes('urbania')) return true;

    return false;
  };

  const getCarImageForModel = (subName) => {
    if (!subName) return '';
    const s = subName.toLowerCase();
    if (s.includes('dzire')) return '/cars/sedan/swift_dzire.png';
    if (s.includes('brezza')) return '/cars/sedan/vitara_brezza.png';
    if (s.includes('wagon')) return '/cars/sedan/wagonr.png';
    if (s.includes('baleno')) return '/cars/sedan/suzuki_baleno.png';
    if (s.includes('aura')) return '/cars/sedan/hyundai_aura.png';
    if (s.includes('thar')) return '/cars/suv/mahindra_thar.png';
    if (s.includes('innova') || s.includes('crysta')) return '/cars/suv/innova_crysta.png';
    if (s.includes('scorpio')) return '/cars/suv/mahindra_scorpio.png';
    if (s.includes('fortuner')) return '/cars/suv/toyota_fortuner.png';
    if (s.includes('bolero')) return '/cars/suv/bolero.png';
    if (s.includes('bmw')) return '/cars/luxury/bmw.png';
    if (s.includes('audi')) return '/cars/luxury/audi.png';
    if (s.includes('benz') || s.includes('mercedes')) return '/cars/luxury/benz.png';
    if (s.includes('traveller')) return '/cars/minivan/tempo_traveller.png';
    if (s.includes('urbania')) return '/cars/minivan/force_urbania.png';
    return '';
  };

  const handleAddWithCategory = (cat, subModel = null) => {
    handleCloseModal();
    const targetType = cat ? cat.type : (activeCategory || 'Sedan');
    setType(targetType);
    setCapacity(cat?.defaultCapacity || 4);
    setRate(cat?.defaultRate || 12);

    const chosenModel = subModel || activeSubModel;
    if (chosenModel) {
      setName(chosenModel);
      setModel(chosenModel);
      const defaultImg = getCarImageForModel(chosenModel);
      setImage(defaultImg);
    } else {
      setName('');
      setModel('');
      setImage('');
    }

    setActiveCategory(targetType);
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
          <div className="flex justify-between items-center mb-5">
            <h3 className="m-0 text-xl font-bold">Vehicle Management Registry</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            {CATEGORIES.map(cat => {
              const count = vehicles.filter(v => v.type && v.type.toLowerCase() === cat.type.toLowerCase()).length;
              return (
                <div 
                  key={cat.type}
                  className="glass-panel p-7 rounded-xl text-center cursor-pointer transition-all duration-300 flex flex-col items-center gap-2.5 hover:-translate-y-1 hover:shadow-xl hover:bg-white/5 border-l-4"
                  style={{ borderLeftColor: cat.color }}
                  onClick={() => setActiveCategory(cat.type)}
                >
                  <img
                    src={cat.img}
                    alt={cat.type}
                    className="w-[100px] h-[65px] object-contain mb-2 rounded"
                  />
                  <div className="text-lg font-extrabold">{cat.type} Folder</div>
                  <div className="text-sm text-slate-500">
                    {count} {count === 1 ? 'vehicle' : 'vehicles'} stored
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddWithCategory(cat);
                    }}
                    className="mt-3.5 w-full py-2.5 text-xs font-bold bg-blue-600 text-white border-none rounded-lg cursor-pointer shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition"
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
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3.5">
              <button 
                className="btn btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-lg"
                onClick={() => {
                  if (activeSubModel) {
                    setActiveSubModel(null);
                  } else {
                    setActiveCategory(null);
                  }
                }}
              >
                ← {activeSubModel ? `Back to ${activeCategory} Folders` : 'Back to Registry'}
              </button>
              <div>
                <h3 className="m-0 flex items-center gap-2 text-xl font-bold">
                  <span className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: CATEGORIES.find(c => c.type.toLowerCase() === activeCategory.toLowerCase())?.color || '#2563eb' }}></span>
                  {activeSubModel ? `${activeSubModel} Folder` : `${activeCategory} Category Folder`}
                </h3>
                <span className="text-xs text-slate-500">
                  {activeSubModel 
                    ? `Showing registered ${activeSubModel} vehicles` 
                    : `Select a car folder (WagonR, Brezza, Aura, Dzire, etc.)`
                  }
                </span>
              </div>
            </div>
            <button 
              className="px-4.5 py-2.5 font-bold text-sm bg-blue-600 text-white border-none rounded-lg cursor-pointer shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition"
              onClick={() => handleAddWithCategory(
                CATEGORIES.find(c => c.type.toLowerCase() === activeCategory.toLowerCase()) || { type: activeCategory, defaultCapacity: 4, defaultRate: 12 },
                activeSubModel
              )}
            >
              + Add {activeSubModel ? activeSubModel : activeCategory}
            </button>
          </div>

          {!activeSubModel ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
              {(() => {
                const DEFAULT_SUBMODELS = {
                  Sedan: ['Swift Dzire', 'Vitara Brezza', 'WagonR', 'Baleno', 'Aura'],
                  SUV: ['Innova Crysta', 'Mahindra Thar', 'Mahindra Scorpio', 'Fortuner', 'Bolero'],
                  Luxury: ['BMW 5 Series', 'Audi A6', 'Mercedes E-Class'],
                  Minivan: ['Tempo Traveller', 'Urbania']
                };

                const categoryVehicles = vehicles.filter(v => v.type && v.type.toLowerCase() === activeCategory.toLowerCase());
                const allSubModels = DEFAULT_SUBMODELS[activeCategory] || ['General'];

                return allSubModels.map(subName => {
                  const subVehicles = categoryVehicles.filter(v => matchVehicleToSubmodel(v.name, subName));
                  const count = subVehicles.length;

                  const sampleVehicle = subVehicles.find(v => v.image) || categoryVehicles.find(v => v.image);
                  const subImage = sampleVehicle?.image || getCarImageForModel(subName) || '/cars/sedan/swift_dzire.png';

                  return (
                    <div 
                      key={subName}
                      className="glass-panel p-5 rounded-2xl text-center cursor-pointer transition-all duration-300 flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-xl hover:bg-white/10 border-l-4 border-l-blue-600 bg-white/70"
                      onClick={() => setActiveSubModel(subName)}
                    >
                      <div className="w-[120px] h-[75px] flex items-center justify-center bg-slate-50 rounded-xl p-1 border border-slate-200/80 shadow-inner mb-1">
                        <img 
                          src={subImage} 
                          alt={subName} 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { e.target.onerror = null; e.target.src = '/cars/sedan/swift_dzire.png'; }}
                        />
                      </div>
                      <div className="text-base font-extrabold text-slate-800">{subName}</div>
                      <div className="text-xs text-slate-500 font-semibold">{count} {count === 1 ? 'vehicle' : 'vehicles'} registered</div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle ID</th>
                    <th>Car Image</th>
                    <th>Name / Model</th>
                    <th>Plate Number</th>
                    <th>Capacity</th>
                    <th>Rate / km</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const subList = vehicles.filter(v => 
                      v.type && v.type.toLowerCase() === activeCategory.toLowerCase() &&
                      matchVehicleToSubmodel(v.name, activeSubModel)
                    );

                    if (subList.length === 0) {
                      return (
                        <tr>
                          <td colSpan="8" className="text-center text-slate-400 py-8">
                            No vehicles found in {activeSubModel} folder.
                          </td>
                        </tr>
                      );
                    }

                    return subList.map(v => {
                      const carImg = v.image || (
                        v.name.toLowerCase().includes('dzire') ? '/cars/sedan/swift_dzire.png' :
                        v.name.toLowerCase().includes('brezza') ? '/cars/sedan/vitara_brezza.png' :
                        v.name.toLowerCase().includes('wagon') ? '/cars/sedan/wagonr.png' :
                        v.name.toLowerCase().includes('baleno') ? '/cars/sedan/suzuki_baleno.png' :
                        v.name.toLowerCase().includes('aura') ? '/cars/sedan/hyundai_aura.png' :
                        v.name.toLowerCase().includes('thar') ? '/cars/suv/mahindra_thar.png' :
                        v.name.toLowerCase().includes('innova') ? '/cars/suv/innova_crysta.png' :
                        v.name.toLowerCase().includes('scorpio') ? '/cars/suv/mahindra_scorpio.png' :
                        v.name.toLowerCase().includes('fortuner') ? '/cars/suv/toyota_fortuner.png' :
                        v.name.toLowerCase().includes('bolero') ? '/cars/suv/bolero.png' :
                        v.name.toLowerCase().includes('bmw') ? '/cars/luxury/bmw.png' :
                        v.name.toLowerCase().includes('audi') ? '/cars/luxury/audi.png' :
                        v.name.toLowerCase().includes('benz') || v.name.toLowerCase().includes('mercedes') ? '/cars/luxury/benz.png' :
                        v.name.toLowerCase().includes('traveller') ? '/cars/minivan/tempo_traveller.png' :
                        v.name.toLowerCase().includes('urbania') ? '/cars/minivan/force_urbania.png' :
                        '/cars/sedan/swift_dzire.png'
                      );

                      return (
                        <tr key={v.id}>
                          <td><strong>{v.id}</strong></td>
                          <td>
                            <div className="w-14 h-10 flex items-center justify-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                              <img 
                                src={carImg} 
                                alt={v.name} 
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/cars/sedan/swift_dzire.png'; }}
                              />
                            </div>
                          </td>
                          <td className="font-bold">{v.name}</td>
                          <td>{v.plateNumber}</td>
                          <td>{v.capacity} Seats</td>
                          <td className="font-bold text-emerald-600">₹{v.ratePerKm}/km</td>
                          <td>
                            <span className={`badge badge-${v.status === 'Assigned' ? 'assigned' : v.status === 'On Trip' ? 'ontrip' : 'available'}`}>
                              {v.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-1.5 items-center">
                              <button 
                                onClick={() => setViewingVehicle(v)}
                                className="px-2.5 h-7 text-[11px] font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-white border-none cursor-pointer transition inline-flex items-center justify-center"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => handleEditClick(v)}
                                className="px-2.5 h-7 text-[11px] font-bold rounded-md bg-blue-600 hover:bg-blue-700 text-white border-none cursor-pointer transition inline-flex items-center justify-center"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDelete(v.id)} 
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
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal: Add/Edit Vehicle */}
      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingVehicle ? 'Update Vehicle' : `Add ${type} Vehicle`}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSaveVehicle}>
              <div className="form-group">
                <label className="form-label">Target Car Folder / Model</label>
                <select 
                  className="form-select" 
                  value={name} 
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setName(chosen);
                    setModel(chosen);
                    const autoImg = getCarImageForModel(chosen);
                    if (autoImg) setImage(autoImg);
                  }}
                >
                  <option value="">-- Select Target Folder --</option>
                  {(type === 'Sedan' ? ['Swift Dzire', 'Vitara Brezza', 'WagonR', 'Baleno', 'Aura'] :
                    type === 'SUV' ? ['Innova Crysta', 'Mahindra Thar', 'Mahindra Scorpio', 'Fortuner', 'Bolero'] :
                    type === 'Luxury' ? ['BMW 5 Series', 'Audi A6', 'Mercedes E-Class'] :
                    ['Tempo Traveller', 'Urbania']
                  ).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Or Custom Vehicle Name / Variant</label>
                <input type="text" className="form-input" placeholder="e.g. Maruti Suzuki Dzire VXI" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">License Plate Number</label>
                <input type="text" className="form-input" placeholder="e.g. TN-01-AB-1234" value={plate} onChange={(e) => setPlate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category Class</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Minivan">Minivan</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle AC Preference</label>
                <select className="form-select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                  <option value="AC">AC Vehicle</option>
                  <option value="Non-AC">Non-AC Vehicle</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Seating Capacity</label>
                <input type="number" className="form-input" min="1" max="50" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Rate per Kilometer (₹)</label>
                <input type="number" className="form-input" min="1" step="0.5" value={rate} onChange={(e) => setRate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fuel Type</label>
                <select className="form-select" value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric (EV)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Car Image URL</label>
                <input type="text" className="form-input" placeholder="e.g. /cars/sedan/vitara_brezza.png" value={image} onChange={(e) => setImage(e.target.value)} />
              </div>
              {editingVehicle && (
                <div className="form-group mb-6">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2.5 mt-5">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 font-bold text-sm bg-blue-600 text-white border-none rounded-lg cursor-pointer shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: View Vehicle Details */}
      {viewingVehicle && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content text-left">
            <div className="modal-header">
              <h3 className="modal-title">Vehicle Details</h3>
              <button className="modal-close" onClick={() => setViewingVehicle(null)}>×</button>
            </div>
            
            {/* Vehicle Image Header Preview */}
            <div className="text-center mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <img 
                src={viewingVehicle.image || (
                  viewingVehicle.name.toLowerCase().includes('dzire') ? '/cars/sedan/swift_dzire.png' :
                  viewingVehicle.name.toLowerCase().includes('brezza') ? '/cars/sedan/vitara_brezza.png' :
                  viewingVehicle.name.toLowerCase().includes('wagon') ? '/cars/sedan/wagonr.png' :
                  viewingVehicle.name.toLowerCase().includes('baleno') ? '/cars/sedan/suzuki_baleno.png' :
                  viewingVehicle.name.toLowerCase().includes('aura') ? '/cars/sedan/hyundai_aura.png' :
                  viewingVehicle.name.toLowerCase().includes('thar') ? '/cars/suv/mahindra_thar.png' :
                  viewingVehicle.name.toLowerCase().includes('innova') ? '/cars/suv/innova_crysta.png' :
                  viewingVehicle.name.toLowerCase().includes('scorpio') ? '/cars/suv/mahindra_scorpio.png' :
                  viewingVehicle.name.toLowerCase().includes('fortuner') ? '/cars/suv/toyota_fortuner.png' :
                  viewingVehicle.name.toLowerCase().includes('bolero') ? '/cars/suv/bolero.png' :
                  viewingVehicle.name.toLowerCase().includes('bmw') ? '/cars/luxury/bmw.png' :
                  viewingVehicle.name.toLowerCase().includes('audi') ? '/cars/luxury/audi.png' :
                  viewingVehicle.name.toLowerCase().includes('benz') || viewingVehicle.name.toLowerCase().includes('mercedes') ? '/cars/luxury/benz.png' :
                  viewingVehicle.name.toLowerCase().includes('traveller') ? '/cars/minivan/tempo_traveller.png' :
                  viewingVehicle.name.toLowerCase().includes('urbania') ? '/cars/minivan/force_urbania.png' :
                  '/cars/sedan/swift_dzire.png'
                )} 
                alt={viewingVehicle.name} 
                className="max-h-[140px] max-w-full object-contain mx-auto"
                onError={(e) => { e.target.onerror = null; e.target.src = '/cars/sedan/swift_dzire.png'; }}
              />
            </div>

            <div className="details-list">
              {[
                { label: 'Vehicle ID', value: viewingVehicle.id },
                { label: 'Name / Model', value: viewingVehicle.name },
                { label: 'Plate Number', value: viewingVehicle.plateNumber },
                { label: 'Category', value: viewingVehicle.type },
                { label: 'Vehicle AC Preference', value: viewingVehicle.vehicleType || viewingVehicle.acpreference || 'AC' },
                { label: 'Capacity', value: `${viewingVehicle.capacity} Seats` },
                { label: 'Rate Per KM', value: `₹${viewingVehicle.ratePerKm}/km` },
                { label: 'Fuel Type', value: viewingVehicle.fuelType || 'Petrol' },
                {
                  label: 'Status',
                  value: (
                    <span className={`badge badge-${viewingVehicle.status === 'Assigned' ? 'assigned' : viewingVehicle.status === 'On Trip' ? 'ontrip' : 'available'}`}>
                      {viewingVehicle.status}
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
              <button className="btn btn-secondary px-3 py-1.5 text-xs" onClick={() => setViewingVehicle(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminVehicles;
