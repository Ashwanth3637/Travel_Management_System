/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import CustomerBooking from "./CustomerBooking";
import CustomerBookingHistory from "./CustomerBookingHistory";
import CustomerTrackTrip from "./CustomerTrackTrip";
import CustomerProfile from "./CustomerProfile";

const NAV_ITEMS = [
  { key: "home",    icon: "🏠", label: "Overview" },
  { key: "booking", icon: "🚗", label: "Book a Ride" },
  { key: "history", icon: "📜", label: "Ride History" },
  { key: "track",   icon: "📍", label: "Track Active Trip" },
  { key: "profile", icon: "👤", label: "My Profile" },
];

function CustomerDashboard({ token, customer, onUpdateProfile, activeTab, setActiveTab, activeTrackBooking, setActiveTrackBooking, handleLogout }) {
  const API_URL = "http://localhost:5001/api";

  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, active: 0, completed: 0, cancelled: 0 });

  const fetchStats = useCallback(async () => {
    if (!customer) return;
    try {
      const res = await fetch(`${API_URL}/customer/bookings?customerName=${encodeURIComponent(customer.name)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      const data = await res.json();
      if (res.ok && data) {
        setStats({
          total:     data.length,
          pending:   data.filter(b => b.status === "Pending").length,
          confirmed: data.filter(b => b.status === "Confirmed").length,
          active:    data.filter(b => b.status === "In Progress").length,
          completed: data.filter(b => b.status === "Completed").length,
          cancelled: data.filter(b => b.status === "Cancelled").length
        });
      }
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  }, [token, customer]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleSelectTrackTrip = (booking) => {
    setActiveTrackBooking(booking);
    setActiveTab("track");
  };

  const handleClearActiveTrip = () => {
    setActiveTrackBooking(null);
    setActiveTab("home");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="animate-fade-in" style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
                Welcome back, {customer ? customer.name : 'Rider'}!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: 0 }}>
                Manage your travel plans, book cabs, and track dispatches easily.
              </p>
            </div>

            <div className="dashboard-grid">
              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                <div>
                  <div style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Total Bookings</div>
                  <div className="stat-val">{stats.total}</div>
                </div>
                <div style={{ fontSize: '24px' }}>📅</div>
              </div>

              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--status-confirmed)' }}>
                <div>
                  <div style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Active & Dispatched</div>
                  <div className="stat-val">{stats.active + stats.confirmed}</div>
                </div>
                <div style={{ fontSize: '24px' }}>🚗</div>
              </div>

              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div>
                  <div style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Completed Rides</div>
                  <div className="stat-val">{stats.completed}</div>
                </div>
                <div style={{ fontSize: '24px' }}>✅</div>
              </div>

              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--status-cancelled)' }}>
                <div>
                  <div style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Cancelled Trips</div>
                  <div className="stat-val">{stats.cancelled}</div>
                </div>
                <div style={{ fontSize: '24px' }}>❌</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', marginTop: '30px' }}>
              <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px 0' }}>Quick Shortcuts</h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '15px' }} onClick={() => setActiveTab("booking")}>
                    🚗 Book a Cab
                  </button>
                  <button className="btn btn-indigo" style={{ flex: 1, padding: '15px' }} onClick={() => setActiveTab("history")}>
                    📜 Ride History
                  </button>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '30px', borderLeft: '4px solid var(--status-pending)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 12px 0' }}>Trip Regulations</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Bookings can only be cancelled while in <strong>Pending</strong> or <strong>Confirmed</strong> states. Once a trip shifts to <strong>In Progress</strong>, cancellations are disabled.
                </p>
              </div>
            </div>
          </div>
        );
      case "booking":
        return <CustomerBooking token={token} customer={customer} />;
      case "history":
        return <CustomerBookingHistory token={token} customer={customer} onSelectTrackTrip={handleSelectTrackTrip} />;
      case "track":
        return <CustomerTrackTrip token={token} customer={customer} activeBooking={activeTrackBooking} onClearActiveTrip={handleClearActiveTrip} />;
      case "profile":
        return <CustomerProfile token={token} customer={customer} onUpdateProfile={onUpdateProfile} />;
      default:
        return null;
    }
  };

  // Sidebar style helpers
  const sidebarNavLink = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '13px 18px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    color:           isActive ? 'var(--text-dark)' : 'var(--text-muted)',
    backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.01)',
    borderLeft:      isActive ? '4px solid #fff' : '4px solid transparent',
    boxShadow:       isActive ? '0 0 15px var(--color-primary-glow)' : 'none',
  });

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ─── LEFT SIDEBAR ─── */}
      <div style={{
        width: '220px',
        minWidth: '220px',
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        position: 'sticky',
        top: '20px',
        minHeight: 'calc(100vh - 120px)'
      }}>
        {/* Profile avatar block */}
        <div style={{ textAlign: 'center', padding: '16px 8px 20px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '22px', color: '#fff',
            margin: '0 auto 10px',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)'
          }}>
            {customer ? customer.name.charAt(0).toUpperCase() : 'R'}
          </div>
          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>
            {customer ? customer.name : 'Rider'}
          </div>
          {customer?.email && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
              {customer.email}
            </div>
          )}
          <div style={{ marginTop: '8px' }}>
            <span className="badge badge-inprogress" style={{ fontSize: '11px' }}>Rider</span>
          </div>
        </div>

        {/* Booking Stats Summary */}
        <div style={{ padding: '10px 8px', marginBottom: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', textAlign: 'center' }}>
            My Stats
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {[
              { label: 'Total', value: stats.total, color: 'var(--color-primary)' },
              { label: 'Active', value: stats.active + stats.confirmed, color: 'var(--status-confirmed)' },
              { label: 'Done', value: stats.completed, color: '#10b981' },
              { label: 'Cancelled', value: stats.cancelled, color: 'var(--status-cancelled)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                style={sidebarNavLink(isActive)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = 'var(--text-main)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <span style={{ fontSize: '17px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Logout at bottom */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            className="btn btn-danger"
            onClick={handleLogout}
            style={{ width: '100%', padding: '11px 16px', fontSize: '14px', fontWeight: '600', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT PANEL ─── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {renderTabContent()}
      </div>

    </div>
  );
}

export default CustomerDashboard;
