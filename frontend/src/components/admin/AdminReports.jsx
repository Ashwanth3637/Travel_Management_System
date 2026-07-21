import React, { useState } from 'react';
import { BarChart, AreaChart, DoughnutChart, HorizontalBarChart } from './ChartComponents';

function AdminReports({ stats, refresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!stats) {
    return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Loading reports...</div>;
  }

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left', paddingBottom: '40px' }}>
      
      {/* Header & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
            System Reports & Analytics
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0 }}>
            Audit trails, financial summaries, and resource performance indexes.
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={handleRefreshClick} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: '600' }}
        >
          <svg className={isRefreshing ? 'icon-spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Refresh Statistics
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="dashboard-grid">
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div>
            <div className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Total Earnings</div>
            <div className="stat-val" style={{ color: '#10b981', fontSize: '28px', fontWeight: '800', margin: '4px 0' }}>₹{stats.earnings}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>From completed bookings</div>
          </div>
          <div style={{ backgroundColor: 'var(--status-inprogress-bg)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div>
            <div className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Active Bookings</div>
            <div className="stat-val" style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0' }}>{stats.counts.bookings}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {stats.counts.pending} Pending / {stats.counts.confirmed} Assigned
            </div>
          </div>
          <div style={{ backgroundColor: 'var(--status-confirmed-bg)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #06b6d4' }}>
          <div>
            <div className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Fleet Utilization</div>
            <div className="stat-val" style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0' }}>{stats.counts.vehicles - stats.counts.availableVehicles} / {stats.counts.vehicles}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Utilization Rate: {stats.utilization.vehicleRate}%
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div>
            <div className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Drivers on Trip</div>
            <div className="stat-val" style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0' }}>{stats.counts.drivers - stats.counts.availableDrivers} / {stats.counts.drivers}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Active Rate: {stats.utilization.driverRate}%
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          </div>
        </div>
      </div>

      {/* VISUAL ANALYTICS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800' }}>Revenue Overview Trend</h3>
          <AreaChart 
            data={stats.analytics?.monthlyData} 
            dataKey="revenue" 
            labelKey="label" 
            color="var(--color-secondary)" 
            formatVal={(v) => `₹${v}`} 
          />
        </div>
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800' }}>Booking Volume Comparison</h3>
          <BarChart 
            data={stats.analytics?.monthlyData} 
            dataKey="bookings" 
            labelKey="label" 
            color="var(--color-primary)" 
          />
        </div>
      </div>

      {/* DETAILED STATISTICAL OVERVIEW */}
      <div className="glass-panel" style={{ marginTop: '4px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '22px', fontSize: '16px', fontWeight: '800' }}>Operational Metrics Audit</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          
          <div>
            <h4 style={{ color: 'var(--color-primary)', marginTop: 0, fontSize: '14px', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Booking Pipeline
            </h4>
            <div className="details-list" style={{ marginTop: '12px' }}>
              <div className="details-row">
                <span className="details-label">Pending Allocation Requests</span>
                <span className="details-value">{stats.counts.pending}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Confirmed & Scheduled Dispatch</span>
                <span className="details-value">{stats.counts.confirmed}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Trips actively In Progress</span>
                <span className="details-value">{stats.counts.active}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Rides Closed / Completed</span>
                <span className="details-value">{stats.counts.completed}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Cancelled / Aborted Bookings</span>
                <span className="details-value">{stats.counts.cancelled}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--color-secondary)', marginTop: 0, fontSize: '14px', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Capacity & Telemetry
            </h4>
            <div className="details-list" style={{ marginTop: '12px' }}>
              <div className="details-row">
                <span className="details-label">Total Fleet Registered Vehicles</span>
                <span className="details-value">{stats.counts.vehicles}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Available Standing Vehicles</span>
                <span className="details-value">{stats.counts.availableVehicles}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Total Staff Drivers Registered</span>
                <span className="details-value">{stats.counts.drivers}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Available Standby Drivers</span>
                <span className="details-value">{stats.counts.availableDrivers}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Registered Customers database</span>
                <span className="details-value">{stats.counts.customers ?? 0}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default AdminReports;
