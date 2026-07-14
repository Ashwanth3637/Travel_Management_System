import React, { useState, useEffect } from 'react';
import AdminBookings from './AdminBookings';
import AdminVehicles from './AdminVehicles';
import AdminDrivers from './AdminDrivers';
import AdminReports from './AdminReports';

function AdminDashboard({ token }) {
  const API_URL = 'http://localhost:5001/api';

  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const triggerToast = (success, error) => {
    if (success) {
      setSuccessMsg(success);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
    if (error) {
      setErrorMsg(error);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const bRes = await fetch(`${API_URL}/bookings`, { headers });
      const bData = await bRes.json();
      if (bRes.ok) setBookings(bData);

      const vRes = await fetch(`${API_URL}/vehicles`, { headers });
      const vData = await vRes.json();
      if (vRes.ok) setVehicles(vData);

      const dRes = await fetch(`${API_URL}/drivers`, { headers });
      const dData = await dRes.json();
      if (dRes.ok) setDrivers(dData);

      const sRes = await fetch(`${API_URL}/dashboard/stats`, { headers });
      const sData = await sRes.json();
      if (sRes.ok) setStats(sData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Toast notifications */}
      {successMsg && (
        <div style={{
          position: 'fixed', top: '90px', right: '40px', zIndex: 1000,
          padding: '16px 24px', backgroundColor: 'var(--status-completed-bg)',
          color: 'var(--status-completed)', borderRadius: '12px',
          border: '1px solid var(--status-completed)', fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{
          position: 'fixed', top: '90px', right: '40px', zIndex: 1000,
          padding: '16px 24px', backgroundColor: 'var(--status-cancelled-bg)',
          color: 'var(--status-cancelled)', borderRadius: '12px',
          border: '1px solid var(--status-cancelled)', fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Tab Switch Navigation */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} 
          onClick={() => setActiveTab('bookings')}
        >
          Bookings & Dispatch
        </button>
        <button 
          className={`tab-btn ${activeTab === 'vehicles' ? 'active' : ''}`} 
          onClick={() => setActiveTab('vehicles')}
        >
          Manage Fleet (Vehicles)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`} 
          onClick={() => setActiveTab('drivers')}
        >
          Manage Drivers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reports')}
        >
          Reports & Analytics
        </button>
      </div>

      {/* Render Subtab Component */}
      <div className="animate-fade-in">
        {activeTab === 'bookings' && (
          <AdminBookings 
            token={token} 
            bookings={bookings} 
            vehicles={vehicles} 
            drivers={drivers} 
            refresh={fetchData} 
            toast={triggerToast} 
          />
        )}
        {activeTab === 'vehicles' && (
          <AdminVehicles 
            token={token} 
            vehicles={vehicles} 
            refresh={fetchData} 
            toast={triggerToast} 
          />
        )}
        {activeTab === 'drivers' && (
          <AdminDrivers 
            token={token} 
            drivers={drivers} 
            refresh={fetchData} 
            toast={triggerToast} 
          />
        )}
        {activeTab === 'reports' && (
          <AdminReports 
            stats={stats} 
          />
        )}
      </div>

    </div>
  );
}

export default AdminDashboard;
