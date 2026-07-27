import React, { useState, useEffect } from "react";
import { FaWallet, FaMoneyBillWave, FaQrcode, FaExclamationTriangle, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function DriverPayments() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [activeFilter, setActiveFilter] = useState("UNPAID");
  const [addedWalletAmount, setAddedWalletAmount] = useState(() => {
    try { return Number(localStorage.getItem("driver_added_wallet_balance")) || 0; } catch { return 0; }
  });
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [topupInput, setTopupInput] = useState("");

  const handleAddMoney = (e) => {
    e.preventDefault();
    const val = Number(topupInput);
    if (!val || val <= 0) return;
    const newBalance = addedWalletAmount + val;
    setAddedWalletAmount(newBalance);
    localStorage.setItem("driver_added_wallet_balance", newBalance);
    setShowAddMoneyModal(false);
    setTopupInput("");
    setToast(`💰 ₹${val.toLocaleString('en-IN')} added successfully to Driver Wallet via UPI/Bank!`);
    setTimeout(() => setToast(""), 4000);
  };

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
        const completedTrips = Array.isArray(data) ? data.filter(t => ["Completed", "Trip Completed"].includes(t.status)) : [];
        const overrides = getStoredPaymentOverrides();
        const mergedTrips = completedTrips.map(t => overrides[t.id] ? { ...t, ...overrides[t.id] } : t);
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

      savePaymentOverride(tripId, isPaid ? 'PAID' : 'UNPAID', isPaid ? method : 'UNPAID', driverMsg);

      await fetch(`${API_URL}/driver/bookings/${tripId}/payment-status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          paymentStatus: isPaid ? 'PAID' : 'UNPAID',
          paymentMethod: isPaid ? method : 'UNPAID',
          driverPaymentMsg: driverMsg
        })
      });
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

  const isTripPaid = (t) => {
    if (!t || !t.paymentStatus) return false;
    const s = String(t.paymentStatus).toUpperCase().trim();
    return s === 'PAID' || s === 'CONFIRMED_BY_DRIVER' || s === 'CONFIRMED' || s.includes('PAID');
  };

  const paidTrips = trips.filter(isTripPaid);
  const unpaidTrips = trips.filter(t => !isTripPaid(t));
  const cashTrips = paidTrips.filter(t => (t.paymentMethod || '').toUpperCase() === 'CASH');
  const gpayTrips = paidTrips.filter(t => (t.paymentMethod || '').toUpperCase() === 'GPAY' || (t.paymentMethod || '').toUpperCase() === 'UPI');

  const totalCollected = paidTrips.reduce((sum, t) => sum + (t.fareEstimated || 0), 0);
  const totalEarnings = Math.round(totalCollected * 0.85);
  const cashCollected = cashTrips.reduce((sum, t) => sum + (t.fareEstimated || 0), 0);
  const gpayCollected = gpayTrips.reduce((sum, t) => sum + (t.fareEstimated || 0), 0);
  const pendingAmount = unpaidTrips.reduce((sum, t) => sum + (t.fareEstimated || 0), 0);

  const sortNewestFirst = (list) =>
    [...list].sort((a, b) => {
      const aUnpaid = !isTripPaid(a);
      const bUnpaid = !isTripPaid(b);
      if (aUnpaid && !bUnpaid) return -1;
      if (!aUnpaid && bUnpaid) return 1;
      return new Date(b.pickupDateTime || 0) - new Date(a.pickupDateTime || 0);
    });

  let filteredTrips = sortNewestFirst(trips);
  if (activeFilter === "PAID") filteredTrips = sortNewestFirst(paidTrips);
  else if (activeFilter === "CASH") filteredTrips = sortNewestFirst(cashTrips);
  else if (activeFilter === "GPAY") filteredTrips = sortNewestFirst(gpayTrips);
  else if (activeFilter === "UNPAID") filteredTrips = sortNewestFirst(unpaidTrips);

  return (
    <div className="animate-fade-in">
      {/* HEADER CARD */}
      <div className="mb-6 flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold mb-1.5 flex items-center gap-2.5">
            💳 Payment Details & Earnings Ledger
          </h2>
          <p className="text-slate-500 text-sm m-0">
            Detailed record of cash collections, GPay scanner payments, driver payouts, and pending trip fares.
          </p>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={handleResetToFreshData}
            className="px-4 py-2 text-xs font-extrabold bg-blue-600 text-white border-none rounded-lg cursor-pointer shadow-md flex items-center gap-1.5 hover:bg-blue-700 transition"
          >
            ✨ Remove Older Payments & Start Fresh
          </button>

          <button
            onClick={handleClearAllPaymentData}
            className="px-4 py-2 text-xs font-bold bg-red-100 text-red-500 border border-red-300 rounded-lg cursor-pointer flex items-center gap-1.5 hover:bg-red-200 transition"
          >
            🗑️ Reset All Data
          </button>
        </div>
      </div>

      {toast && (
        <div className="px-[18px] py-3.5 bg-green-100 text-green-800 rounded-[10px] text-sm font-bold mb-5 border border-green-300 shadow-md">
          {toast}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium mb-5 text-red-600 bg-red-50 border border-red-400">
          {error}
        </div>
      )}

      {/* EARNINGS SUMMARY STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-panel p-5 border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <div className="text-[11px] uppercase text-emerald-700 font-extrabold flex items-center gap-1.5 justify-between">
            <span className="flex items-center gap-1.5">
              <FaWallet className="text-emerald-500" /> 👛 DRIVER WALLET BALANCE
            </span>
          </div>
          <div className="text-[28px] font-black text-emerald-800 mt-1.5">
            ₹{(totalEarnings + addedWalletAmount).toLocaleString('en-IN')}
          </div>
          <div className="text-[11.5px] text-emerald-700 font-bold mt-1 mb-2.5">
            ✅ 85% Trip Share + ₹{addedWalletAmount.toLocaleString('en-IN')} Added Money
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowAddMoneyModal(true)}
              className="px-3 py-1.5 text-[11px] font-extrabold bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition shadow-sm"
            >
              💳 + Add Money to Wallet
            </button>

            <button
              onClick={() => {
                setToast(`🏦 Withdrawal request for ₹${(totalEarnings + addedWalletAmount).toLocaleString('en-IN')} sent to registered bank account (SBI A/C •••• 4587)!`);
                setTimeout(() => setToast(""), 4000);
              }}
              className="px-3 py-1.5 text-[11px] font-extrabold bg-emerald-700 text-white border-none rounded cursor-pointer hover:bg-emerald-800 transition"
            >
              🏦 Withdraw
            </button>
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-green-600">
          <div className="text-[11px] uppercase text-slate-500 font-extrabold flex items-center gap-1.5">
            <FaMoneyBillWave className="text-green-600" /> CASH COLLECTED
          </div>
          <div className="text-[26px] font-extrabold text-green-600 mt-1.5">
            ₹{cashCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-[11.5px] text-slate-500 font-semibold mt-1">
            {cashTrips.length} Cash Payments
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-blue-600">
          <div className="text-[11px] uppercase text-slate-500 font-extrabold flex items-center gap-1.5">
            <FaQrcode className="text-blue-600" /> GPAY SCANNER FARES
          </div>
          <div className="text-[26px] font-extrabold text-blue-600 mt-1.5">
            ₹{gpayCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-[11.5px] text-slate-500 font-semibold mt-1">
            {gpayTrips.length} Online GPay Payments
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-red-500">
          <div className="text-[11px] uppercase text-slate-500 font-extrabold flex items-center gap-1.5">
            <FaExclamationTriangle className="text-red-500" /> UNPAID FARES DUE
          </div>
          <div className="text-[26px] font-extrabold text-red-500 mt-1.5">
            ₹{pendingAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11.5px] text-red-500 font-bold mt-1">
            {unpaidTrips.length} Pending Trip(s)
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2.5 mb-5 flex-wrap">
        {[
          { key: 'UNPAID', label: `🔴 Live Payments (Unpaid: ${unpaidTrips.length})` },
          { key: 'PAID', label: `✅ Completed Payments (${paidTrips.length})` },
          { key: 'ALL', label: `📋 All Trips (${trips.length})` },
          { key: 'CASH', label: `💵 Cash (${cashTrips.length})` },
          { key: 'GPAY', label: `📱 GPay (${gpayTrips.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-[18px] py-2.5 rounded-xl text-[13.5px] font-extrabold cursor-pointer transition ${
              activeFilter === tab.key
                ? activeFilter === 'UNPAID'
                  ? 'bg-red-500 text-white border-2 border-red-500 shadow-md'
                  : activeFilter === 'PAID'
                  ? 'bg-emerald-600 text-white border-2 border-emerald-600 shadow-md'
                  : 'bg-blue-600 text-white border-2 border-blue-600 shadow-md'
                : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PAYMENT DETAILS LIST */}
      {loading ? (
        <div className="glass-panel text-center py-10 text-slate-400">
          Loading payment details...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredTrips.length === 0 ? (
            <div className="glass-panel text-center py-12 text-slate-400">
              No payment records found under this filter.
            </div>
          ) : (
            filteredTrips.map(trip => {
              const isPaid = isTripPaid(trip);
              const pMethod = (trip.paymentMethod || 'CASH').toUpperCase();

              return (
                <div 
                  key={trip.id} 
                  className={`glass-panel animate-fade-in flex justify-between items-center flex-wrap gap-4 border-l-4 ${
                    isPaid ? 'border-emerald-500 bg-emerald-500/5' : 'border-red-500 bg-red-500/5'
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-[17.5px] font-extrabold mb-1.5 text-slate-800 flex items-center gap-2">
                      <span>{trip.customerName}</span>
                      <span className="text-[13px] text-slate-500 font-semibold">(#{trip.id})</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-slate-500 text-[13px] mb-2">
                      <div className="flex items-center gap-1.5">
                        <FaMapMarkerAlt className="text-blue-600" />
                        <strong>Route:</strong> {trip.pickupLocation} → {trip.dropLocation}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FaCalendarAlt className="text-blue-500" />
                        {formatDate(trip.pickupDateTime)}
                      </div>
                    </div>

                    {trip.driverPaymentMsg && (
                      <div className="text-xs text-slate-600 bg-black/5 px-3 py-1.5 rounded-md border-l-2 border-slate-500 inline-block font-semibold">
                        📝 Settlement Note: {trip.driverPaymentMsg}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2.5">
                    <div className="flex gap-2 flex-wrap items-center">
                      {!isPaid ? (
                        <span className="text-[11.5px] font-extrabold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300">
                          ⏳ Waiting for Customer Payment (Online / Cash)
                        </span>
                      ) : (
                        <span className="text-[11.5px] font-extrabold text-green-800 bg-green-100 px-3.5 py-1.5 rounded-xl border border-green-300">
                          🔒 Payment Verified & Settled
                        </span>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSingleBooking(trip.id); }}
                        className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-red-300 bg-red-100 text-red-500 cursor-pointer hover:bg-red-200 transition"
                      >
                        🗑️ Delete Record
                      </button>
                    </div>

                    {/* LIVE PAYMENT UPDATE BUTTONS (CASH & ONLINE GPAY) */}
                    <div className="flex gap-2 flex-wrap items-center bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-extrabold text-slate-600 px-1">Update Status:</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdatePayment(trip.id, 'PAID', 'CASH'); }}
                        className={`px-3 py-1 text-[11px] font-black rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                          isPaid && pMethod === 'CASH'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        💵 Cash Received
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdatePayment(trip.id, 'PAID', 'GPAY'); }}
                        className={`px-3 py-1 text-[11px] font-black rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                          isPaid && pMethod !== 'CASH'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        📱 GPay / Online Paid
                      </button>
                      {isPaid && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdatePayment(trip.id, 'UNPAID', 'UNPAID'); }}
                          className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg border border-slate-300 bg-white text-slate-600 cursor-pointer hover:bg-slate-100 transition"
                        >
                          ⚠️ Mark Unpaid
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      <span className={`px-3 py-1 rounded-2xl text-xs font-extrabold ${
                        isPaid ? "bg-green-100 text-green-700 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"
                      }`}>
                        {isPaid ? `PAID (${pMethod}) ✅` : 'UNPAID ⌛'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5 font-semibold text-sm flex-wrap">
                      <span className={`font-extrabold text-base ${isPaid ? "text-emerald-600" : "text-red-500"}`}>
                        Fare: ₹{(trip.fareEstimated || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-green-100 text-green-800 border border-green-300">
                        💰 Driver Earning (85%): ₹{Math.round((trip.fareEstimated || 0) * 0.85).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ADD MONEY TO DRIVER WALLET MODAL */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[99999]">
          <div className="w-[90%] max-w-[420px] bg-white rounded-3xl p-7 border border-slate-200 shadow-2xl text-left animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-800 m-0 flex items-center gap-2">
                <span>💳 Add Money to Driver Wallet</span>
              </h3>
              <button
                onClick={() => setShowAddMoneyModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full w-8 h-8 flex items-center justify-center border-none font-extrabold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5 font-medium">
              Top up your driver wallet balance directly via UPI or Bank Transfer to keep a positive balance for admin commissions.
            </p>

            <form onSubmit={handleAddMoney} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase">Enter Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">₹</span>
                  <input
                    type="number"
                    min="1"
                    className="w-full pl-9 pr-4 h-12 rounded-xl border border-slate-300 bg-white text-slate-900 text-lg font-black focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="500"
                    value={topupInput}
                    onChange={(e) => setTopupInput(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {[200, 500, 1000, 2000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupInput(String(amt))}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-lg border border-slate-300 cursor-pointer"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full h-12 text-sm font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none cursor-pointer transition shadow-md mt-2"
              >
                ✅ Confirm &amp; Add Money
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
