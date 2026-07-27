import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

  // Payment confirmation modal states
  const [payModalTrip, setPayModalTrip] = useState(null);
  const [driverPayMethod, setDriverPayMethod] = useState("CASH");
  const [driverMsgInput, setDriverMsgInput] = useState("");
  const [submittingPay, setSubmittingPay] = useState(false);

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
                  {["Destination Reached", "Completed", "Trip Completed"].includes(trip.status) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '13px', fontWeight: '900', color: '#2563eb' }}>
                        Fare: ₹{(trip.fareEstimated || 1850).toLocaleString('en-IN')}
                      </div>

                      {trip.paymentStatus === 'Paid' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '800', backgroundColor: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: '8px', border: '1px solid #86efac' }}>
                            Payment Received ✔ {trip.paymentMethod || 'Google Pay'}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '6px' }}>
                            🎉 Driver Net Earning (85%): ₹{Math.round((trip.fareEstimated || 1850) * 0.85).toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', backgroundColor: '#eef2ff', padding: '3px 8px', borderRadius: '6px' }}>
                            🏢 Admin Commission (15%): ₹{Math.round((trip.fareEstimated || 1850) * 0.15).toLocaleString('en-IN')}
                          </span>
                          {trip.status === "Destination Reached" && (
                            <button
                              className="btn btn-success"
                              style={{ padding: "8px 16px", backgroundColor: "#10b981", color: "#fff", fontSize: '12px', fontWeight: '800', borderRadius: '8px' }}
                              disabled={updating === trip.id}
                              onClick={() => updateStatus(trip.id, "Completed")}
                            >
                              🏁 Complete Ride
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11.5px', color: '#b45309', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '6px', fontWeight: '700' }}>
                            ⏳ Waiting for Customer Payment...
                          </span>
                          <button
                            style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '800', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', cursor: 'pointer' }}
                            onClick={async () => {
                              await fetch(`${API_URL}/driver/bookings/${trip.id}/payment-status`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ paymentStatus: 'Paid', paymentMethod: 'Cash', driverPaymentMsg: 'Cash Received by Driver' })
                              });
                              await updateStatus(trip.id, "Completed");
                            }}
                          >
                            💵 Cash Received
                          </button>
                        </div>
                      )}
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



      {/* OTP Verification Modal Portal (Renders at document.body level for full-screen coverage) */}
      {otpTripId && createPortal(
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999999
        }}>
          <div style={{
            width: "90%",
            maxWidth: "420px",
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            padding: "32px 28px",
            textAlign: "center",
            boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
            border: "1px solid #cbd5e1"
          }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔑</div>
            <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#1e293b", margin: "0 0 8px 0" }}>
              Enter Customer OTP
            </h3>
            <p style={{ color: "#64748b", fontSize: "13.5px", margin: "0 0 24px 0", lineHeight: "1.5" }}>
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
                padding: "16px",
                fontSize: "30px",
                fontWeight: "900",
                letterSpacing: "12px",
                textAlign: "center",
                borderRadius: "14px",
                border: "2px solid #2563eb",
                backgroundColor: "#f8fafc",
                color: "#1e293b",
                outline: "none",
                marginBottom: "24px",
                boxSizing: "border-box",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)"
              }}
              autoFocus
            />

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "700",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  cursor: "pointer"
                }}
                onClick={() => { setOtpTripId(null); setOtpInput(""); }}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "800",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: otpInput.length === 4 ? "#10b981" : "#cbd5e1",
                  color: "#ffffff",
                  cursor: otpInput.length === 4 ? "pointer" : "not-allowed",
                  boxShadow: otpInput.length === 4 ? "0 4px 15px rgba(16, 185, 129, 0.4)" : "none"
                }}
                disabled={otpInput.length !== 4 || updating === otpTripId}
                onClick={() => updateStatus(otpTripId, "Trip Started", otpInput)}
              >
                {updating === otpTripId ? "Verifying..." : "Verify & Start"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}