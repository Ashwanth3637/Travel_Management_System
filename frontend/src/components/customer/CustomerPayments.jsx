import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function CustomerPayments({ token, customer, onPaymentComplete }) {
  const API_URL = "http://localhost:5001/api";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI_QR');
  const [activePaymentTab, setActivePaymentTab] = useState('LIVE');

  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [gpayUpiId, setGpayUpiId] = useState('ashwanth.gpay@okaxis');
  const [gpayMerchantName, setGpayMerchantName] = useState('Ashwanth (TravelGo)');
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchBookings = async (isInitial = false) => {
    if (!customer) return;
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(`${API_URL}/customer/bookings?customerName=${encodeURIComponent(customer.name)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
      }
    } catch (err) {
      console.error("Failed to fetch customer bookings for payments", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(true);
    const interval = setInterval(() => fetchBookings(false), 2000);
    return () => clearInterval(interval);
  }, [customer, token]);

  useEffect(() => {
    if (pendingPaymentBookings.length > 0 && (!selectedBooking || !pendingPaymentBookings.some(b => b.id === selectedBooking.id))) {
      setSelectedBooking(pendingPaymentBookings[0]);
    }
  }, [bookings]);

  const isPaid = (b) => {
    if (!b.paymentStatus) return false;
    const s = String(b.paymentStatus).toUpperCase().trim();
    return s === 'PAID' || s === 'CONFIRMED' || s === 'DRIVER CONFIRMED' || s === 'CONFIRMED_BY_DRIVER';
  };

  const pendingPaymentBookings = bookings.filter(b => {
    const status = (b.status || '').trim();
    const isCompletedOrEnded = [
      "Destination Reached",
      "Reached",
      "Trip Ended",
      "Ended",
      "Completed",
      "Trip Completed"
    ].some(s => s.toLowerCase() === status.toLowerCase());

    return isCompletedOrEnded && !isPaid(b);
  });

  const paidBookings = bookings.filter(b => isPaid(b));

  const handleLaunchMobileUPI = () => {
    if (!selectedBooking) return;
    const amount = selectedBooking.fareEstimated || 1850;
    const upiUrl = `upi://pay?pa=${encodeURIComponent(gpayUpiId)}&pn=${encodeURIComponent(gpayMerchantName)}&am=${amount}&cu=INR&tn=Booking_${selectedBooking.id}`;
    try {
      const a = document.createElement('a');
      a.href = upiUrl;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 1000);
    } catch (e) {
      console.log('Mobile UPI trigger error:', e);
    }
  };

  const handleOpenPaymentFlow = () => {
    if (!selectedBooking) return;
    if (paymentMethod === 'UPI_QR') {
      handleLaunchMobileUPI();
      setShowGatewayModal(true);
    } else if (paymentMethod === 'Cash') {
      executePaymentBackend();
    }
  };

  const executePaymentBackend = async () => {
    if (!selectedBooking) return;
    try {
      setProcessing(true);
      setErrorMsg("");

      await new Promise(resolve => setTimeout(resolve, 1500));

      const activeToken = token || sessionStorage.getItem('customerToken') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken && activeToken !== "null" && activeToken !== "undefined") {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch(`${API_URL}/customer/pay`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          paymentMethod: paymentMethod === 'Net Banking' ? `Net Banking (${selectedBank})` : paymentMethod,
          bankName: paymentMethod === 'Net Banking' ? selectedBank : ''
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPaymentSuccess(data.payment || {
          paymentId: 'PAY' + Math.floor(100000 + Math.random() * 900000),
          transactionId: paymentMethod === 'Net Banking'
            ? `NB${new Date().toISOString().slice(0,10).replace(/-/g,'')}0001`
            : 'TXN' + Math.floor(100000 + Math.random() * 900000),
          amount: selectedBooking.fareEstimated || 1850,
          paymentMethod: paymentMethod === 'Net Banking' ? `Net Banking` : paymentMethod,
          bankName: paymentMethod === 'Net Banking' ? selectedBank : '',
          paymentDate: new Date().toLocaleDateString('en-GB')
        });
        setShowGatewayModal(false);
        fetchBookings();
        if (onPaymentComplete) onPaymentComplete();
      } else {
        setErrorMsg(data.error || "Payment failed to process.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMsg("Failed to connect to payment server.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in text-left max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="bg-white px-7 py-5 rounded-2xl shadow-sm border border-slate-200 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-[22px] font-extrabold m-0 text-slate-800">
            💳 Trip Fare Payment
          </h2>
          <p className="text-slate-500 text-[13.5px] m-0">
            Pay via UPI QR Code (GPay, PhonePe, Paytm, all UPI apps) or Cash in Hand
          </p>
        </div>
      </div>

      {/* Payment Success Receipt Display */}
      {paymentSuccess && (
        <div className="bg-white rounded-2xl p-7 border-2 border-emerald-500 shadow-xl mb-7 text-center">
          <div className="text-5xl mb-2">✅</div>
          <h3 className="text-2xl font-black text-emerald-500 m-0 mb-4">
            Payment Successful
          </h3>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-5 rounded-xl text-left max-w-[500px] mx-auto mb-5 border border-slate-200 text-sm">
            <div>
              <span className="text-slate-500 font-semibold block text-xs">Transaction ID</span>
              <strong className="text-sm text-blue-600 font-mono">
                {paymentSuccess.razorpayPaymentId || paymentSuccess.transactionId}
              </strong>
            </div>

            {paymentSuccess.bankName && (
              <div>
                <span className="text-slate-500 font-semibold block text-xs">Bank</span>
                <strong className="text-base text-slate-800">{paymentSuccess.bankName}</strong>
              </div>
            )}

            <div>
              <span className="text-slate-500 font-semibold block text-xs">Amount Paid</span>
              <strong className="text-lg text-emerald-500">₹{paymentSuccess.amount?.toLocaleString('en-IN')}</strong>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-xs">Payment Method</span>
              <strong className="text-sm text-slate-800">{paymentSuccess.paymentMethod}</strong>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-xs">Status</span>
              <span className="px-2.5 py-1 rounded-lg bg-green-100 text-green-800 font-extrabold text-xs inline-block">
                SUCCESS ✅
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-xs">Date</span>
              <strong className="text-xs text-slate-600">{paymentSuccess.paymentDate}</strong>
            </div>
          </div>

          <button
            onClick={() => { setPaymentSuccess(null); setSelectedBooking(null); }}
            className="px-6 py-2.5 bg-blue-600 text-white font-extrabold rounded-lg border-none cursor-pointer hover:bg-blue-700 transition"
          >
            Done / Close Receipt
          </button>
        </div>
      )}

      {/* Payment Category Navigation Tabs */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setActivePaymentTab('LIVE')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-sm transition cursor-pointer flex items-center gap-2 ${
              activePaymentTab === 'LIVE'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>🔴 Live Payments Due</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-900 font-extrabold">
              {pendingPaymentBookings.length}
            </span>
          </button>

          <button
            onClick={() => setActivePaymentTab('COMPLETED')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-sm transition cursor-pointer flex items-center gap-2 ${
              activePaymentTab === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>✅ Completed Payments</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-900 font-extrabold">
              {paidBookings.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => fetchBookings(true)}
          className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-extrabold cursor-pointer hover:bg-blue-100 transition flex items-center gap-1.5"
        >
          🔄 Refresh Status
        </button>
      </div>

      {/* LIVE PAYMENTS TAB */}
      {activePaymentTab === 'LIVE' && (
        <div className={`grid gap-6 ${selectedBooking ? 'grid-cols-1 md:grid-cols-[1fr_1.2fr]' : 'grid-cols-1'}`}>
          {/* Pending Fares List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-extrabold m-0 mb-4 text-slate-800 flex items-center gap-2">
              <span>⌛ Trips Pending Payment</span>
              <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800">
                {pendingPaymentBookings.length} PENDING
              </span>
            </h3>

            {loading ? (
              <p className="text-slate-500 text-sm">Loading trip details...</p>
            ) : pendingPaymentBookings.length === 0 ? (
              <div className="text-center p-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div className="text-4xl mb-2">🚗</div>
                <strong className="text-base text-slate-800 block">No Fares Due For Payment</strong>
                <p className="mt-1.5 m-0 text-xs text-slate-500 leading-relaxed">
                  Trip fares appear here for payment <strong>only after your driver ends the trip / reaches your destination!</strong>
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingPaymentBookings.map(b => (
                  <div
                    key={b.id}
                    onClick={() => { setSelectedBooking(b); setPaymentSuccess(null); }}
                    className={`p-4 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                      selectedBooking?.id === b.id ? 'border-2 border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-sm text-slate-800">
                        Booking #{b.id} ({b.vehicleType})
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        📍 {b.pickupLocation} → {b.dropLocation}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-blue-600">
                        ₹{(b.fareEstimated || 1850).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        Pay Due
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Details Panel */}
          {selectedBooking && (
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-600 shadow-md">
              <h3 className="text-lg font-extrabold m-0 mb-4 text-slate-800">
                Payment for Booking #{selectedBooking.id}
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl mb-4 text-xs font-semibold text-slate-700 space-y-1.5 border border-slate-200">
                <div className="text-sm font-black text-slate-900 border-b pb-2 mb-2 flex justify-between items-center">
                  <span>🚗 {selectedBooking.vehicleType} Trip Details</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-bold">
                    📍 Trip Ended / Reached
                  </span>
                </div>
                <div>📍 Pickup: <strong className="text-slate-800">{selectedBooking.pickupLocation}</strong></div>
                <div>🏁 Destination: <strong className="text-slate-800">{selectedBooking.dropLocation}</strong></div>
                {selectedBooking.travelDate && <div>📅 Travel Date: <strong>{selectedBooking.travelDate} ({selectedBooking.travelTime || 'Now'})</strong></div>}
                {selectedBooking.passengersCount && <div>👥 Passengers: <strong>{selectedBooking.passengersCount} Person(s)</strong></div>}
                <div className="mt-3 pt-2 border-t flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[11px]">Total Fare Due:</span>
                  <span className="text-2xl font-black text-blue-600">
                    ₹{(selectedBooking.fareEstimated || 1850).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('UPI_QR')}
                    className={`p-3 rounded-xl border text-xs font-extrabold cursor-pointer transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'UPI_QR' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>📱 UPI Scanner (GPay / PhonePe / Paytm)</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('Cash')}
                    className={`p-3 rounded-xl border text-xs font-extrabold cursor-pointer transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'Cash' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>💵 Cash in Hand</span>
                  </button>
                </div>
              </div>

              {/* Cash info banner */}
              {paymentMethod === 'Cash' && (
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 mb-4 text-xs font-bold text-amber-800 flex items-center gap-2">
                  <span className="text-base">💵</span>
                  <span>Pay the fare in cash to your driver. 15% admin commission will be auto-deducted from driver wallet.</span>
                </div>
              )}

              {errorMsg && (
                <div className="text-red-500 bg-red-50 p-2.5 rounded-lg text-xs mb-4 font-bold">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleOpenPaymentFlow}
                disabled={processing}
                className={`w-full p-4 text-white font-black text-base rounded-xl border-none transition ${
                  processing ? 'bg-slate-400 cursor-not-allowed' : paymentMethod === 'UPI_QR' ? 'bg-blue-600 hover:bg-blue-700 shadow-lg cursor-pointer' : 'bg-amber-500 hover:bg-amber-600 shadow-lg cursor-pointer'
                }`}
              >
                {processing
                  ? '⏳ Processing...'
                  : paymentMethod === 'UPI_QR'
                    ? '📱 Show UPI QR Code — Pay Now'
                    : '💵 Confirm Cash in Hand Payment'
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* COMPLETED PAYMENTS TAB */}
      {activePaymentTab === 'COMPLETED' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="text-lg font-extrabold m-0 mb-4 text-slate-800 flex items-center justify-between">
            <span>✅ Completed Payment Receipts</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold">
              {paidBookings.length} Total Settled
            </span>
          </h3>

          {paidBookings.length === 0 ? (
            <div className="text-center p-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <div className="text-4xl mb-2">🧾</div>
              <strong className="text-base text-slate-800 block">No Completed Payments Yet</strong>
              <p className="mt-1.5 m-0 text-xs text-slate-500">
                Completed payment records and transaction receipts will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {paidBookings.map(b => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center flex-wrap gap-3"
                >
                  <div>
                    <div className="font-extrabold text-[14.5px] text-slate-800">
                      Booking #{b.id} | {b.pickupLocation} → {b.dropLocation}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Method: <strong className="text-slate-700">{b.paymentMethod || 'UPI / Cash'}</strong> | Txn ID: <strong className="text-blue-600 font-mono">{b.transactionId || b.razorpayPaymentId || 'TXN_SETTLED'}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-emerald-600">
                      ₹{(b.fareEstimated || 1850).toLocaleString('en-IN')}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs">
                      PAID ✅
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NET BANKING / UPI MODAL FALLBACK */}
      {showGatewayModal && selectedBooking && createPortal(
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[999999]">
          <div className="w-[90%] max-w-[440px] bg-white rounded-3xl p-8 shadow-2xl border border-slate-300 text-left">
            <div className="text-center">
              <div className="flex justify-center gap-3 mb-4 flex-wrap">
                {[
                  { name: 'GPay', bg: 'bg-blue-600', emoji: '🟦' },
                  { name: 'PhonePe', bg: 'bg-purple-600', emoji: '🟪' },
                  { name: 'Paytm', bg: 'bg-cyan-500', emoji: '🔵' },
                  { name: 'Any UPI', bg: 'bg-amber-500', emoji: '📱' }
                ].map(app => (
                  <div key={app.name} className={`px-3 py-1 rounded-full ${app.bg} text-white text-xs font-extrabold`}>
                    {app.emoji} {app.name}
                  </div>
                ))}
              </div>

              <div className="text-xl font-black text-emerald-500 mb-4">
                ₹{(selectedBooking.fareEstimated || 1850).toLocaleString('en-IN')} — Scan to Pay
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-blue-600 mb-5 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(gpayUpiId)}%26pn=${encodeURIComponent(gpayMerchantName)}%26am=${selectedBooking.fareEstimated || 1850}%26cu=INR%26tn=TravelGo_Fare`}
                  alt="UPI Payment QR Code"
                  className="w-[200px] h-[200px] rounded-2xl shadow-md"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 mb-5 text-[13.5px]">
                <div className="font-extrabold text-blue-700 mb-1">UPI ID: <span className="font-mono text-blue-600">{gpayUpiId}</span></div>
                <div className="text-slate-600 font-semibold">Merchant: <strong className="text-slate-800">{gpayMerchantName}</strong></div>
              </div>

              <p className="text-slate-500 text-xs font-semibold mb-5">
                Open <strong>GPay / PhonePe / Paytm / Any UPI</strong> → Scan QR → Pay → Click below
              </p>

              <button
                onClick={executePaymentBackend}
                disabled={processing}
                className={`w-full p-4 text-white font-black text-base rounded-xl border-none shadow-lg transition ${
                  processing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 cursor-pointer'
                }`}
              >
                {processing ? '⏳ Confirming Payment...' : "✅ I've Paid — Confirm Payment"}
              </button>
            </div>

            <button
              onClick={() => setShowGatewayModal(false)}
              disabled={processing}
              className="mt-4 bg-transparent border-none text-slate-500 font-bold text-xs cursor-pointer w-full text-center hover:underline"
            >
              Cancel Payment
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default CustomerPayments;
