import React, { useState, useEffect } from "react";
import { FaCarSide, FaCheckCircle, FaSpinner, FaCalendarCheck } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function DriverDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState("Driver");

  useEffect(() => {
    const driver = JSON.parse(localStorage.getItem("driver"));
    if (driver && driver.name) setDriverName(driver.name);

    const token = localStorage.getItem("token");
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
  }, []);

  const statCards = [
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
        <p style={{ color: "var(--text-muted)" }}>Here is your dashboard overview for today.</p>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          Loading dashboard...
        </div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "40px"
          }}>
            {statCards.map(card => (
              <div key={card.label} className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%",
                  backgroundColor: card.bg,
                  color: card.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", flexShrink: 0
                }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "4px" }}>{card.label}</div>
                  <div style={{ fontSize: "26px", fontWeight: "700" }}>{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel">
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              Active & Upcoming Trips
            </h3>
            {recentTrips.length > 0 ? recentTrips.map(trip => (
              <div key={trip.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 0", borderBottom: "1px solid var(--border-color)"
              }}>
                <div>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>{trip.customerName}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    {trip.pickupLocation} → {trip.dropLocation}
                  </div>
                </div>
                <div style={{
                  padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                  backgroundColor: trip.status === "In Progress" ? "var(--status-inprogress-bg)" : "var(--status-confirmed-bg)",
                  color: trip.status === "In Progress" ? "var(--status-inprogress)" : "var(--status-confirmed)"
                }}>
                  {trip.status}
                </div>
              </div>
            )) : (
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