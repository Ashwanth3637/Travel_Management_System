import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaCalendarAlt, FaStar, FaRupeeSign } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function TripHistory() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_URL}/driver/trips`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const history = data.filter(t => t.status === "Completed" || t.status === "Cancelled");
        setTrips(history);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load trip history.");
        setLoading(false);
      });
  }, []);

  const formatDate = (dt) => new Date(dt).toLocaleString("en-IN", {
    dateStyle: "medium", timeStyle: "short"
  });

  const statusStyle = (status) => ({
    padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600",
    backgroundColor: status === "Completed" ? "var(--status-completed-bg)" : "var(--status-cancelled-bg)",
    color: status === "Completed" ? "var(--status-completed)" : "var(--status-cancelled)"
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>Trip History</h2>
        <p style={{ color: "var(--text-muted)" }}>Review your previously completed and cancelled trips.</p>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px", backgroundColor: "var(--status-cancelled-bg)",
          color: "var(--status-cancelled)", borderRadius: "8px", fontSize: "14px",
          fontWeight: "500", marginBottom: "20px", border: "1px solid var(--status-cancelled)"
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          Loading history...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {trips.length > 0 ? trips.map(trip => (
            <div key={trip.id} className="glass-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "17px", fontWeight: "600", marginBottom: "10px" }}>
                  {trip.customerName}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaMapMarkerAlt color="var(--color-primary)" />
                    {trip.pickupLocation} → {trip.dropLocation}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaCalendarAlt color="var(--color-secondary)" />
                    {formatDate(trip.pickupDateTime)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                <div style={statusStyle(trip.status)}>{trip.status}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", fontWeight: "600", fontSize: "14px" }}>
                  {trip.status === "Completed" && (
                    <span style={{ color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px" }}>
                      <FaStar /> 5.0
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", color: "var(--text-main)" }}>
                    <FaRupeeSign />{trip.fareEstimated?.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="glass-panel" style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)" }}>
              No trip history found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}