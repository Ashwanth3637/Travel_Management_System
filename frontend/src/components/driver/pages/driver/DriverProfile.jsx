import React, { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaCircle } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function DriverProfile() {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_URL}/driver/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setDriver(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to localStorage if API fails
        const cached = JSON.parse(localStorage.getItem("driver"));
        if (cached) setDriver(cached);
        setError("Could not refresh profile from server.");
        setLoading(false);
      });
  }, []);

  const statusColor = driver?.status === "Available"
    ? "var(--status-completed)"
    : driver?.status === "On Trip"
    ? "var(--status-pending)"
    : "var(--text-muted)";

  const fields = [
    { icon: <FaUser />, label: "Full Name", value: driver?.name },
    { icon: <FaEnvelope />, label: "Email Address", value: driver?.email },
    { icon: <FaPhone />, label: "Phone Number", value: driver?.phone },
    { icon: <FaIdCard />, label: "License Number", value: driver?.licenseNumber },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>My Profile</h2>
        <p style={{ color: "var(--text-muted)" }}>Your personal information and account details.</p>
      </div>

      {error && (
        <div style={{
          padding: "10px 16px", backgroundColor: "var(--status-pending-bg)",
          color: "var(--status-pending)", borderRadius: "8px", fontSize: "13px",
          marginBottom: "20px", border: "1px solid var(--status-pending)"
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          Loading profile...
        </div>
      ) : (
        <div className="glass-panel" style={{ maxWidth: "600px" }}>

          {/* Status badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "22px", fontWeight: "700" }}>{driver?.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600" }}>
              <FaCircle size={10} color={statusColor} />
              <span style={{ color: statusColor }}>{driver?.status || "Unknown"}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {fields.map(f => (
              <div key={f.label} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {f.icon} {f.label}
                </label>
                <div className="form-input" style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "var(--text-main)" }}>
                  {f.value || "N/A"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}