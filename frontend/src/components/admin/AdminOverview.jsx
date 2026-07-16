import React, { useState, useEffect } from 'react';

function AdminOverview({ token, toast }) {
  const API_URL = 'http://localhost:5001/api';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      if (toast) toast(null, err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px', textAlign: 'left' }}>
      
      {/* Header Greeting */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
          Dashboard Overview
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
          Real-time metrics, fleet tracking, and system performance metrics.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading stats overview...</div>
      ) : stats ? (
        <>
          {/* Metrics grid */}
          <div className="dashboard-grid">
            <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>
                  Total Bookings
                </div>
                <div className="stat-val">{stats.totalBookings}</div>
              </div>
              <div style={{ fontSize: '24px' }}>📅</div>
            </div>

            <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--status-inprogress)' }}>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>
                  Active Trips
                </div>
                <div className="stat-val">{stats.activeTrips}</div>
              </div>
              <div style={{ fontSize: '24px' }}>🚗</div>
            </div>

            <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--status-pending)' }}>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>
                  Pending Assignments
                </div>
                <div className="stat-val">{stats.pendingBookings}</div>
              </div>
              <div style={{ fontSize: '24px' }}>⏳</div>
            </div>

            <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>
                  Total Fleet Cars
                </div>
                <div className="stat-val">{stats.totalVehicles}</div>
              </div>
              <div style={{ fontSize: '24px' }}>🚙</div>
            </div>
          </div>

          {/* Quick Shortcuts & Regulations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0' }}>
                System Activity Log
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Fleet status is 100% operational. Drivers are actively responding to bookings. Refresh to view the latest telemetry.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--color-secondary)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 10px 0' }}>
                Available Drivers
              </h3>
              <div className="stat-val" style={{ fontSize: '26px' }}>{stats.totalDrivers}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Active registered personnel on duty.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '40px', color: 'var(--text-muted)' }}>No statistics available.</div>
      )}
    </div>
  );
}

export default AdminOverview;
