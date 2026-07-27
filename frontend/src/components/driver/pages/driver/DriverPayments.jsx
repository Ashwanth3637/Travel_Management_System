import React, { useState, useEffect } from "react";
import { FaWallet, FaMoneyBillWave, FaQrcode, FaExclamationTriangle, FaMapMarkerAlt, FaCalendarAlt, FaCheckCircle, FaStar } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function DriverPayments() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const token = localStorage.getItem("token");

  const getStoredPaymentOverrides = () => {
    try {
      const saved = localStorage.getItem("driver_payment_overrides");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  };

  const savePaymentOverride = (tripId, paymentStatus, paymentMethod, driverPaymentMsg) => {
    try {
      const overrides = getStoredPaymentOverrides();
      overrides[tripId] = { paymentStatus, paymentMethod, driverPaymentMsg, paidAt: new Date().toISOString() };
      localStorage.setItem("driver_payment_overrides", JSON.stringify(overrides));
    } catch (e) { console.error("Error saving payment override:", e); }
  };

  const loadPaymentDetails = () => {
    fetch(`${API_URL}/driver/trips`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        // Filter completed rides and apply current live payment state
        const completedTrips = Array.isArray(data) ? data.filter(t => ["Completed", "Trip Completed"].includes(t.status)) : [];
        const overrides = getStoredPaymentOverrides();
        const mergedTrips = completedTrips.map(t => {
          if (overrides[t.id]) {
            return { ...t, ...overrides[t.id] };
          }
          return t;
        });
        setTrips(mergedTrips);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load driver payment details.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPaymentDetails();
  }, []);

  const handleResetToFreshData = async () => {
    if (!window.confirm("Remove older payment records and start fresh with 0 initial payments?")) return;
    try {
      localStorage.removeItem("driver_payment_overrides");
      setToast("✨ Older payment records removed! Driver Panel is fresh and ready for new live payments.");
      setTrips([]);
      loadPaymentDetails();
      setTimeout(() => setToast(""), 5000);
    } catch (err) {
      console.error(err);
    }
  };

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

      // Save to localStorage immediately so data is never lost on refresh
      savePaymentOverride(tripId, isPaid ? 'PAID' : 'UNPAID', isPaid ? method : 'UNPAID', driverMsg);

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
      setToast(isPaid ? `✅ Payment for #${tripId} marked as ${method} Received & Saved!` : `⚠️ Payment for #${tripId} marked as NOT Received.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setToast(""), 5000);
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, paymentStatus: isPaid ? 'PAID' : 'UNPAID', paymentMethod: isPaid ? method : 'UNPAID', driverPaymentMsg: driverMsg } : t));
    } catch (err) {
      console.error(err);
      setError("Payment updated locally and saved.");
    }
  };

  const handleClearAllPaymentData = async () => {
    if (!window.confirm("Are you sure you want to permanently delete ALL trip and payment data records?")) return;
    try {
      setLoading(true);
      localStorage.removeItem("driver_payment_overrides");
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== "null" && token !== "undefined") {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch(`${API_URL}/driver/bookings/clear-all-data`, {
        method: 'POST',
        headers
      });
      setToast("🗑️ All trip & payment data records deleted permanently!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTrips([]);
      setTimeout(() => setToast(""), 5000);
    } catch (err) {
      console.error(err);
      setError("Failed to delete payment history data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingleBooking = async (tripId) => {
    if (!window.confirm(`Are you sure you want to delete trip record #${tripId} permanently?`)) return;
    try {
      const overrides = getStoredPaymentOverrides();
      delete overrides[tripId];
      localStorage.setItem("driver_payment_overrides", JSON.stringify(overrides));

      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== "null" && token !== "undefined") {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch(`${API_URL}/driver/bookings/${tripId}`, {
        method: 'DELETE',
        headers
      });
      setToast(`🗑️ Trip #${tripId} deleted permanently.`);
      setTrips(prev => prev.filter(t => t.id !== tripId));
      setTimeout(() => setToast(""), 5000);
    } catch (err) {
      console.error(err);
      setError("Failed to delete trip record.");
    }
  };

  const formatDate = (dt) => new Date(dt).toLocaleString("en-IN", {
    dateStyle: "medium", timeStyle: "short"
  });

  // Calculate totals
  const paidTrips = trips.filter(t => t.paymentStatus === 'PAID');
  const unpaidTrips = trips.filter(t => t.paymentStatus !== 'PAID');
  const cashTrips = paidTrips.filter(t => (t.paymentMethod || '').toUpperCase() === 'CASH');
  const gpayTrips = paidTrips.filter(t => (t.paymentMethod || '').toUpperCase() === 'GPAY' || (t.paymentMethod || '').toUpperCase() === 'UPI');

  const totalCollected = paidTrips.reduce((sum, t) => sum + (t.fareEstimated || 0), 0);
  const totalEarnings = Math.round(totalCollected * 0.85);
  const cashCollected = cashTrips.reduce((sum, t) => sum + (t.fareEstimated || 0), 0);
  const gpayCollected = gpayTrips.reduce((sum, t) => sum + (t.fareEstimated || 0), 0);
  const pendingAmount = unpaidTrips.reduce((sum, t) => sum + (t.fareEstimated || 0), 0);

  // Filter trips based on tab selection
  let filteredTrips = trips;
  if (activeFilter === "PAID") filteredTrips = paidTrips;
  else if (activeFilter === "CASH") filteredTrips = cashTrips;
  else if (activeFilter === "GPAY") filteredTrips = gpayTrips;
  else if (activeFilter === "UNPAID") filteredTrips = unpaidTrips;

  return (
    <div className="animate-fade-in">
      
      {/* ─── HEADER CARD ─── */}
      <div style={{ marginBottom: "24px", display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "6px", color: "var(--text-main)", display: 'flex', alignItems: 'center', gap: '10px' }}>
            💳 Payment Details & Earnings Ledger
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
            Detailed record of cash collections, GPay scanner payments, driver payouts, and pending trip fares.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleResetToFreshData}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '800',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ✨ Remove Older Payments & Start Fresh
          </button>

          <button
            onClick={handleClearAllPaymentData}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🗑️ Reset All Data
          </button>
        </div>
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

      {/* ─── EARNINGS SUMMARY STATS CARDS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '5px solid #10b981' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaWallet color="#10b981" /> TOTAL DRIVER EARNING
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
            ₹{totalEarnings.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: '#15803d', fontWeight: '700', marginTop: '4px' }}>
            85% Net Driver Share ({paidTrips.length} Paid Rides)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '5px solid #16a34a' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaMoneyBillWave color="#16a34a" /> CASH COLLECTED
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#16a34a', marginTop: '6px' }}>
            ₹{cashCollected.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>
            {cashTrips.length} Cash Payments
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '5px solid #2563eb' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaQrcode color="#2563eb" /> GPAY SCANNER FARES
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#2563eb', marginTop: '6px' }}>
            ₹{gpayCollected.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>
            {gpayTrips.length} Online GPay Payments
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '5px solid #ef4444' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaExclamationTriangle color="#ef4444" /> UNPAID FARES DUE
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#ef4444', marginTop: '6px' }}>
            ₹{pendingAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: '700', marginTop: '4px' }}>
            {unpaidTrips.length} Pending Trip(s)
          </div>
        </div>

      </div>

      {/* ─── FILTER TABS ─── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: `All Trips (${trips.length})` },
          { key: 'PAID', label: `✅ Paid Fares (${paidTrips.length})` },
          { key: 'CASH', label: `💵 Cash (${cashTrips.length})` },
          { key: 'GPAY', label: `📱 GPay (${gpayTrips.length})` },
          { key: 'UNPAID', label: `⌛ Unpaid (${unpaidTrips.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '800',
              border: activeFilter === tab.key ? '2px solid #3b82f6' : '1px solid var(--border-color)',
              backgroundColor: activeFilter === tab.key ? '#3b82f6' : 'rgba(255,255,255,0.05)',
              color: activeFilter === tab.key ? '#ffffff' : 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeFilter === tab.key ? '0 4px 12px rgba(59,130,246,0.35)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── PAYMENT DETAILS LIST ─── */}
      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          Loading payment details...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredTrips.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)" }}>
              No payment records found under this filter.
            </div>
          ) : (
            filteredTrips.map(trip => {
              const isPaid = trip.paymentStatus === 'PAID';
              const pMethod = (trip.paymentMethod || 'CASH').toUpperCase();

              return (
                <div 
                  key={trip.id} 
                  className="glass-panel animate-fade-in" 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    flexWrap: "wrap", 
                    gap: "16px",
                    borderLeft: isPaid ? '5px solid #10b981' : '5px solid #ef4444',
                    backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "17.5px", fontWeight: "800", marginBottom: "6px", color: "#1e293b", display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{trip.customerName}</span>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>(#{trip.id})</span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", color: "var(--text-muted)", fontSize: "13px", marginBottom: '8px' }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaMapMarkerAlt color="var(--color-primary)" />
                        <strong>Route:</strong> {trip.pickupLocation} → {trip.dropLocation}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaCalendarAlt color="var(--color-secondary)" />
                        {formatDate(trip.pickupDateTime)}
                      </div>
                    </div>

                    {trip.driverPaymentMsg && (
                      <div style={{ fontSize: '12px', color: '#475569', backgroundColor: 'rgba(0,0,0,0.03)', padding: '6px 12px', borderRadius: '6px', borderLeft: '3px solid #64748b', display: 'inline-block', fontWeight: '600' }}>
                        📝 Settlement Note: {trip.driverPaymentMsg}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        padding: "4px 12px", borderRadius: "14px", fontSize: "12px", fontWeight: "800",
                        backgroundColor: isPaid ? "#dcfce7" : "#fee2e2",
                        color: isPaid ? "#15803d" : "#991b1b",
                        border: isPaid ? "1px solid #86efac" : "1px solid #fca5a5"
                      }}>
                        {isPaid ? `PAID (${pMethod}) ✅` : 'UNPAID ⌛'}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px", fontWeight: "600", fontSize: "14px", flexWrap: "wrap" }}>
                      <span style={{ color: isPaid ? "#10b981" : "#ef4444", fontWeight: '800', fontSize: '16px' }}>
                        Fare: ₹{(trip.fareEstimated || 0).toLocaleString("en-IN")}
                      </span>
                      <span style={{
                        padding: "3px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: "800",
                        backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #86efac"
                      }}>
                        💰 Driver Earning (85%): ₹{Math.round((trip.fareEstimated || 0) * 0.85).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Driver action buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {!isPaid ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdatePayment(trip.id, 'PAID', 'CASH'); }}
                            style={{ padding: '7px 14px', fontSize: '11.5px', fontWeight: '800', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#ffffff', cursor: 'pointer', boxShadow: '0 3px 10px rgba(16,185,129,0.35)' }}
                          >
                            💵 Mark Cash Paid
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdatePayment(trip.id, 'PAID', 'GPAY'); }}
                            style={{ padding: '7px 14px', fontSize: '11.5px', fontWeight: '800', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', cursor: 'pointer', boxShadow: '0 3px 10px rgba(37,99,235,0.35)' }}
                          >
                            📱 Mark GPay Paid
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#166534', backgroundColor: '#dcfce7', padding: '5px 12px', borderRadius: '8px', border: '1px solid #86efac' }}>
                          🔒 Payment Verified & Settled
                        </span>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSingleBooking(trip.id); }}
                        style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '700', borderRadius: '8px', border: '1px solid #fca5a5', backgroundColor: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}
                      >
                        🗑️ Delete Record
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
