import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaCalendarAlt, FaPlay, FaFlag, FaRupeeSign } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function AssignedTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const token = localStorage.getItem("token");

  const fetchTrips = (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    fetch(`${API_URL}/driver/trips`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const active = data.filter(t => ["Confirmed", "Driver Assigned", "Vehicle Assigned", "Trip Scheduled", "Trip Started", "Customer Picked Up", "Ongoing", "Destination Reached"].includes(t.status));
        setTrips(active);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load trips.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrips(true);

    // Auto-refresh every 3 seconds so new assignments show instantly without page refresh
    const interval = setInterval(() => {
      fetchTrips(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const [otpTripId, setOtpTripId] = useState(null);
  const [otpInput, setOtpInput] = useState("");

  const updateStatus = async (tripId, status, otp = null) => {
    setUpdating(tripId);
    setError("");
    try {
      const res = await fetch(`${API_URL}/driver/trips/${tripId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, otp })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }
      setToast(`Trip marked as "${status}" successfully!`);
      setTimeout(() => setToast(""), 3000);
      setOtpTripId(null);
      setOtpInput("");
      fetchTrips();
    } catch (err) {
      setError(err.message || "Failed to update trip status.");
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dt) => new Date(dt).toLocaleString("en-IN", {
    dateStyle: "medium", timeStyle: "short"
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>Assigned Trips</h2>
        <p style={{ color: "var(--text-muted)" }}>View and manage your upcoming and active trips.</p>
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

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          Loading trips...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {trips.length > 0 ? trips.map(trip => (
            <div key={trip.id} className="glass-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "18px", fontWeight: "700" }}>{trip.customerName}</span>
                    <span style={{
                      padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                      backgroundColor: trip.status === "In Progress" ? "var(--status-inprogress-bg)" : "var(--status-confirmed-bg)",
                      color: trip.status === "In Progress" ? "var(--status-inprogress)" : "var(--status-confirmed)"
                    }}>
                      {trip.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", color: "var(--text-muted)", fontSize: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaMapMarkerAlt color="var(--color-primary)" />
                      {trip.pickupLocation} → {trip.dropLocation}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaCalendarAlt color="var(--color-secondary)" />
                      {formatDate(trip.pickupDateTime)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", color: "#1e293b" }}>
                      <FaRupeeSign color="#10b981" />
                      Fare: ₹{trip.fareEstimated?.toLocaleString("en-IN")}
                    </div>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: "800",
                      border: "1px solid #86efac"
                    }}>
                      💰 Your Earning: ₹{Math.round((trip.fareEstimated || 0) * 0.85).toLocaleString("en-IN")} (85%)
                    </div>
                  </div>
                  {trip.notes && (
                    <div style={{ marginTop: "10px", fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Note: {trip.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                  {["Confirmed", "Driver Assigned", "Vehicle Assigned", "Trip Scheduled"].includes(trip.status) && (
                    <button
                      className="btn btn-start"
                      style={{ padding: "10px 18px" }}
                      disabled={updating === trip.id}
                      onClick={() => {
                        setOtpTripId(trip.id);
                        setOtpInput("");
                        setError("");
                      }}
                    >
                      <FaPlay /> {updating === trip.id ? "Updating..." : "Start Trip"}
                    </button>
                  )}
                  {trip.status === "Trip Started" && (
                    <button
                      className="btn btn-warning"
                      style={{ padding: "10px 18px" }}
                      disabled={updating === trip.id}
                      onClick={() => updateStatus(trip.id, "Customer Picked Up")}
                    >
                      👤 {updating === trip.id ? "Updating..." : "Customer Picked Up"}
                    </button>
                  )}
                  {trip.status === "Customer Picked Up" && (
                    <button
                      className="btn btn-indigo"
                      style={{ padding: "10px 18px" }}
                      disabled={updating === trip.id}
                      onClick={() => updateStatus(trip.id, "Ongoing")}
                    >
                      🚖 {updating === trip.id ? "Updating..." : "Trip Ongoing"}
                    </button>
                  )}
                  {["Ongoing", "In Progress"].includes(trip.status) && (
                    <button
                      className="btn btn-warning"
                      style={{ padding: "10px 18px" }}
                      disabled={updating === trip.id}
                      onClick={() => updateStatus(trip.id, "Destination Reached")}
                    >
                      📍 {updating === trip.id ? "Updating..." : "Destination Reached"}
                    </button>
                  )}
                  {trip.status === "Destination Reached" && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>
                        Collect Fare: ₹{trip.fareEstimated || 1850}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-success"
                          style={{ padding: "8px 12px", backgroundColor: "#10b981", color: "#fff", fontSize: '12px' }}
                          disabled={updating === trip.id}
                          onClick={async () => {
                            await fetch(`${API_URL}/driver/bookings/${trip.id}/payment-status`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ paymentStatus: 'PAID', paymentMethod: 'CASH' })
                            });
                            updateStatus(trip.id, "Completed");
                          }}
                        >
                          💵 Cash Received
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "8px 12px", backgroundColor: "#2563eb", color: "#fff", fontSize: '12px' }}
                          disabled={updating === trip.id}
                          onClick={async () => {
                            await fetch(`${API_URL}/driver/bookings/${trip.id}/payment-status`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ paymentStatus: 'PAID', paymentMethod: 'GPAY' })
                            });
                            updateStatus(trip.id, "Completed");
                          }}
                        >
                          📱 GPay Received
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="glass-panel" style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)" }}>
              You have no assigned trips at the moment.
            </div>
          )}
        </div>
      )}

      {/* OTP Verification Modal */}
      {otpTripId && (
        <div className="modal-overlay" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "400px", padding: "28px", textAlign: "center" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>
              🔑 Enter Customer OTP
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>
              Ask customer for the 4-digit OTP displayed on their booking confirmation to verify and start the trip.
            </p>

            <input
              type="text"
              maxLength={4}
              placeholder="e.g. 1234"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "24px",
                fontWeight: "800",
                letterSpacing: "8px",
                textAlign: "center",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                backgroundColor: "rgba(0,0,0,0.3)",
                color: "#fff",
                marginBottom: "20px"
              }}
              autoFocus
            />

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setOtpTripId(null); setOtpInput(""); }}
              >
                Cancel
              </button>
              <button
                className="btn btn-start"
                style={{ flex: 1 }}
                disabled={otpInput.length !== 4 || updating === otpTripId}
                onClick={() => updateStatus(otpTripId, "Trip Started", otpInput)}
              >
                {updating === otpTripId ? "Verifying..." : "Verify & Start"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}