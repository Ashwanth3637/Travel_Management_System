/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomerBooking from "./CustomerBooking";
import CustomerBookingHistory from "./CustomerBookingHistory";
import CustomerTrackTrip from "./CustomerTrackTrip";
import CustomerFeedback from "./CustomerFeedback";
import CustomerPayments from "./CustomerPayments";
import { BarChart, HorizontalBarChart } from "../admin/ChartComponents";

const NAV_ITEMS = [
  { key: "home",     icon: "🏠", label: "Dashboard",        color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
  { key: "booking",  icon: "🚗", label: "Book Your Trip",   color: "#f97316", bg: "rgba(249, 115, 22, 0.14)" },
  { key: "history",  icon: "📜", label: "Trip History",     color: "#f59e0b", bg: "rgba(245, 158, 11, 0.14)" },
  { key: "track",    icon: "📍", label: "Track Active Trip", color: "#10b981", bg: "rgba(16, 185, 129, 0.14)" },
  { key: "payments", icon: "💳", label: "Payments",         color: "#10b981", bg: "rgba(16, 185, 129, 0.14)" },
  { key: "feedback", icon: "💬", label: "Feedback",          color: "#06b6d4", bg: "rgba(6, 182, 212, 0.14)" },
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
  const [allBookings, setAllBookings] = useState([]);

  // Live Date & Time Clock
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      setCurrentTime(now.toLocaleString('en-US', options));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

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
        setAllBookings(data);
        setStats({
          total:     data.length,
          pending:   data.filter(b => b.status === "Pending").length,
          confirmed: data.filter(b => b.status === "Confirmed").length,
          active:    data.filter(b => b.status === "In Progress" || b.status === "Trip Started").length,
          completed: data.filter(b => b.status === "Completed" || b.status === "Trip Completed").length,
          cancelled: data.filter(b => b.status === "Cancelled").length
        });
        // Active or upcoming non-completed trips
        const actives = data.filter(b => !["Completed", "Trip Completed", "Cancelled"].includes(b.status));
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
          <div className="animate-fade-in" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* ─── STANDALONE CUSTOMER HEADER CARD ─── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              backgroundColor: '#ffffff',
              padding: '18px 28px',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
              border: '1px solid #e2e8f0',
              borderLeft: '5px solid #2563eb'
            }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#1e293b', letterSpacing: '-0.3px' }}>
                  Welcome back, {customer ? customer.name : 'Valued Rider'}! 👋
                </h2>
                <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0, fontWeight: '600' }}>
                  Customer Dashboard & Live Dispatch Logistics
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            </div>

            {/* ─── 1. CUSTOMER STAT CARDS ROW (FIRST) ─── */}
            <div className="dashboard-grid" style={{ marginTop: '10px' }}>
              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
                <div>
                  <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>Total Bookings</div>
                  <div className="stat-val" style={{ color: '#2563eb' }}>{stats.total}</div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>📈 +14% this month</div>
                </div>
                <div style={{ fontSize: '24px', backgroundColor: 'rgba(37, 99, 235, 0.12)', padding: '12px', borderRadius: '12px' }}>📅</div>
              </div>
              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #f97316' }}>
                <div>
                  <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>Active & Dispatched</div>
                  <div className="stat-val" style={{ color: '#f97316' }}>{stats.active + stats.confirmed}</div>
                  <div style={{ fontSize: '11px', color: '#f97316', fontWeight: '700', marginTop: '4px' }}>⚡ Live tracking</div>
                </div>
                <div style={{ fontSize: '24px', backgroundColor: 'rgba(249, 115, 22, 0.14)', padding: '12px', borderRadius: '12px' }}>🚗</div>
              </div>
              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div>
                  <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>Completed Rides</div>
                  <div className="stat-val" style={{ color: '#10b981' }}>{stats.completed}</div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>✅ 100% On Time</div>
                </div>
                <div style={{ fontSize: '24px', backgroundColor: 'rgba(16, 185, 129, 0.14)', padding: '12px', borderRadius: '12px' }}>✅</div>
              </div>
              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                <div>
                  <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>Cancelled Trips</div>
                  <div className="stat-val" style={{ color: '#ef4444' }}>{stats.cancelled}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>Aborted requests</div>
                </div>
                <div style={{ fontSize: '24px', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '12px' }}>❌</div>
              </div>
            </div>

            {/* ─── 2. ACTIVE BOOKINGS & START OTP CODES (SECOND) ─── */}
            {recentActiveBookings.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                  🔑 Active Bookings & Start OTP Code
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {recentActiveBookings.map(b => (
                    <div key={b.id} className="glass-panel" style={{
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: '5px solid #2563eb',
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
                          <span style={{ fontSize: '13px', color: '#64748b' }}>({b.vehicleType})</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          📍 {b.pickupLocation} → {b.dropLocation}
                        </div>
                      </div>

                      {b.startOtp && (
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.05))',
                          padding: '10px 18px',
                          borderRadius: '12px',
                          border: '1px solid #2563eb',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#2563eb', fontWeight: '800', letterSpacing: '0.5px' }}>
                            DRIVER TRIP START OTP
                          </div>
                          <div style={{ fontSize: '22px', fontWeight: '900', color: '#1d4ed8', letterSpacing: '3px', marginTop: '2px' }}>
                            {b.startOtp}
                          </div>
                        </div>
                      )}

                      <button 
                        style={{ 
                          padding: '9px 18px', 
                          fontSize: '12.5px',
                          fontWeight: '700',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                          transition: 'all 0.2s ease'
                        }} 
                        onClick={() => handleSelectTrackTrip(b)}
                      >
                        📍 Track Trip
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── EASY ANALYTICS CHARTS ROW ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
              
              {/* Chart 1: Weekly Trip Volume */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Activity Overview</div>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', margin: '2px 0 0 0', color: '#1e293b' }}>Weekly Travel Demand</h4>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                    📊 Peak Activity: Sat
                  </span>
                </div>
                <BarChart
                  data={[
                    { label: 'Mon', count: 3 },
                    { label: 'Tue', count: 5 },
                    { label: 'Wed', count: 4 },
                    { label: 'Thu', count: 8 },
                    { label: 'Fri', count: 12 },
                    { label: 'Sat', count: 15 },
                    { label: 'Sun', count: 9 }
                  ]}
                  dataKey="count"
                  labelKey="label"
                  color="#2563eb"
                />
              </div>

              {/* Chart 2: Fleet Category Preference */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Fleet Preference</div>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', margin: '2px 0 0 0', color: '#1e293b' }}>Vehicle Class Distribution</h4>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '12px' }}>
                    🚘 Top: Sedan
                  </span>
                </div>
                <HorizontalBarChart
                  data={{
                    Sedan: stats.total > 0 ? Math.max(1, Math.round(stats.total * 0.45)) : 8,
                    SUV: stats.total > 0 ? Math.max(1, Math.round(stats.total * 0.30)) : 5,
                    Luxury: stats.total > 0 ? Math.max(1, Math.round(stats.total * 0.15)) : 3,
                    Minivan: stats.total > 0 ? Math.max(1, Math.round(stats.total * 0.10)) : 2
                  }}
                />
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
      case "payments":
        return <CustomerPayments token={token} customer={customer} onPaymentComplete={fetchStats} />;
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
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14.5px',
    fontWeight: '800',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.25s ease-in-out',
    color:           isActive ? '#ffffff' : '#0f172a',
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    boxShadow:       isActive ? '0 4px 15px rgba(59, 130, 246, 0.35)' : 'none',
  });

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ─── LEFT SIDEBAR (MATCHES ADMIN MENU 1:1) ─── */}
      <div className="glass-panel" style={{
        width: '240px',
        minWidth: '240px',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'sticky',
        top: '80px',
        maxHeight: 'calc(100vh - 90px)',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}>

        {/* ── Customer Panel Title ── */}
        <div style={{ padding: '8px 4px 12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
          <div style={{
            fontSize: '22px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px'
          }}>
            Customer Panel
          </div>
        </div>

        {/* ── Profile block ── */}
        {!editingProfile ? (
          <div style={{ textAlign: 'center', padding: '8px 4px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            {/* Avatar */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '22px', color: '#fff',
              margin: '0 auto 8px',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)'
            }}>
              {customer ? customer.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', marginBottom: '3px' }}>
              {customer ? customer.name : 'Rider'}
            </div>
            {customer?.email && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', wordBreak: 'break-all' }}>
                {customer.email}
              </div>
            )}
            {customer?.phone && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                📞 {customer.phone}
              </div>
            )}
            <span className="badge badge-inprogress" style={{ fontSize: '10px', marginBottom: '8px', display: 'inline-block' }}>Rider</span>
            {/* Edit Profile button */}
            <div>
              <button
                onClick={() => setEditingProfile(true)}
                style={{
                  marginTop: '6px',
                  padding: '7px 12px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  width: '100%',
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  color: '#2563eb',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';
                  e.currentTarget.style.color = '#2563eb';
                  e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.25)';
                }}
              >
                ✏️ Edit Profile
              </button>
            </div>
          </div>
        ) : (
          /* ── Inline Edit Profile Form ── */
          <div style={{ padding: '8px 4px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-main)', marginBottom: '8px', textAlign: 'center' }}>
              ✏️ Edit Profile
            </div>

            {editSuccess && (
              <div style={{ padding: '6px 8px', backgroundColor: 'var(--status-completed-bg)', color: 'var(--status-completed)', borderRadius: '6px', fontSize: '11px', marginBottom: '8px', textAlign: 'center', border: '1px solid var(--status-completed)' }}>
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Email (read only) */}
              <div>
                <label style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Email</label>
                <input
                  type="email"
                  value={customer?.email || ""}
                  disabled
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '11px', opacity: 0.6, cursor: 'not-allowed', boxSizing: 'border-box' }}
                />
              </div>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--text-main)', fontSize: '11px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              {/* Phone */}
              <div>
                <label style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--text-main)', fontSize: '11px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                <button type="submit" style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)' }}>
                  Save
                </button>
                <button type="button" onClick={() => { setEditingProfile(false); setEditSuccess(""); }} style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Section Header */}
        <div style={{
          fontSize: '11px',
          fontWeight: '800',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          padding: '4px 12px 10px 12px',
          textAlign: 'left'
        }}>
          Customer Menu
        </div>

        {/* Navigation links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { navigate(`/customer/${item.key}`); setEditingProfile(false); }}
                style={sidebarNavLink(isActive)}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : item.bg,
                  fontSize: '17px',
                  flexShrink: 0
                }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Logout */}
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

      {/* ─── MAIN CONTENT PANEL ─── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {renderTabContent()}
      </div>

      {/* ─── FLOATING STICKY BOOK YOUR TRIP CTA BUTTON ─── */}
      <button
        onClick={() => navigate("/customer/booking")}
        className="animate-fade-in"
        title="Book Your Trip"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 999,
          padding: '13px 22px',
          borderRadius: '50px',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          fontWeight: '800',
          fontSize: '14px',
          border: 'none',
          boxShadow: '0 8px 25px rgba(37, 99, 235, 0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.25s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
          e.currentTarget.style.backgroundColor = '#1d4ed8';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 99, 235, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.backgroundColor = '#2563eb';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.45)';
        }}
      >
        <span style={{ fontSize: '18px' }}>🚗</span>
        <span>Book Your Trip</span>
      </button>

    </div>
  );
}

export default CustomerDashboard;
