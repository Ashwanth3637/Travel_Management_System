/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import CustomerBooking from "./CustomerBooking";
import CustomerBookingHistory from "./CustomerBookingHistory";
import CustomerTrackTrip from "./CustomerTrackTrip";
import CustomerProfile from "./CustomerProfile";

function CustomerDashboard({ token, customer, onUpdateProfile, activeTab, setActiveTab, activeTrackBooking, setActiveTrackBooking }) {
  const API_URL = "http://localhost:5001/api";

  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, active: 0, completed: 0, cancelled: 0 });

  const fetchStats = useCallback(async () => {
    if (!customer) return;
    try {
      const res = await fetch(`${API_URL}/customer/bookings?customerName=${encodeURIComponent(customer.name)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned HTML or invalid response. Please restart your backend server to load the new APIs.");
      }
      const data = await res.json();
      if (res.ok && data) {
        const metrics = {
          total: data.length,
          pending: data.filter(b => b.status === "Pending").length,
          confirmed: data.filter(b => b.status === "Confirmed").length,
          active: data.filter(b => b.status === "In Progress").length,
          completed: data.filter(b => b.status === "Completed").length,
          cancelled: data.filter(b => b.status === "Cancelled").length
        };
        setStats(metrics);
      }
    } catch (err) {
      console.error("Failed to load metrics log stats", err);
    }
  }, [token, customer]);

  useEffect(() => {
    fetchStats();
    // Refresh stats periodically
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

  // Render tab panel component dynamically
  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="animate-fade-in" style={{ textAlign: 'left' }}>
            {/* Header Greeting */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
                Welcome back, {customer ? customer.name : 'Rider'}!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: 0 }}>
                Manage your travel plans, book cabs, and track dispatches easily.
              </p>
            </div>

            {/* Metrics cards grid */}
            <div className="dashboard-grid">
              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                <div>
                  <div style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Total Bookings
                  </div>
                  <div className="stat-val">{stats.total}</div>
                </div>
                <div style={{ fontSize: '24px' }}>📅</div>
              </div>

              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--status-confirmed)' }}>
                <div>
                  <div style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Active & Dispatched
                  </div>
                  <div className="stat-val">{stats.active + stats.confirmed}</div>
                </div>
                <div style={{ fontSize: '24px' }}>🚗</div>
              </div>

              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div>
                  <div style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Completed Rides
                  </div>
                  <div className="stat-val">{stats.completed}</div>
                </div>
                <div style={{ fontSize: '24px' }}>✅</div>
              </div>

              <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--status-cancelled)' }}>
                <div>
                  <div style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Cancelled Trips
                  </div>
                  <div className="stat-val">{stats.cancelled}</div>
                </div>
                <div style={{ fontSize: '24px' }}>❌</div>
              </div>
            </div>

            {/* Quick Actions and Available Cabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', marginTop: '30px' }}>
              
              {/* Quick Actions panel */}
              <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px 0' }}>
                  Quick Shortcuts
                </h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '15px' }}
                    onClick={() => setActiveTab("booking")}
                  >
                    <span>🚗 Book a Cab</span>
                  </button>
                  <button 
                    className="btn btn-indigo" 
                    style={{ flex: 1, padding: '15px' }}
                    onClick={() => setActiveTab("history")}
                  >
                    <span>📜 Ride History</span>
                  </button>
                </div>
              </div>

              {/* Ride Guidelines card */}
              <div className="glass-panel" style={{ padding: '30px', borderLeft: '4px solid var(--status-pending)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 12px 0' }}>
                  Trip Regulations
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Bookings can only be cancelled while in <strong>Pending</strong> or <strong>Confirmed</strong> states. Once a trip status shifts to <strong>In Progress</strong>, cancellations are disabled.
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Navigation tabs bar */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "booking" ? "active" : ""}`}
          onClick={() => setActiveTab("booking")}
        >
          Book a Ride
        </button>
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Ride History
        </button>
        <button
          className={`tab-btn ${activeTab === "track" ? "active" : ""}`}
          onClick={() => setActiveTab("track")}
        >
          Track Active Trip
        </button>
        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          My Profile
        </button>
      </div>

      {/* Main Tab Panel Component */}
      <div style={{ marginTop: '20px' }}>
        {renderTabContent()}
      </div>
    </div>
  );
}

export default CustomerDashboard;
