import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaCalendarAlt, FaStar, FaRupeeSign } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function TripHistory() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const token = localStorage.getItem("token");

  const isPaidBooking = (b) => {
    if (!b) return false;
    const status = (b.paymentStatus || '').toUpperCase();
    return status === 'PAID' || status === 'CONFIRMED_BY_DRIVER' || status.includes('PAID');
  };

  const loadTrips = () => {
    fetch(`${API_URL}/driver/trips`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        // Strictly filter out all completed/paid trips so Trip History shows ONLY unpaid/pending fares
        const pendingHistory = data.filter(t => 
          (t.status === "Completed" || t.status === "Cancelled") && 
          !isPaidBooking(t)
        );
        setTrips(pendingHistory);
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

  const handleUpdatePayment = async (tripId, status, method) => {
    try {
      setError("");
      const isPaid = status === 'PAID';
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== "null" && token !== "undefined") {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const driverMsg = isPaid 
        ? `Driver confirmed: Customer PAID via ${method === 'GPAY' ? 'GPay Scanner' : 'Cash in Hand'}.`
        : `Driver confirmed: Customer HAS NOT PAID yet.`;

      const res = await fetch(`${API_URL}/driver/bookings/${tripId}/payment-status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          paymentStatus: isPaid ? 'PAID' : 'UNPAID',
          paymentMethod: isPaid ? method : 'UNPAID',
          driverPaymentMsg: driverMsg
        })
      });
      const data = await res.json();
      if (res.ok) {
        setToast(isPaid ? `✅ Payment for #${tripId} marked as ${method} Received & Saved to Payment Details!` : `⚠️ Payment for #${tripId} marked as NOT Received.`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setToast(""), 5000);
        // Continuously & immediately remove paid trip card from Trip History view
        setTrips(prev => prev.filter(t => t.id !== tripId));
      } else {
        setError(data.error || "Failed to update payment status.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update payment status.");
    }
  };

  const handleMarkAllPaid = async () => {
    if (!window.confirm('Are you sure you want to mark all pending trip fares as Cash Paid and move them to Payment Details?')) return;
    try {
      setLoading(true);
      const pendingList = trips.filter(t => t.paymentStatus !== 'PAID');
      for (const trip of pendingList) {
        await fetch(`${API_URL}/driver/bookings/${trip.id}/payment-status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            paymentStatus: 'PAID',
            paymentMethod: 'CASH',
            driverPaymentMsg: 'Bulk verified & marked Cash Paid by driver'
          })
        });
      }
      setToast('✅ All pending trip fares marked as Cash Paid and stored in Payment Details!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTrips([]);
      setTimeout(() => setToast(""), 5000);
    } catch (err) {
      console.error(err);
      setError("Failed to clear pending trip fares.");
    } finally {
      setLoading(false);
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

  const pendingTrips = trips.filter(t => t.paymentStatus !== 'PAID');

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "24px", display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>⌛ Pending Trip Fares</h2>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Pending fare collections. Tapping <strong>Mark Cash Paid</strong> or <strong>Mark GPay Paid</strong> saves & moves the payment into your <strong>Payment Details</strong> section.
          </p>
        </div>

        {pendingTrips.length > 0 && (
          <button
            onClick={handleMarkAllPaid}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '800',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ⚡ Mark All Paid & Clear Pending ({pendingTrips.length})
          </button>
        )}
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
          Loading pending fares...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚨 Pending Fare Collection Required
            </h3>
            <span className="badge badge-cancelled" style={{ fontSize: '12px', padding: '4px 12px', backgroundColor: '#fee2e2', color: '#ef4444' }}>
              {pendingTrips.length} Pending
            </span>
          </div>

          {pendingTrips.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: "center", padding: "50px 20px", color: "#166534", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>🎉</div>
              <div style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>All Completed Trip Fares Collected!</div>
              <p style={{ fontSize: "13.5px", color: "#15803d", margin: 0 }}>
                All paid fare details are safely stored in your <strong>Payment Details</strong> section in the sidebar.
              </p>
            </div>
          ) : (
            pendingTrips.map(trip => (
              <div 
                key={trip.id} 
                className="glass-panel animate-fade-in" 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  flexWrap: "wrap", 
                  gap: "16px",
                  borderLeft: '5px solid #ef4444'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "17.5px", fontWeight: "800", marginBottom: "6px", color: "#1e293b" }}>
                    {trip.customerName} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>(#{trip.id})</span>
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
                      padding: "4px 12px", borderRadius: "14px", fontSize: "12px", fontWeight: "800",
                      backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5"
                    }}>
                      UNPAID ⌛
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", fontWeight: "600", fontSize: "14px", flexWrap: "wrap" }}>
                    <span style={{ color: "#ef4444", fontWeight: '800', fontSize: '15px' }}>
                      Fare Due: ₹{trip.fareEstimated?.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Driver quick status update pills */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdatePayment(trip.id, 'PAID', 'CASH'); }}
                      style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '800', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      💵 Mark Cash Paid
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdatePayment(trip.id, 'PAID', 'GPAY'); }}
                      style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '800', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      📱 Mark GPay Paid
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}