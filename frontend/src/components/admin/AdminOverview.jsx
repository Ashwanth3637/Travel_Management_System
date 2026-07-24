import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, AreaChart, DoughnutChart, HorizontalBarChart } from './ChartComponents';

function StatCard({ title, value, icon, color, subtitle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#ffffff' : 'rgba(255, 255, 255, 0.95)',
        border: `1.5px solid ${hovered ? color : 'rgba(15, 23, 42, 0.12)'}`,
        borderRadius: '16px',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered 
          ? `0 10px 25px ${color}33` 
          : '0 4px 16px rgba(15, 23, 42, 0.05)',
        cursor: 'default',
      }}
    >
      {/* Icon bubble */}
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: '14px',
        backgroundColor: `${color}18`,
        border: `1px solid ${color}33`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.9px',
          color: 'var(--text-muted)',
          marginBottom: '4px',
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '30px',
          fontWeight: '800',
          color: color,
          lineHeight: '1.1',
        }}>
          {value}
        </div>
        {subtitle && (
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '4px',
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '16px',
    }}>
      <div style={{
        width: '4px',
        height: '18px',
        borderRadius: '4px',
        background: 'var(--color-primary)',
      }} />
      <span style={{
        fontSize: '12px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '1.2px',
        color: 'var(--text-muted)',
      }}>
        {label}
      </span>
    </div>
  );
}

function AdminOverview({ token, toast }) {
  const API_URL = 'http://localhost:5001/api';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      if (toast) toast(null, err.message);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    const updateTime = () => {
      const opts = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      setCurrentTime(new Date().toLocaleDateString('en-US', opts));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 60000);
    return () => { clearInterval(interval); clearInterval(timeInterval); };
  }, [fetchStats]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', paddingBottom: '48px' }}>

      {/* ─── STANDALONE ADMIN HEADER CARD ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        backgroundColor: '#ffffff',
        padding: '20px 28px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
        border: '1px solid #e2e8f0',
        borderLeft: '5px solid #2563eb'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', color: '#1e293b', letterSpacing: '-0.3px' }}>
            Administration
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: '500' }}>
            Fleet analytics, trip dispatch logistics, and system health hub
          </p>
        </div>

        <div style={{
          fontSize: '12.5px',
          fontWeight: '700',
          color: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          ⏱️ <span>{currentTime}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '80px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '15px', fontWeight: '600' }}>
          <div className="icon-spin" style={{ display: 'inline-block', fontSize: '28px', marginBottom: '12px' }}>🔄</div>
          <div>Initializing metrics engine...</div>
        </div>
      ) : stats ? (
        <>
          {/* ─── 1. BOOKING & TRIP LIFECYCLE GRID (FIRST) ─── */}
          <div>
            <SectionLabel label="Booking & Trip Lifecycle" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <StatCard title="Total Bookings"     value={stats.counts.bookings}   icon="📊" color="#2563eb" subtitle="All time records" />
              <StatCard title="Pending Bookings"   value={stats.counts.pending}    icon="⏳" color="#d97706" subtitle="Awaiting allocation" />
              <StatCard title="Confirmed Bookings" value={stats.counts.confirmed}  icon="📅" color="#2563eb" subtitle="Driver assigned" />
              <StatCard title="Ongoing Trips"      value={stats.counts.ongoing}    icon="🚗" color="#f59e0b" subtitle="Passengers in transit" />
              <StatCard title="Completed Trips"    value={stats.counts.completed}  icon="✅" color="#10b981" subtitle="Successfully closed" />
              <StatCard title="Cancelled Bookings" value={stats.counts.cancelled}  icon="❌" color="#ef4444" subtitle="Aborted requests" />
            </div>
          </div>

          {/* ─── 2. FLEET STATISTICS + DRIVERS & CUSTOMERS ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '10px' }}>
            <div>
              <SectionLabel label="Fleet Statistics" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <StatCard title="Total Vehicles"     value={stats.counts.vehicles}            icon="🚙" color="#8b5cf6" subtitle="Registered cars" />
                <StatCard title="Available Vehicles" value={stats.counts.availableVehicles}   icon="🟢" color="#16a34a" subtitle={`${stats.utilization?.vehicleRate ?? 0}% utilization rate`} />
                <StatCard title="Vehicles on Trip"   value={stats.counts.vehiclesOnTrip ?? 0} icon="🟠" color="#f97316" subtitle="Active telemetry" />
              </div>
            </div>

            <div>
              <SectionLabel label="Drivers & Customers" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <StatCard title="Total Drivers"     value={stats.counts.drivers}          icon="👨‍✈️" color="#f97316" subtitle="Registered staff" />
                <StatCard title="Available Drivers" value={stats.counts.availableDrivers} icon="🛂"   color="#10b981" subtitle={`${stats.utilization?.driverRate ?? 0}% active rate`} />
                <StatCard title="Total Customers"   value={stats.counts.customers ?? 0}   icon="👥"   color="#06b6d4" subtitle="Registered user profiles" />
              </div>
            </div>
          </div>

          {/* ─── 3. ANALYTICS & CHARTS ROW ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px', marginTop: '10px' }}>
            
            {/* COLUMN 1: MONTHLY TREND CHART */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Volume Overview</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Monthly Bookings Volume</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', backgroundColor: '#dcfce7', padding: '3px 8px', borderRadius: '12px' }}>
                    📈 +18% Growth
                  </span>
                </div>
                <BarChart data={stats.analytics?.monthlyData} dataKey="bookings" labelKey="label" color="#2563eb" />
              </div>
            </div>

            {/* COLUMN 2: READINESS CIRCULAR GAUGE & ALLOCATION */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '22px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '12px' }}>
                  Fleet Readiness Index
                </div>
                
                <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" stroke="#e2e8f0" strokeWidth="10" fill="none" />
                    <circle cx="60" cy="60" r="50" stroke="#2563eb" strokeWidth="10" fill="none" strokeDasharray="314" strokeDashoffset="35" strokeLinecap="round" transform="rotate(-90 60 60)" />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{stats.utilization?.vehicleRate ?? 88}%</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>READY</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '700', marginTop: '10px' }}>
                  ✅ {stats.counts.availableVehicles} Vehicles Available
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '14px' }}>
                  System Allocation
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', border: '3px solid #2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color: '#2563eb', margin: '0 auto 6px' }}>
                      {stats.counts.vehicles}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>Vehicles</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', border: '3px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color: '#10b981', margin: '0 auto 6px' }}>
                      {stats.counts.drivers}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>Drivers</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', border: '3px solid #f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color: '#f97316', margin: '0 auto 6px' }}>
                      {stats.counts.customers ?? 0}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>Riders</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* SECTION 3: REVENUE & OPERATIONAL CHARTS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800' }}>Revenue Overview</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Earnings derived from completed bookings</span>
              </div>
              <AreaChart data={stats.analytics?.monthlyData} dataKey="revenue" labelKey="label" color="#eab308" formatVal={(v) => `₹${v}`} />
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800' }}>Daily Booking Load Trends</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Operations volume over last 7 days</span>
              </div>
              <AreaChart data={stats.analytics?.dailyTrends} dataKey="count" labelKey="label" color="#f97316" />
            </div>
          </div>

          {/* SECTION 4: STATUS ALLOCATION & CLASS USAGE CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800' }}>Trip Status Allocation</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Breakdown share by booking status</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                <DoughnutChart data={stats.analytics?.tripStatusBreakdown} />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800' }}>Fleet Utilization by Class</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Share of trips by vehicle category</span>
              </div>
              <HorizontalBarChart data={stats.analytics?.vehicleTypeUsage || { Sedan: 0, SUV: 0, Luxury: 0, Minivan: 0 }} />
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '80px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '15px' }}>
          ⚠️ Unable to load dashboard stats. Please refresh.
        </div>
      )}
    </div>
  );
}

export default AdminOverview;
