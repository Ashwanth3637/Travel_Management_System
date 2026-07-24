import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import AdminBookings from './AdminBookings';
import AdminVehicles from './AdminVehicles';
import AdminDrivers from './AdminDrivers';
import AdminReports from './AdminReports';
import AdminCustomers from './AdminCustomers';
import AdminOverview from './AdminOverview';
import AdminProfile from './AdminProfile';
import AdminFeedbacks from './AdminFeedbacks';
import AdminQueries from './AdminQueries';

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
      const [bRes, vRes, dRes, sRes] = await Promise.all([
        fetch(`${API_URL}/bookings`, { headers, cache: 'no-store' }),
        fetch(`${API_URL}/vehicles`, { headers, cache: 'no-store' }),
        fetch(`${API_URL}/drivers`, { headers, cache: 'no-store' }),
        fetch(`${API_URL}/dashboard/stats`, { headers, cache: 'no-store' })
      ]);

      const [bData, vData, dData, sData] = await Promise.all([
        bRes.json(),
        vRes.json(),
        dRes.json(),
        sRes.json()
      ]);

      if (bRes.ok) setBookings(bData);
      if (vRes.ok) setVehicles(vData);
      if (dRes.ok) setDrivers(dData);
      if (sRes.ok) setStats(sData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 3 seconds for instant real-time sync across Admin and Driver portals
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Toast notifications — rendered via portal to escape any stacking context */}
      {successMsg && createPortal(
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          minWidth: '280px',
          maxWidth: '400px',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #064e3b, #065f46)',
          color: '#6ee7b7',
          borderRadius: '14px',
          border: '1px solid rgba(16,185,129,0.4)',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.15)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          animation: 'slideInRight 0.3s ease',
          lineHeight: '1.4',
        }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>✅</span>
          <span style={{ flex: 1 }}>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg('')}
            style={{
              background: 'none', border: 'none', color: '#6ee7b7',
              cursor: 'pointer', fontSize: '16px', padding: '0', flexShrink: 0, opacity: 0.7,
            }}
          >✕</button>
        </div>,
        document.body
      )}
      {errorMsg && createPortal(
        <div style={{
          position: 'fixed',
          top: successMsg ? '100px' : '24px',
          right: '24px',
          zIndex: 99999,
          minWidth: '280px',
          maxWidth: '400px',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #450a0a, #7f1d1d)',
          color: '#fca5a5',
          borderRadius: '14px',
          border: '1px solid rgba(239,68,68,0.4)',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.15)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          animation: 'slideInRight 0.3s ease',
          lineHeight: '1.4',
        }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>❌</span>
          <span style={{ flex: 1 }}>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg('')}
            style={{
              background: 'none', border: 'none', color: '#fca5a5',
              cursor: 'pointer', fontSize: '16px', padding: '0', flexShrink: 0, opacity: 0.7,
            }}
          >✕</button>
        </div>,
        document.body
      )}

      {/* Main Grid Wrapper (Left Sidebar, Right Content) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px minmax(0, 1fr)',
        gap: '24px',
        alignItems: 'start',
        marginTop: '10px'
      }}>
        
        {/* Left Side Sidebar Menu */}
        <div className="glass-panel" style={{
          width: '240px',
          minWidth: '240px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '20px 12px',
          position: 'sticky',
          top: '90px',
          minHeight: 'calc(100vh - 120px)',
          borderLeft: '4px solid #f59e0b',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* ── Brand / Header ── */}
          <div style={{ padding: '16px 8px 20px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px'
            }}>
              Administration
            </div>
          </div>    </div>

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
              padding: '12px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14.5px',
              fontWeight: '800',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? '#ffffff' : '#0f172a',
              backgroundColor: isActive ? '#3b82f6' : 'transparent',
              boxShadow: isActive ? '0 4px 15px rgba(59, 130, 246, 0.35)' : 'none'
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(59, 130, 246, 0.12)',
                  fontSize: '17px',
                  flexShrink: 0
                }}>🏠</span>
                <span>Dashboard</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/admin/bookings" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14.5px',
              fontWeight: '800',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? '#ffffff' : '#0f172a',
              backgroundColor: isActive ? '#3b82f6' : 'transparent',
              boxShadow: isActive ? '0 4px 15px rgba(59, 130, 246, 0.35)' : 'none'
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(99, 102, 241, 0.12)',
                  fontSize: '17px',
                  flexShrink: 0
                }}>📅</span>
                <span>Bookings</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/admin/history" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14.5px',
              fontWeight: '800',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? '#ffffff' : '#0f172a',
              backgroundColor: isActive ? '#3b82f6' : 'transparent',
              boxShadow: isActive ? '0 4px 15px rgba(59, 130, 246, 0.35)' : 'none'
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(245, 158, 11, 0.14)',
                  fontSize: '17px',
                  flexShrink: 0
                }}>📜</span>
                <span>Trip History</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/admin/customers" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14.5px',
              fontWeight: '800',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? '#ffffff' : '#0f172a',
              backgroundColor: isActive ? '#3b82f6' : 'transparent',
              boxShadow: isActive ? '0 4px 15px rgba(59, 130, 246, 0.35)' : 'none'
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(236, 72, 153, 0.12)',
                  fontSize: '17px',
                  flexShrink: 0
                }}>👥</span>
                <span>Customers</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/admin/vehicles" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14.5px',
              fontWeight: '800',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? '#ffffff' : '#0f172a',
              backgroundColor: isActive ? '#3b82f6' : 'transparent',
              boxShadow: isActive ? '0 4px 15px rgba(59, 130, 246, 0.35)' : 'none'
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(249, 115, 22, 0.14)',
                  fontSize: '17px',
                  flexShrink: 0
                }}>🚗</span>
                <span>Vehicles</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/admin/drivers" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14.5px',
              fontWeight: '800',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? '#ffffff' : '#0f172a',
              backgroundColor: isActive ? '#3b82f6' : 'transparent',
              boxShadow: isActive ? '0 4px 15px rgba(59, 130, 246, 0.35)' : 'none'
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(16, 185, 129, 0.14)',
                  fontSize: '17px',
                  flexShrink: 0
                }}>👨‍✈️</span>
                <span>Drivers</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/admin/reports" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14.5px',
              fontWeight: '800',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? '#ffffff' : '#0f172a',
              backgroundColor: isActive ? '#3b82f6' : 'transparent',
              boxShadow: isActive ? '0 4px 15px rgba(59, 130, 246, 0.35)' : 'none'
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(139, 92, 246, 0.14)',
                  fontSize: '17px',
                  flexShrink: 0
                }}>📊</span>
                <span>Reports</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/admin/queries" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14.5px',
              fontWeight: '800',
              transition: 'all 0.25s ease-in-out',
              color: isActive ? '#ffffff' : '#0f172a',
              backgroundColor: isActive ? '#3b82f6' : 'transparent',
              boxShadow: isActive ? '0 4px 15px rgba(59, 130, 246, 0.35)' : 'none'
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(6, 182, 212, 0.14)',
                  fontSize: '17px',
                  flexShrink: 0
                }}>💬</span>
                <span>Feedback</span>
              </>
            )}
          </NavLink>

          {/* Logout Section at the bottom */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button 
              onClick={handleLogout} 
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                fontSize: '14.5px', 
                fontWeight: '800', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ef4444';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '16px' }}>🔑</span>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Right Side Main Content Area */}
        <div className="animate-fade-in" style={{ minWidth: 0, width: '100%', overflow: 'hidden' }}>
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
                token={token}
                stats={stats} 
                bookings={bookings}
                vehicles={vehicles}
                drivers={drivers}
                refresh={fetchData}
                toast={triggerToast}
              />
            } />
            <Route path="feedbacks" element={
              <AdminFeedbacks 
                token={token} 
                toast={triggerToast} 
              />
            } />
            <Route path="queries" element={
              <AdminQueries 
                token={token} 
                toast={triggerToast} 
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
