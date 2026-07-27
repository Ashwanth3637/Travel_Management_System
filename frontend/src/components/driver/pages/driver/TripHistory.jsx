import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";

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
    fetch(`${API_URL}/driver/trips`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setTrips(data.filter(t => (t.status === "Completed" || t.status === "Cancelled") && !isPaidBooking(t)));
        setLoading(false);
      })
      .catch(() => { setError("Failed to load trip history."); setLoading(false); });
  };

  useEffect(() => { loadTrips(); }, []);

  const handleUpdatePayment = async (tripId, status, method) => {
    try {
      setError("");
      const isPaid = status === 'PAID';
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== "null" && token !== "undefined") headers['Authorization'] = `Bearer ${token}`;
      const driverMsg = isPaid
        ? `Driver confirmed: Customer PAID via ${method === 'GPAY' ? 'GPay Scanner' : 'Cash in Hand'}.`
        : `Driver confirmed: Customer HAS NOT PAID yet.`;
      const res = await fetch(`${API_URL}/driver/bookings/${tripId}/payment-status`, {
        method: 'PUT', headers,
        body: JSON.stringify({ paymentStatus: isPaid ? 'PAID' : 'UNPAID', paymentMethod: isPaid ? method : 'UNPAID', driverPaymentMsg: driverMsg })
      });
      const data = await res.json();
      if (res.ok) {
        setToast(isPaid ? `✅ Payment for #${tripId} marked as ${method} Received & Saved!` : `⚠️ Payment for #${tripId} marked as NOT Received.`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setToast(""), 5000);
        setTrips(prev => prev.filter(t => t.id !== tripId));
      } else {
        setError(data.error || "Failed to update payment status.");
      }
    } catch (err) { console.error(err); setError("Failed to update payment status."); }
  };

  const handleMarkAllPaid = async () => {
    if (!window.confirm('Mark all pending trip fares as Cash Paid and move to Payment Details?')) return;
    try {
      setLoading(true);
      for (const trip of trips.filter(t => t.paymentStatus !== 'PAID')) {
        await fetch(`${API_URL}/driver/bookings/${trip.id}/payment-status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paymentStatus: 'PAID', paymentMethod: 'CASH', driverPaymentMsg: 'Bulk verified & marked Cash Paid by driver' })
        });
      }
      setToast('✅ All pending trip fares marked as Cash Paid and stored in Payment Details!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTrips([]);
      setTimeout(() => setToast(""), 5000);
    } catch (err) { console.error(err); setError("Failed to clear pending trip fares."); }
    finally { setLoading(false); }
  };

  const formatDate = (dt) => new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const pendingTrips = trips.filter(t => t.paymentStatus !== 'PAID');

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold mb-2">⌛ Pending Trip Fares</h2>
          <p className="text-slate-500 m-0">
            Pending fare collections. Tapping <strong>Mark Cash Paid</strong> or <strong>Mark GPay Paid</strong> saves &amp; moves the payment into your <strong>Payment Details</strong> section.
          </p>
        </div>
        {pendingTrips.length > 0 && (
          <button onClick={handleMarkAllPaid}
            className="flex items-center gap-2 px-[18px] py-2.5 text-[13px] font-extrabold bg-emerald-500 text-white border-none rounded-[10px] cursor-pointer hover:bg-emerald-600 transition"
            style={{ boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
            ⚡ Mark All Paid & Clear Pending ({pendingTrips.length})
          </button>
        )}
      </div>

      {toast && (
        <div className="px-[18px] py-3.5 bg-green-100 text-green-800 rounded-[10px] text-sm font-bold mb-5 border border-green-300"
          style={{ boxShadow: '0 4px 12px rgba(22,163,74,0.2)' }}>{toast}</div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium mb-5 text-red-600 bg-red-50 border border-red-400">{error}</div>
      )}

      {loading ? (
        <div className="glass-panel text-center py-10 text-slate-400">Loading pending fares...</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-extrabold text-red-500 m-0 flex items-center gap-2">🚨 Pending Fare Collection Required</h3>
            <span className="badge badge-cancelled text-xs px-3 py-1 bg-red-100 text-red-500">{pendingTrips.length} Pending</span>
          </div>

          {pendingTrips.length === 0 ? (
            <div className="glass-panel text-center py-14 text-green-700 bg-green-50 border border-green-200">
              <div className="text-[36px] mb-2.5">🎉</div>
              <div className="text-lg font-extrabold mb-1">All Completed Trip Fares Collected!</div>
              <p className="text-[13.5px] text-green-600 m-0">
                All paid fare details are safely stored in your <strong>Payment Details</strong> section in the sidebar.
              </p>
            </div>
          ) : (
            pendingTrips.map(trip => (
              <div key={trip.id} className="glass-panel animate-fade-in flex justify-between items-center flex-wrap gap-4"
                style={{ borderLeft: '5px solid #ef4444' }}>
                <div className="flex-1">
                  <div className="text-[17.5px] font-extrabold mb-1.5 text-slate-800">
                    {trip.customerName} <span className="text-[13px] text-slate-400 font-medium">(#{trip.id})</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-slate-500 text-[13px]">
                    <div className="flex items-center gap-1.5">
                      <FaMapMarkerAlt color="#2563eb" />
                      {trip.pickupLocation} → {trip.dropLocation}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaCalendarAlt color="#3b82f6" />
                      {formatDate(trip.pickupDateTime)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1.5 items-center">
                    <div className={`px-3 py-1 rounded-full text-[13px] font-semibold ${trip.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {trip.status}
                    </div>
                    <span className="px-3 py-1 rounded-2xl text-xs font-extrabold bg-red-100 text-red-800 border border-red-300">UNPAID ⌛</span>
                  </div>
                  <div className="flex items-center gap-3.5 font-semibold text-sm flex-wrap">
                    <span className="text-red-500 font-extrabold text-[15px]">Fare Due: ₹{trip.fareEstimated?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <button onClick={(e) => { e.stopPropagation(); handleUpdatePayment(trip.id, 'PAID', 'CASH'); }}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-[10px] border-none bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600 transition"
                      style={{ boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
                      💵 Mark Cash Paid
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleUpdatePayment(trip.id, 'PAID', 'GPAY'); }}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-[10px] border-none bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition"
                      style={{ boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
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
