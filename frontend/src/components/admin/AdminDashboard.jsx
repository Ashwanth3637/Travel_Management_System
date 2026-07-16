import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import AdminBookings from './AdminBookings';
import AdminVehicles from './AdminVehicles';
import AdminDrivers from './AdminDrivers';
import AdminReports from './AdminReports';
import AdminCustomers from './AdminCustomers';
import AdminOverview from './AdminOverview';
import AdminProfile from './AdminProfile';

function AdminDashboard({ token, handleLogout }) {
  const API_URL = 'http://localhost:5001/api';

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

      {/* Main Grid Wrapper (Left Sidebar, Right Content) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: '20px',
        alignItems: 'start',
        marginTop: '10px'
      }}>
        
        {/* Left Side Sidebar Menu */}
        <div className="glass-panel" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '24px 16px',
          position: 'sticky',
          top: '20px',
          borderLeft: '4px solid var(--color-primary)',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Brand Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 12px 16px 12px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z"></path>
                <path d="M18 18h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4"></path>
                <circle cx="7" cy="17" r="2"></circle>
                <circle cx="17" cy="17" r="2"></circle>
              </svg>
            </div>
            <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
              <div style={{
                fontSize: '15px',
                fontWeight: '800',
                color: 'var(--text-main)',
                letterSpacing: '0.5px'
              }}>
                Travels Cab
              </div>
              <div style={{
                fontSize: '10px',
                fontWeight: '700',
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginTop: '2px'
              }}>
                Control Hub
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '11px',
            fontWeight: '800',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            padding: '4px 12px 10px 12px',
            textAlign: 'left'
          }}>
            Admin Menu
          </div>

          <NavLink 
            to="/admin/overview" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? 'var(--text-dark)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.01)',
              borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
              boxShadow: isActive ? '0 0 15px var(--color-primary-glow)' : 'none'
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>🏠</span>
            <span>Dashboard Details</span>
          </NavLink>

          <NavLink 
            to="/admin/profile" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? 'var(--text-dark)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.01)',
              borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
              boxShadow: isActive ? '0 0 15px var(--color-primary-glow)' : 'none'
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>👤</span>
            <span>My Profile</span>
          </NavLink>

          <NavLink 
            to="/admin/bookings" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? 'var(--text-dark)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.01)',
              borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
              boxShadow: isActive ? '0 0 15px var(--color-primary-glow)' : 'none'
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>📅</span>
            <span>Bookings & Dispatch</span>
          </NavLink>

          <NavLink 
            to="/admin/history" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? 'var(--text-dark)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.01)',
              borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
              boxShadow: isActive ? '0 0 15px var(--color-primary-glow)' : 'none'
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>📜</span>
            <span>Booking History</span>
          </NavLink>

          <NavLink 
            to="/admin/customers" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? 'var(--text-dark)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.01)',
              borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
              boxShadow: isActive ? '0 0 15px var(--color-primary-glow)' : 'none'
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>👥</span>
            <span>Customer Profiles</span>
          </NavLink>

          <NavLink 
            to="/admin/vehicles" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? 'var(--text-dark)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.01)',
              borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
              boxShadow: isActive ? '0 0 15px var(--color-primary-glow)' : 'none'
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>🚗</span>
            <span>Manage Fleet</span>
          </NavLink>

          <NavLink 
            to="/admin/drivers" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? 'var(--text-dark)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.01)',
              borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
              boxShadow: isActive ? '0 0 15px var(--color-primary-glow)' : 'none'
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>👨‍✈️</span>
            <span>Manage Drivers</span>
          </NavLink>

          <NavLink 
            to="/admin/reports" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? 'var(--text-dark)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.01)',
              borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
              boxShadow: isActive ? '0 0 15px var(--color-primary-glow)' : 'none'
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>📊</span>
            <span>Reports & Analytics</span>
          </NavLink>
          </div>

          {/* Logout Section at the bottom */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <button 
              className="btn btn-danger" 
              onClick={handleLogout} 
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                fontSize: '14px', 
                fontWeight: '600', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Right Side Main Content Area */}
        <div className="animate-fade-in" style={{ minWidth: 0 }}>
          <Routes>
             <Route path="bookings" element={
              <AdminBookings 
                token={token} 
                bookings={bookings} 
                vehicles={vehicles} 
                drivers={drivers} 
                refresh={fetchData} 
                toast={triggerToast} 
                onlyActive={true}
              />
            } />
            <Route path="history" element={
              <AdminBookings 
                token={token} 
                bookings={bookings} 
                vehicles={vehicles} 
                drivers={drivers} 
                refresh={fetchData} 
                toast={triggerToast} 
                onlyHistory={true}
              />
            } />
            <Route path="vehicles" element={
              <AdminVehicles 
                token={token} 
                vehicles={vehicles} 
                refresh={fetchData} 
                toast={triggerToast} 
              />
            } />
            <Route path="drivers" element={
              <AdminDrivers 
                token={token} 
                drivers={drivers} 
                refresh={fetchData} 
                toast={triggerToast} 
              />
            } />
            <Route path="customers" element={
              <AdminCustomers 
                token={token} 
                toast={triggerToast} 
              />
            } />
            <Route path="reports" element={
              <AdminReports 
                stats={stats} 
                refresh={fetchData}
              />
            } />
            <Route path="overview" element={
              <AdminOverview 
                token={token} 
                toast={triggerToast} 
              />
            } />
            <Route path="profile" element={
              <AdminProfile 
                token={token} 
                toast={triggerToast} 
              />
            } />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;
