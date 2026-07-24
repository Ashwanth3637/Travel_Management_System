/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomerBooking from "./CustomerBooking";
import CustomerBookingHistory from "./CustomerBookingHistory";
import CustomerTrackTrip from "./CustomerTrackTrip";
import CustomerFeedback from "./CustomerFeedback";

const NAV_ITEMS = [
  { key: "home",    icon: "🏠", label: "Overview" },
  { key: "booking", icon: "🚗", label: "Book a Ride" },
  { key: "history", icon: "📜", label: "Ride History" },
  { key: "track",   icon: "📍", label: "Track Active Trip" },
  { key: "feedback", icon: "💬", label: "Feedback" },
];

function CustomerDashboard({ token, customer, onUpdateProfile, activeTab, activeTrackBooking, setActiveTrackBooking, handleLogout }) {
  const API_URL = "http://localhost:5001/api";
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, active: 0, completed: 0, cancelled: 0 });

  // Inline edit profile states
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName]   = useState(customer ? customer.name  : "");
  const [editPhone, setEditPhone] = useState(customer ? customer.phone : "");
  const [editSuccess, setEditSuccess] = useState("");

  useEffect(() => {
    if (customer) {
      setEditName(customer.name || "");
      setEditPhone(customer.phone || "");
    }
  }, [customer]);

  const [recentActiveBookings, setRecentActiveBookings] = useState([]);

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
          active:    data.filter(b => b.status === "In Progress" || b.status === "Trip Started").length,
          completed: data.filter(b => b.status === "Completed").length,
          cancelled: data.filter(b => b.status === "Cancelled").length
        });
        // Active or upcoming non-completed trips
        const actives = data.filter(b => b.status !== "Completed" && b.status !== "Cancelled");
        setRecentActiveBookings(actives);
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

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editName || !editPhone) { alert("Name and Phone are required."); return; }
    const updated = { ...customer, name: editName, phone: editPhone };
    onUpdateProfile(updated);
    setEditSuccess("Profile updated successfully!");
    setTimeout(() => { setEditSuccess(""); setEditingProfile(false); }, 2000);
  };

  const handleSelectTrackTrip = (booking) => {
    setActiveTrackBooking(booking);
    navigate("/customer/track");
  };

  const handleClearActiveTrip = () => {
    setActiveTrackBooking(null);
    navigate("/customer/home");
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

            {/* Active Bookings Banner & OTP Card */}
            {recentActiveBookings.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔑 Active Bookings & Start OTP Code
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {recentActiveBookings.map(b => (
                    <div key={b.id} className="glass-panel" style={{
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: '4px solid var(--color-primary)',
                      flexWrap: 'wrap',
                      gap: '15px'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-main)' }}>#{b.id}</span>
                          <span className={`badge ${
                            b.status === 'Pending' ? 'badge-pending' : 
                            ['Confirmed', 'Driver Assigned', 'Vehicle Assigned', 'Trip Scheduled'].includes(b.status) ? 'badge-confirmed' : 
                            ['Completed', 'Trip Completed'].includes(b.status) ? 'badge-completed' : 
                            'badge-inprogress'
                          }`}>
                            {b.status}
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({b.vehicleType})</span>
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                          📍 {b.pickupLocation} → {b.dropLocation}
                        </div>
                      </div>

                      {b.startOtp && (
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(197, 168, 92, 0.2), rgba(229, 193, 88, 0.1))',
                          padding: '10px 18px',
                          borderRadius: '12px',
                          border: '1px solid var(--color-primary)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: '700', letterSpacing: '0.05em' }}>
                            Trip Start OTP
                          </div>
                          <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '4px', color: '#fff', marginTop: '2px' }}>
                            {b.startOtp}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Share with driver
                          </div>
                        </div>
                      )}

                      <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => handleSelectTrackTrip(b)}>
                        📍 Track Trip
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', marginTop: '30px' }}>
              <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px 0' }}>Quick Shortcuts</h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '15px' }} onClick={() => navigate("/customer/booking")}>
                    🚗 Book a Cab
                  </button>
                  <button className="btn btn-indigo" style={{ flex: 1, padding: '15px' }} onClick={() => navigate("/customer/history")}>
                    📜 Ride History
                  </button>
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '30px', borderLeft: '4px solid var(--status-pending)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 12px 0' }}>Trip Regulations</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Bookings can only be cancelled while in <strong>Pending</strong> or <strong>Confirmed</strong> states. Share your <strong>4-digit Trip Start OTP</strong> with the assigned chauffeur to authorize and start the trip.
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
      case "feedback":
        return <CustomerFeedback token={token} customer={customer} />;
      default:
        return null;
    }
  };

  const sidebarNavLink = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '13px 18px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    color:           isActive ? '#ffffff' : 'var(--text-muted)',
    backgroundColor: isActive ? '#10b981' : 'rgba(255,255,255,0.01)',
    borderLeft:      isActive ? '4px solid #ffffff' : '4px solid transparent',
    boxShadow:       isActive ? '0 0 20px rgba(16, 185, 129, 0.45)' : 'none',
  });

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ─── LEFT SIDEBAR ─── */}
      <div className="glass-panel" style={{
        width: '240px',
        minWidth: '240px',
        background: 'var(--bg-card)',
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

        {/* ── Profile block ── */}
        {!editingProfile ? (
          <div style={{ textAlign: 'center', padding: '16px 8px 20px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
            {/* Avatar */}
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '24px', color: '#fff',
              margin: '0 auto 10px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
            }}>
              {customer ? customer.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', marginBottom: '3px' }}>
              {customer ? customer.name : 'Rider'}
            </div>
            {customer?.email && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', wordBreak: 'break-all' }}>
                {customer.email}
              </div>
            )}
            {customer?.phone && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                📞 {customer.phone}
              </div>
            )}
            <span className="badge badge-inprogress" style={{ fontSize: '10px', marginBottom: '10px', display: 'inline-block' }}>Rider</span>
            {/* Edit Profile button */}
            <div>
              <button
                className="btn btn-green"
                onClick={() => setEditingProfile(true)}
                style={{
                  marginTop: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  width: '100%'
                }}
              >
                ✏️ Edit Profile
              </button>
            </div>
          </div>
        ) : (
          /* ── Inline Edit Profile Form ── */
          <div style={{ padding: '12px 4px 16px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)', marginBottom: '12px', textAlign: 'center' }}>
              ✏️ Edit Profile
            </div>

            {editSuccess && (
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--status-completed-bg)', color: 'var(--status-completed)', borderRadius: '6px', fontSize: '12px', marginBottom: '10px', textAlign: 'center', border: '1px solid var(--status-completed)' }}>
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Email (read only) */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  value={customer?.email || ""}
                  disabled
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '12px', opacity: 0.6, cursor: 'not-allowed', boxSizing: 'border-box' }}
                />
              </div>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              {/* Phone */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button type="submit" style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: '700', borderRadius: '7px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }}>
                  Save
                </button>
                <button type="button" onClick={() => { setEditingProfile(false); setEditSuccess(""); }} style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: '700', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats summary */}
        {!editingProfile && (
          <div style={{ padding: '10px 8px', marginBottom: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', textAlign: 'center' }}>
              My Stats
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { label: 'Total',     value: stats.total,                      color: 'var(--color-primary)' },
                { label: 'Active',    value: stats.active + stats.confirmed,   color: 'var(--status-confirmed)' },
                { label: 'Done',      value: stats.completed,                  color: '#10b981' },
                { label: 'Cancelled', value: stats.cancelled,                  color: 'var(--status-cancelled)' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { navigate(`/customer/${item.key}`); setEditingProfile(false); }}
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

        {/* Logout */}
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
