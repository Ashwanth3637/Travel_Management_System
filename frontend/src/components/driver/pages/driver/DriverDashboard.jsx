import React, { useState, useEffect } from "react";
import { FaCarSide, FaCheckCircle, FaSpinner, FaCalendarCheck } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function DriverDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState("Driver");

  const fetchDashboardData = (isInitial = false) => {
    if (isInitial) setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/driver/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        const recent = (data.trips || [])
          .filter(t => t.status !== "Completed" && t.status !== "Cancelled")
          .slice(0, 5);
        setRecentTrips(recent);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const driver = JSON.parse(localStorage.getItem("driver"));
    if (driver && driver.name) setDriverName(driver.name);

    fetchDashboardData(true);

    // Auto-refresh every 3 seconds for real-time updates when Admin assigns trips
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const totalEarnings = (stats?.trips || [])
    .filter(t => t.status === "Completed")
    .reduce((sum, t) => sum + Math.round((t.fareEstimated || 0) * 0.85), 0);

  const statCards = [
    {
      label: "Total Earnings",
      value: `₹${totalEarnings.toLocaleString("en-IN")}`,
      icon: "💰",
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.15)"
    },
    {
      label: "Total Trips",
      value: stats?.totalTrips ?? 0,
      icon: <FaCarSide />,
      color: "var(--color-secondary)",
      bg: "var(--color-secondary-glow)"
    },
    {
      label: "Completed",
      value: stats?.completedTrips ?? 0,
      icon: <FaCheckCircle />,
      color: "var(--status-completed)",
      bg: "var(--status-completed-bg)"
    },
    {
      label: "Ongoing",
      value: stats?.ongoingTrips ?? 0,
      icon: <FaSpinner />,
      color: "var(--status-inprogress)",
      bg: "var(--status-inprogress-bg)"
    },
    {
      label: "Upcoming",
      value: stats?.upcomingTrips ?? 0,
      icon: <FaCalendarCheck />,
      color: "var(--status-pending)",
      bg: "var(--status-pending-bg)"
    }
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>
          Welcome back, {driverName}!
        </h2>
        <p style={{ color: "var(--text-muted)" }}>Here is your dashboard overview and ride earnings payout for today.</p>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          Loading dashboard...
        </div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "35px"
          }}>
            {statCards.map(card => (
              <div key={card.label} className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px" }}>
                <div style={{
                  width: "50px", height: "50px", borderRadius: "50%",
                  backgroundColor: card.bg,
                  color: card.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", flexShrink: 0
                }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: '700', textTransform: 'uppercase', marginBottom: "2px" }}>{card.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: card.label === "Total Earnings" ? "#10b981" : "#1e293b" }}>{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel">
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              Active & Assigned Ride Earnings Payout
            </h3>
            {recentTrips.length > 0 ? recentTrips.map(trip => {
              const driverEarn = Math.round((trip.fareEstimated || 0) * 0.85);
              return (
                <div key={trip.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "16px 0", borderBottom: "1px solid var(--border-color)", flexWrap: "wrap", gap: "12px"
                }}>
                  <div>
                    <div style={{ fontWeight: "800", fontSize: "16px", marginBottom: "4px" }}>{trip.customerName}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                      📍 {trip.pickupLocation} → {trip.dropLocation}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>RIDE FARE</div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>₹{trip.fareEstimated?.toLocaleString("en-IN")}</div>
                    </div>

                    <div style={{
                      backgroundColor: "#dcfce7",
                      border: "1px solid #86efac",
                      padding: "6px 14px",
                      borderRadius: "12px",
                      textAlign: "right"
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#15803d", textTransform: "uppercase" }}>YOUR EARNING (85%)</div>
                      <div style={{ fontSize: "17px", fontWeight: "800", color: "#166534" }}>💰 ₹{driverEarn.toLocaleString("en-IN")}</div>
                    </div>

                    <div style={{
                      padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                      backgroundColor: trip.status === "In Progress" ? "var(--status-inprogress-bg)" : "var(--status-confirmed-bg)",
                      color: trip.status === "In Progress" ? "var(--status-inprogress)" : "var(--status-confirmed)"
                    }}>
                      {trip.status}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "30px 0" }}>
                No active or upcoming trips.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}