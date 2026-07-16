import React, { useState, useEffect } from "react";
import { FaToggleOn, FaToggleOff, FaCircle } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function Availability() {
  const [status, setStatus] = useState("Available");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch current driver status from profile
    fetch(`${API_URL}/driver/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStatus(data.status || "Available");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleAvailability = async () => {
    const newStatus = status === "Available" ? "Offline" : "Available";
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/driver/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(newStatus);
      setToast(`Status updated to "${newStatus}"`);
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update availability.");
    } finally {
      setSaving(false);
    }
  };

  const isAvailable = status === "Available";
  const statusColor = isAvailable ? "var(--status-completed)" : "var(--text-muted)";
  const iconColor = isAvailable ? "var(--status-completed)" : "var(--text-muted)";

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>Availability Status</h2>
        <p style={{ color: "var(--text-muted)" }}>Set your availability to receive new trip assignments.</p>
      </div>

      {toast && (
        <div style={{
          padding: "12px 16px", backgroundColor: "var(--status-completed-bg)",
          color: "var(--status-completed)", borderRadius: "8px", fontSize: "14px",
          fontWeight: "500", marginBottom: "20px", border: "1px solid var(--status-completed)"
        }}>
          {toast}
        </div>
      )}

      {error && (
        <div style={{
          padding: "12px 16px", backgroundColor: "var(--status-cancelled-bg)",
          color: "var(--status-cancelled)", borderRadius: "8px", fontSize: "14px",
          fontWeight: "500", marginBottom: "20px", border: "1px solid var(--status-cancelled)"
        }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ maxWidth: "480px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>Loading...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: "90px", color: iconColor, marginBottom: "16px", transition: "color 0.3s" }}>
              {isAvailable ? <FaToggleOn /> : <FaToggleOff />}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <FaCircle size={10} color={statusColor} />
              <h3 style={{ fontSize: "22px", fontWeight: "600", margin: 0, color: statusColor }}>
                {isAvailable ? "You are Available" : "You are Offline"}
              </h3>
            </div>

            <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "14px" }}>
              {isAvailable
                ? "You can currently receive new trip assignments from the admin."
                : "You will not receive any new trip assignments until you go online."}
            </p>

            <button
              className={`btn ${isAvailable ? "btn-danger" : "btn-primary"}`}
              onClick={toggleAvailability}
              disabled={saving}
              style={{ width: "100%", padding: "14px", fontSize: "16px" }}
            >
              {saving ? "Updating..." : (isAvailable ? "Go Offline" : "Go Online")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
