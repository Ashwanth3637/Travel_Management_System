import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function CustomerPayments({ token, customer, onPaymentComplete }) {
  const API_URL = "http://localhost:5001/api";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Google Pay'); // 'Cash', 'Google Pay', 'PhonePe / UPI', 'Credit / Debit Card'
  
  // Online Gateway & Custom GPay QR States
  const [gpayUpiId, setGpayUpiId] = useState('ashwanth.gpay@okaxis'); // Custom GPay UPI ID
  const [gpayMerchantName, setGpayMerchantName] = useState('Ashwanth (TravelGo)');
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchBookings = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/customer/bookings?customerName=${encodeURIComponent(customer.name)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error("Failed to fetch customer bookings for payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [customer, token]);

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
    if (paymentMethod === 'Cash') {
      // Direct cash payment processing
      executePaymentBackend();
    } else {
      // Launch mobile UPI deep link if on mobile, and open QR modal
      handleLaunchMobileUPI();
      setShowGatewayModal(true);
    }
  };

  const executePaymentBackend = async () => {
    if (!selectedBooking) return;
    try {
      setProcessing(true);
      setErrorMsg("");

      // Simulate 2-3 seconds processing delay for professional viva demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));

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
          paymentMethod
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPaymentSuccess(data.payment || {
          paymentId: 'PAY' + Math.floor(100000 + Math.random() * 900000),
          transactionId: 'TXN' + Math.floor(100000 + Math.random() * 900000),
          amount: selectedBooking.fareEstimated || 1850,
          paymentMethod,
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
    <div className="animate-fade-in" style={{ textAlign: 'left', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '20px 28px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#1e293b' }}>
            💳 Customer Payment Gateway
          </h2>
          <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0 }}>
            Select trip fare payment method (Cash, Google Pay, PhonePe/UPI, Credit/Debit Card)
          </p>
        </div>
      </div>

      {/* Payment Success Receipt Display */}
      {paymentSuccess && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          border: '2px solid #10b981',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
          marginBottom: '28px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
          <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', margin: '0 0 16px 0' }}>
            Payment Successful
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'left',
            maxWidth: '500px',
            margin: '0 auto 20px auto',
            border: '1px solid #e2e8f0',
            fontSize: '14px'
          }}>
            <div>
              <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '12px' }}>Transaction ID</span>
              <strong style={{ fontSize: '16px', color: '#2563eb' }}>{paymentSuccess.transactionId}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '12px' }}>Amount</span>
              <strong style={{ fontSize: '18px', color: '#10b981' }}>₹{paymentSuccess.amount?.toLocaleString('en-IN')}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '12px' }}>Method</span>
              <strong style={{ fontSize: '15px', color: '#1e293b' }}>{paymentSuccess.paymentMethod}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '12px' }}>Status</span>
              <span style={{ padding: '3px 10px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '800', fontSize: '12px' }}>
                PAID ✅
              </span>
            </div>
          </div>

          <button
            onClick={() => { setPaymentSuccess(null); setSelectedBooking(null); }}
            style={{
              padding: '10px 24px',
              backgroundColor: '#2563eb',
              color: '#fff',
              fontWeight: '800',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Done / Close Receipt
          </button>
        </div>
      )}

      {/* Main Grid: Pending Fare & Payment Options */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedBooking ? '1fr 1.2fr' : '1fr', gap: '24px' }}>
        
        {/* Pending Fares List */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⌛ Trips Pending Payment</span>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309' }}>
              {pendingPaymentBookings.length} PENDING
            </span>
          </h3>

          {loading ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>Loading trip details...</p>
          ) : pendingPaymentBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🚗</div>
              <strong style={{ fontSize: '15px', color: '#1e293b', display: 'block' }}>No Fares Due For Payment</strong>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                Trip fares appear here for payment <strong>only after your driver ends the trip / reaches your destination!</strong>
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingPaymentBookings.map(b => (
                <div
                  key={b.id}
                  onClick={() => { setSelectedBooking(b); setPaymentSuccess(null); }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: selectedBooking?.id === b.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: selectedBooking?.id === b.id ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b' }}>
                      Booking #{b.id} ({b.vehicleType})
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      📍 {b.pickupLocation} → {b.dropLocation}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#2563eb' }}>
                      ₹{(b.fareEstimated || 1850).toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '8px' }}>
                      Pay Due
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAYMENT DETAILS FORM */}
        {selectedBooking && !paymentSuccess && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            border: '2px solid #2563eb',
            boxShadow: '0 8px 30px rgba(37, 99, 235, 0.1)'
          }}>
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px' }}>
                PAYMENT DETAILS
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '900', margin: '4px 0 0 0', color: '#1e293b' }}>
                Confirm Fare Payment
              </h3>
            </div>

            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>Trip Fare</span>
              <strong style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>
                ₹{(selectedBooking.fareEstimated || 1850).toLocaleString('en-IN')}
              </strong>
            </div>

            {/* Payment Method Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                Select Payment Method
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { id: 'Cash', label: 'Cash', icon: '💵' },
                  { id: 'Google Pay', label: 'Google Pay', icon: '📱' },
                  { id: 'PhonePe', label: 'PhonePe', icon: '📲' },
                  { id: 'Card', label: 'Credit / Debit Card', icon: '💳' }
                ].map(item => (
                  <label
                    key={item.id}
                    onClick={() => setPaymentMethod(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: paymentMethod === item.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: paymentMethod === item.id ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '14px',
                      color: '#1e293b'
                    }}
                  >
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod === item.id}
                      onChange={() => setPaymentMethod(item.id)}
                      style={{ accentColor: '#2563eb', transform: 'scale(1.2)' }}
                    />
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: '700' }}>
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleOpenPaymentFlow}
              disabled={processing}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                fontWeight: '900',
                fontSize: '16px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              {processing ? "Processing..." : "Proceed to Pay"}
            </button>
          </div>
        )}

      </div>

      {/* Paid History Ledger */}
      {paidBookings.length > 0 && (
        <div style={{ marginTop: '32px', backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px 0', color: '#1e293b' }}>
            ✅ Payment Receipt History ({paidBookings.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {paidBookings.map(b => (
              <div
                key={b.id}
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: '800', fontSize: '14.5px', color: '#1e293b' }}>
                    Booking #{b.id} | {b.pickupLocation} → {b.dropLocation}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Method: <strong>{b.paymentMethod || 'Google Pay'}</strong> | Txn ID: <strong style={{ color: '#2563eb' }}>{b.transactionId || 'TXN857421'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#10b981' }}>
                    ₹{(b.fareEstimated || 1850).toLocaleString('en-IN')}
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '800', fontSize: '12px' }}>
                    Paid ✅
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── STEP 3: COLLEGE FINAL YEAR PROJECT RECOMMENDED POPUP ─── */}
      {showGatewayModal && selectedBooking && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999
        }}>
          <div style={{
            width: '90%',
            maxWidth: '420px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '32px 28px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            border: '1px solid #cbd5e1',
            textAlign: 'center'
          }}>
            
            {/* Title & App Icon */}
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>
              {paymentMethod === 'Google Pay' ? '📱' : paymentMethod === 'PhonePe' ? '📲' : '💳'}
            </div>
            
            <h3 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#1e293b' }}>
              {paymentMethod}
            </h3>

            <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981', marginBottom: '20px' }}>
              Amount : ₹{(selectedBooking.fareEstimated || 1850).toLocaleString('en-IN')}
            </div>

            {/* QR Code Section */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '20px',
              borderRadius: '16px',
              border: '1px dashed #2563eb',
              marginBottom: '24px'
            }}>
              <p style={{ color: '#475569', fontSize: '14px', fontWeight: '700', margin: '0 0 14px 0' }}>
                Scan QR using your mobile
              </p>

              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=${encodeURIComponent(gpayUpiId)}%26pn=${encodeURIComponent(gpayMerchantName)}%26am=${selectedBooking.fareEstimated || 1850}%26cu=INR`}
                alt="Custom GPay QR Code"
                style={{ width: '160px', height: '160px', borderRadius: '12px', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', marginBottom: '10px' }}
              />

              <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
                UPI ID: <span style={{ color: '#2563eb' }}>{gpayUpiId}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                Payee: <strong>{gpayMerchantName}</strong>
              </div>

              <button
                onClick={handleLaunchMobileUPI}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                📲 Open GPay App (Mobile Only)
              </button>
            </div>

            {/* Complete Payment Button */}
            <button
              onClick={executePaymentBackend}
              disabled={processing}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: processing ? '#94a3b8' : '#10b981',
                color: '#ffffff',
                fontWeight: '900',
                fontSize: '16px',
                borderRadius: '14px',
                border: 'none',
                cursor: processing ? 'not-allowed' : 'pointer',
                boxShadow: processing ? 'none' : '0 6px 20px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              {processing ? "⏳ Processing Payment..." : "[ I've Completed Payment ]"}
            </button>

            <button
              onClick={() => setShowGatewayModal(false)}
              disabled={processing}
              style={{
                marginTop: '12px',
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
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
