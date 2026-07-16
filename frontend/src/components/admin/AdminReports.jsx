import React, { useState } from 'react';

function AdminReports({ stats, refresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!stats) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading reports...</div>;
  }

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={handleRefreshClick} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg className={isRefreshing ? 'icon-spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Refresh Statistics
        </button>
      </div>
      {/* STATS OVERVIEW CARDS */}
      <div className="dashboard-grid animate-fade-in">
        <div className="glass-panel stat-card">
          <div>
            <div className="form-label">Total Earnings</div>
            <div className="stat-val" style={{ color: '#10b981' }}>₹{stats.earnings}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From completed bookings</div>
          </div>
          <div style={{ backgroundColor: 'var(--status-inprogress-bg)', padding: '12px', borderRadius: '12px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <div className="form-label">Active Bookings</div>
            <div className="stat-val">{stats.counts.bookings}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {stats.counts.pending} Pending / {stats.counts.confirmed} Assigned
            </div>
          </div>
          <div style={{ backgroundColor: 'var(--status-confirmed-bg)', padding: '12px', borderRadius: '12px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <div className="form-label">Fleet Utilization</div>
            <div className="stat-val">{stats.counts.vehicles - stats.counts.availableVehicles} / {stats.counts.vehicles}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Utilization Rate: {stats.utilization.vehicleRate}%
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <div className="form-label">Drivers on Trip</div>
            <div className="stat-val">{stats.counts.drivers - stats.counts.availableDrivers} / {stats.counts.drivers}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Active Rate: {stats.utilization.driverRate}%
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          </div>
        </div>
      </div>

      {/* DETAILED STATISTICAL OVERVIEW */}
      <div className="glass-panel animate-fade-in" style={{ marginTop: '30px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Business Metrics Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          
          <div>
            <h4 style={{ color: 'var(--color-primary)', marginTop: 0 }}>Trip Status Breakdown</h4>
            <div className="details-list">
              <div className="details-row">
                <span className="details-label">Pending Bookings</span>
                <span className="details-value">{stats.counts.pending}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Confirmed & Dispatched</span>
                <span className="details-value">{stats.counts.confirmed}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Trips In Progress</span>
                <span className="details-value">{stats.counts.active}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Completed Rides</span>
                <span className="details-value">{stats.counts.completed}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Cancelled Rides</span>
                <span className="details-value">{stats.counts.cancelled}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--color-secondary)', marginTop: 0 }}>Fleet & Capacity Analytics</h4>
            <div className="details-list">
              <div className="details-row">
                <span className="details-label">Total registered vehicles</span>
                <span className="details-value">{stats.counts.vehicles}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Available vehicles</span>
                <span className="details-value">{stats.counts.availableVehicles}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Total registered drivers</span>
                <span className="details-value">{stats.counts.drivers}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Available drivers</span>
                <span className="details-value">{stats.counts.availableDrivers}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default AdminReports;
