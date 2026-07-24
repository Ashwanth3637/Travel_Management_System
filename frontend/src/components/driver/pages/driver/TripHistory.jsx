import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaCalendarAlt, FaStar, FaRupeeSign } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function TripHistory() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const token = localStorage.getItem("token");

  const loadTrips = () => {
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
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const handleUpdatePayment = async (tripId, method) => {
    try {
      setError("");
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== "null" && token !== "undefined") {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/driver/bookings/${tripId}/payment-status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ paymentStatus: 'PAID', paymentMethod: method })
      });
      const data = await res.json();
      if (res.ok) {
        setToast(`✅ Payment for #${tripId} marked as ${method} Received!`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setToast(""), 5000);
        // Update state in place without page reload or redirection
        setTrips(prev => prev.map(t => t.id === tripId ? { ...t, paymentStatus: 'PAID', paymentMethod: method } : t));
      } else {
        setError(data.error || "Failed to update payment status.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update payment status.");
    }
  };

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

      {toast && (
        <div style={{
          padding: "14px 18px", backgroundColor: "#dcfce7", color: "#15803d",
          borderRadius: "10px", fontSize: "14px", fontWeight: "700",
          marginBottom: "20px", border: "1px solid #86efac",
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
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
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={statusStyle(trip.status)}>{trip.status}</div>
                  <span style={{
                    padding: "3px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: "700",
                    backgroundColor: trip.paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: trip.paymentStatus === 'PAID' ? '#10b981' : '#ef4444',
                    border: trip.paymentStatus === 'PAID' ? '1px solid #10b981' : '1px solid #ef4444'
                  }}>
                    {trip.paymentStatus === 'PAID' ? `PAID (${trip.paymentMethod || 'GPAY'}) ✅` : 'UNPAID ⌛'}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", fontWeight: "600", fontSize: "14px", flexWrap: "wrap" }}>
                  {trip.status === "Completed" && (
                    <span style={{ color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px" }}>
                      <FaStar /> 5.0
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", color: "#64748b", fontWeight: '700', fontSize: '13px' }}>
                    Fare: ₹{trip.fareEstimated?.toLocaleString("en-IN")}
                  </span>
                  <span style={{
                    padding: "3px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: "800",
                    backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #86efac"
                  }}>
                    💰 Earning: ₹{Math.round((trip.fareEstimated || 0) * 0.85).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Driver quick status update pills */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpdatePayment(trip.id, 'CASH'); }}
                    style={{ padding: '6px 12px', fontSize: '11.5px', fontWeight: '800', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#ffffff', cursor: 'pointer', boxShadow: '0 3px 10px rgba(16,185,129,0.35)' }}
                  >
                    💵 Mark Cash
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpdatePayment(trip.id, 'GPAY'); }}
                    style={{ padding: '6px 12px', fontSize: '11.5px', fontWeight: '800', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', cursor: 'pointer', boxShadow: '0 3px 10px rgba(37,99,235,0.35)' }}
                  >
                    📱 Mark GPay
                  </button>
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