import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, AreaChart, DoughnutChart, HorizontalBarChart } from './ChartComponents';

function StatCard({ title, value, icon, borderColor, glowColor, subtitle }) {
  return (
    <div className="glass-panel" style={{
      borderLeft: `4px solid ${borderColor}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 18px',
      gap: '12px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.22s ease-in-out, border-color 0.22s ease-in-out',
      minWidth: 0
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.borderColor = glowColor || borderColor;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = borderColor;
    }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
        <span style={{ 
          fontSize: '10.5px', 
          textTransform: 'uppercase', 
          color: 'var(--text-muted)', 
          fontWeight: '800', 
          letterSpacing: '0.8px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </span>
        <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.2' }}>
          {value}
        </span>
        {subtitle && (
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subtitle}
          </span>
        )}
      </div>
      <div style={{
        fontSize: '22px',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: '8px 10px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.03)',
        flexShrink: 0
      }}>
        {icon}
      </div>
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
  }, [token, toast]);

  useEffect(() => {
    fetchStats();
    // Poll stats every 10 seconds to keep charts and numbers live
    const interval = setInterval(fetchStats, 10000);

    // Dynamic date and time string
    const updateTime = () => {
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      setCurrentTime(new Date().toLocaleDateString('en-US', options));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [fetchStats]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', textAlign: 'left', paddingBottom: '40px' }}>
      
      {/* Header Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
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
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(16, 185, 129, 0.15)'
        }}>
          ⏱️ {currentTime}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '15px', fontWeight: '600' }}>
          <div className="icon-spin" style={{ display: 'inline-block', fontSize: '24px', marginBottom: '8px' }}>🔄</div>
          <div>Initializing metrics engine...</div>
        </div>
      ) : stats ? (
        <>
          {/* ─── SUMMARY STATS GROUPS ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Group 1: Booking & Trip Statuses (6 metrics) */}
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px' }}>
                Booking & Trip Lifecycle
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
                <StatCard 
                  title="Total Bookings" 
                  value={stats.counts.bookings} 
                  icon="📊" 
                  borderColor="#3b82f6" 
                  glowColor="#60a5fa"
                  subtitle="Cumulative list size"
                />
                <StatCard 
                  title="Pending Bookings" 
                  value={stats.counts.pending} 
                  icon="⏳" 
                  borderColor="#f59e0b" 
                  glowColor="#fbbf24"
                  subtitle="Awaiting allocation"
                />
                <StatCard 
                  title="Confirmed Bookings" 
                  value={stats.counts.confirmed} 
                  icon="📅" 
                  borderColor="#6366f1" 
                  glowColor="#818cf8"
                  subtitle="Driver assigned"
                />
                <StatCard 
                  title="Ongoing Trips" 
                  value={stats.counts.ongoing} 
                  icon="🚗" 
                  borderColor="#10b981" 
                  glowColor="#34d399"
                  subtitle="Passengers in transit"
                />
                <StatCard 
                  title="Completed Trips" 
                  value={stats.counts.completed} 
                  icon="✅" 
                  borderColor="#059669" 
                  glowColor="#10b981"
                  subtitle="Successfully closed"
                />
                <StatCard 
                  title="Cancelled Bookings" 
                  value={stats.counts.cancelled} 
                  icon="❌" 
                  borderColor="#ef4444" 
                  glowColor="#f87171"
                  subtitle="Aborted requests"
                />
              </div>
            </div>

            {/* Row with Fleet Status (3 metrics) and Team & Customers (3 metrics) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              
              {/* Fleet Status */}
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px' }}>
                  Fleet Statistics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
                  <StatCard 
                    title="Total Vehicles" 
                    value={stats.counts.vehicles} 
                    icon="🚙" 
                    borderColor="#06b6d4" 
                    glowColor="#22d3ee"
                    subtitle="Registered cars"
                  />
                  <StatCard 
                    title="Available Vehicles" 
                    value={stats.counts.availableVehicles} 
                    icon="🟢" 
                    borderColor="#10b981" 
                    glowColor="#34d399"
                    subtitle={`${stats.utilization?.vehicleRate ?? 0}% Util. Rate`}
                  />
                  <StatCard 
                    title="Vehicles on Trip" 
                    value={stats.counts.vehiclesOnTrip ?? 0} 
                    icon="🟠" 
                    borderColor="#f97316" 
                    glowColor="#fb923c"
                    subtitle="Active telemetry"
                  />
                </div>
              </div>

              {/* Team & Customers */}
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px' }}>
                  Resources & Customer Engagement
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
                  <StatCard 
                    title="Total Drivers" 
                    value={stats.counts.drivers} 
                    icon="👨‍✈️" 
                    borderColor="#8b5cf6" 
                    glowColor="#a78bfa"
                    subtitle="Registered staff"
                  />
                  <StatCard 
                    title="Available Drivers" 
                    value={stats.counts.availableDrivers} 
                    icon="🛂" 
                    borderColor="#a78bfa" 
                    glowColor="#c084fc"
                    subtitle={`${stats.utilization?.driverRate ?? 0}% Active Rate`}
                  />
                  <StatCard 
                    title="Total Customers" 
                    value={stats.counts.customers ?? 0} 
                    icon="👥" 
                    borderColor="#ec4899" 
                    glowColor="#f472b6"
                    subtitle="User profiles"
                  />
                </div>
              </div>

            </div>

          </div>

          {/* ─── CHARTS ROW 1: MONTHLY BOOKINGS & REVENUE OVERVIEW ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '8px' }}>
            <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>Monthly Bookings Trend</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Historical booking volume over last 6 months</span>
              </div>
              <BarChart 
                data={stats.analytics?.monthlyData} 
                dataKey="bookings" 
                labelKey="label" 
                color="var(--color-primary)" 
              />
            </div>
            
            <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>Revenue Overview</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Earnings derived from Completed bookings</span>
              </div>
              <AreaChart 
                data={stats.analytics?.monthlyData} 
                dataKey="revenue" 
                labelKey="label" 
                color="var(--color-secondary)" 
                formatVal={(v) => `₹${v}`} 
              />
            </div>
          </div>

          {/* ─── CHARTS ROW 2: TRENDS, STATUS, VEHICLES ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px' }}>
            
            <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>Daily Booking Trends</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Operations load index (last 7 days)</span>
              </div>
              <AreaChart 
                data={stats.analytics?.dailyTrends} 
                dataKey="count" 
                labelKey="label" 
                color="#ec4899" 
              />
            </div>

            <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>Trip Status Allocation</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Breakdown share of booking status</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', height: '100%', minHeight: '180px' }}>
                <DoughnutChart data={stats.analytics?.tripStatusBreakdown} />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>Vehicle Category Usage</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Popularity index by category bookings</span>
              </div>
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', minHeight: '180px' }}>
                {stats.analytics?.vehicleUsage ? (
                  <HorizontalBarChart data={stats.analytics.vehicleUsage} />
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>No category data.</div>
                )}
              </div>
            </div>

          </div>
        </>
      ) : (
        <div style={{ padding: '60px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '15px' }}>
          ⚠️ Unable to load dashboard overview stats. Please refresh.
        </div>
      )}
    </div>
  );
}

export default AdminOverview;
