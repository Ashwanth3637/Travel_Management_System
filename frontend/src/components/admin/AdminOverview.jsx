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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '36px', textAlign: 'left', paddingBottom: '48px' }}>

      {/* ─── HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '27px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
            Admin Control Center
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Fleet analytics, trip dispatch logistics, and system health.
          </p>
        </div>
        <div style={{
          fontSize: '12.5px',
          fontWeight: '700',
          color: 'var(--color-primary)',
          backgroundColor: 'var(--color-primary-glow)',
          padding: '7px 14px',
          borderRadius: '10px',
          border: '1px solid rgba(16,185,129,0.18)',
        }}>
          ⏱️ {currentTime}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '80px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '15px', fontWeight: '600' }}>
          <div className="icon-spin" style={{ display: 'inline-block', fontSize: '28px', marginBottom: '12px' }}>🔄</div>
          <div>Initializing metrics engine...</div>
        </div>
      ) : stats ? (
        <>
          {/* ─── SECTION 1: BOOKING & TRIP LIFECYCLE ─── */}
          <div>
            <SectionLabel label="Booking & Trip Lifecycle" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <StatCard title="Total Bookings"     value={stats.counts.bookings}   icon="📊" color="#3b82f6" subtitle="All time records" />
              <StatCard title="Pending Bookings"   value={stats.counts.pending}    icon="⏳" color="#f59e0b" subtitle="Awaiting allocation" />
              <StatCard title="Confirmed Bookings" value={stats.counts.confirmed}  icon="📅" color="#6366f1" subtitle="Driver assigned" />
              <StatCard title="Ongoing Trips"      value={stats.counts.ongoing}    icon="🚗" color="#10b981" subtitle="Passengers in transit" />
              <StatCard title="Completed Trips"    value={stats.counts.completed}  icon="✅" color="#059669" subtitle="Successfully closed" />
              <StatCard title="Cancelled Bookings" value={stats.counts.cancelled}  icon="❌" color="#ef4444" subtitle="Aborted requests" />
            </div>
          </div>

          {/* ─── SECTION 2: FLEET + DRIVERS + CUSTOMERS ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

            {/* Fleet Statistics */}
            <div>
              <SectionLabel label="Fleet Statistics" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <StatCard title="Total Vehicles"     value={stats.counts.vehicles}            icon="🚙" color="#06b6d4" subtitle="Registered cars" />
                <StatCard title="Available Vehicles" value={stats.counts.availableVehicles}   icon="🟢" color="#10b981" subtitle={`${stats.utilization?.vehicleRate ?? 0}% utilization rate`} />
                <StatCard title="Vehicles on Trip"   value={stats.counts.vehiclesOnTrip ?? 0} icon="🟠" color="#f97316" subtitle="Active telemetry" />
              </div>
            </div>

            {/* Resources & Customers */}
            <div>
              <SectionLabel label="Drivers & Customers" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <StatCard title="Total Drivers"     value={stats.counts.drivers}          icon="👨‍✈️" color="#8b5cf6" subtitle="Registered staff" />
                <StatCard title="Available Drivers" value={stats.counts.availableDrivers} icon="🛂"   color="#a78bfa" subtitle={`${stats.utilization?.driverRate ?? 0}% active rate`} />
                <StatCard title="Total Customers"   value={stats.counts.customers ?? 0}   icon="👥"   color="#ec4899" subtitle="Registered user profiles" />
              </div>
            </div>

          </div>

          {/* ─── SECTION 3: CHARTS ROW 1 — BOOKINGS & REVENUE ─── */}
          <div>
            <SectionLabel label="Monthly Analytics" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>

              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800' }}>Monthly Bookings Trend</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Historical booking volume over last 6 months</span>
                </div>
                <BarChart data={stats.analytics?.monthlyData} dataKey="bookings" labelKey="label" color="var(--color-primary)" />
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800' }}>Revenue Overview</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Earnings derived from completed bookings</span>
                </div>
                <AreaChart data={stats.analytics?.monthlyData} dataKey="revenue" labelKey="label" color="var(--color-secondary)" formatVal={(v) => `₹${v}`} />
              </div>

            </div>
          </div>

          {/* ─── SECTION 4: CHARTS ROW 2 — TRENDS, STATUS, VEHICLES ─── */}
          <div>
            <SectionLabel label="Operational Charts" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800' }}>Daily Booking Trends</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Operations load index — last 7 days</span>
                </div>
                <AreaChart data={stats.analytics?.dailyTrends} dataKey="count" labelKey="label" color="#ec4899" />
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800' }}>Trip Status Allocation</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Breakdown share by booking status</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', minHeight: '200px' }}>
                  <DoughnutChart data={stats.analytics?.tripStatusBreakdown} />
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800' }}>Vehicle Category Usage</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Popularity index by category bookings</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', minHeight: '200px' }}>
                  {stats.analytics?.vehicleUsage ? (
                    <HorizontalBarChart data={stats.analytics.vehicleUsage} />
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>No category data available.</div>
                  )}
                </div>
              </div>

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
