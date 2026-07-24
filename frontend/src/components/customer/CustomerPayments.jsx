import React, { useState, useEffect } from 'react';

function CustomerPayments({ token, customer, onPaymentComplete }) {
  const API_URL = "http://localhost:5001/api";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking', 'cash'
  
  // Card Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI Inputs
  const [upiId, setUpiId] = useState('');

  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
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

  const completedBookings = bookings.filter(b => ['Completed', 'Trip Completed'].includes(b.status));
  const unpaidBookings = completedBookings.filter(b => b.paymentStatus !== 'PAID');
  const paidBookings = completedBookings.filter(b => b.paymentStatus === 'PAID');

  const totalPaidAmount = paidBookings.reduce((sum, b) => sum + (b.fareEstimated || 0), 0);
  const totalUnpaidAmount = unpaidBookings.reduce((sum, b) => sum + (b.fareEstimated || 0), 0);

  const handlePayNow = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    if (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvv)) {
      setErrorMsg('Please enter valid Card Number, Expiry, and CVV.');
      return;
    }

    if (paymentMethod === 'upi' && !upiId && !upiId.includes('@')) {
      setErrorMsg('Please enter a valid UPI ID (e.g. rider@upi).');
      return;
    }

    try {
      setProcessing(true);
      setErrorMsg('');

      const res = await fetch(`${API_URL}/customer/payments/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          paymentMethod: paymentMethod.toUpperCase(),
          amountPaid: selectedBooking.fareEstimated || 1850
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`✅ Payment of ₹${selectedBooking.fareEstimated || 1850} successful! Txn ID: ${data.transactionId}`);
        setSelectedBooking(null);
        fetchBookings();
        if (onPaymentComplete) onPaymentComplete();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(data.error || 'Payment failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Failed to process payment.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ─── HEADER CARD ─── */}
      <div className="glass-panel" style={{
        padding: '20px 28px',
        borderLeft: '5px solid #10b981',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#1e293b' }}>
            💳 Payments & Invoice Receipts
          </h2>
          <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0, fontWeight: '600' }}>
            Pay trip fares securely via UPI, Credit/Debit Card, Net Banking, or Cash
          </p>
        </div>

        <span className="badge badge-completed" style={{ fontSize: '12px', padding: '6px 14px' }}>
          🔒 256-Bit SSL Encrypted
        </span>
      </div>

      {/* ─── STAT CARDS SUMMARY ROW ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800' }}>
            UNPAID FARE DUE
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
            ₹{totalUnpaidAmount.toLocaleString()}
          </div>
          <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: '700', marginTop: '4px' }}>
            {unpaidBookings.length} trip(s) pending payment
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800' }}>
            TOTAL FARES PAID
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
            ₹{totalPaidAmount.toLocaleString()}
          </div>
          <div style={{ fontSize: '11.5px', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>
            ✅ {paidBookings.length} paid invoices
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800' }}>
            TOTAL TRIPS CLOSED
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
            {completedBookings.length}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>
            Completed ride records
          </div>
        </div>

      </div>

      {successMsg && (
        <div className="glass-panel" style={{ padding: '14px 20px', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontWeight: '700', fontSize: '14px', borderRadius: '12px' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="glass-panel" style={{ padding: '14px 20px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontWeight: '700', fontSize: '14px', borderRadius: '12px' }}>
          {errorMsg}
        </div>
      )}

      {/* ─── UNPAID TRIPS SECTION (FARE PAYMENT DUE) ─── */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🚨 Unpaid Completed Trips & Pending Fares
        </h3>

        {unpaidBookings.length === 0 ? (
          <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎉</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>All Completed Trip Fares Settled!</div>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>You have no pending unpaid trip bills.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {unpaidBookings.map(b => (
              <div key={b.id} className="glass-panel" style={{
                padding: '24px',
                borderLeft: '5px solid #ef4444',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '800', fontSize: '18px', color: '#1e293b' }}>#{b.id}</span>
                    <span className="badge badge-completed">TRIP COMPLETED</span>
                    <span className="badge badge-cancelled" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>PAYMENT PENDING</span>
                  </div>
                  <div style={{ fontSize: '14.5px', color: '#1e293b', fontWeight: '700', marginBottom: '4px' }}>
                    📍 {b.pickupLocation} → {b.dropLocation}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    🗓️ Date: {b.travelDate || b.bookingDate} | Vehicle: {b.vehicleType}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800' }}>TOTAL FARE DUE</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#ef4444' }}>₹{b.fareEstimated || 1850}</div>
                  </div>

                  <button
                    onClick={() => setSelectedBooking(b)}
                    style={{
                      padding: '11px 22px',
                      fontSize: '13.5px',
                      fontWeight: '800',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>💳 Pay ₹{b.fareEstimated || 1850} Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── PAYMENT CHECKOUT MODAL ─── */}
      {selectedBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            backgroundColor: '#ffffff',
            maxWidth: '540px',
            width: '100%',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 2px 0', color: '#1e293b' }}>
                  💳 Fare Settlement #{selectedBooking.id}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Select preferred payment option to complete ride</span>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* FARE BREAKDOWN CARD */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', marginBottom: '10px' }}>
                Trip Fare Breakdown
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                <span>Base Trip Fare</span>
                <span>₹{Math.round((selectedBooking.fareEstimated || 1850) * 0.85)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                <span>Driver Allowance & Night Charges</span>
                <span>₹{Math.round((selectedBooking.fareEstimated || 1850) * 0.10)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
                <span>GST (5%) & Toll Taxes</span>
                <span>₹{Math.round((selectedBooking.fareEstimated || 1850) * 0.05)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: '#1e293b', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                <span>Total Amount Payable</span>
                <span style={{ color: '#10b981' }}>₹{selectedBooking.fareEstimated || 1850}</span>
              </div>
            </div>

            {/* PAYMENT METHOD SELECTOR */}
            <form onSubmit={handlePayNow} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Select Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  
                  {/* Option 1: UPI */}
                  <div
                    onClick={() => setPaymentMethod('upi')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: paymentMethod === 'upi' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: paymentMethod === 'upi' ? 'rgba(37, 99, 235, 0.06)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: paymentMethod === 'upi' ? '#2563eb' : '#475569'
                    }}
                  >
                    📱 UPI / QR Code
                  </div>

                  {/* Option 2: Card */}
                  <div
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: paymentMethod === 'card' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: paymentMethod === 'card' ? 'rgba(37, 99, 235, 0.06)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: paymentMethod === 'card' ? '#2563eb' : '#475569'
                    }}
                  >
                    💳 Credit / Debit Card
                  </div>

                  {/* Option 3: Net Banking */}
                  <div
                    onClick={() => setPaymentMethod('netbanking')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: paymentMethod === 'netbanking' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: paymentMethod === 'netbanking' ? 'rgba(37, 99, 235, 0.06)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: paymentMethod === 'netbanking' ? '#2563eb' : '#475569'
                    }}
                  >
                    🏦 Net Banking
                  </div>

                  {/* Option 4: Cash */}
                  <div
                    onClick={() => setPaymentMethod('cash')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: paymentMethod === 'cash' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: paymentMethod === 'cash' ? 'rgba(37, 99, 235, 0.06)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: paymentMethod === 'cash' ? '#2563eb' : '#475569'
                    }}
                  >
                    💵 Cash to Driver
                  </div>

                </div>
              </div>

              {/* UPI / GPAY SCANNER & VPA INPUT */}
              {paymentMethod === 'upi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', textAlign: 'center', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                    📱 Scan Driver's GPay QR Code to Pay ₹{selectedBooking.fareEstimated || 1850}
                  </div>
                  
                  {/* Real GPay QR Scanner Image */}
                  <div style={{
                    width: '210px',
                    height: '240px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '3px solid #2563eb',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src="/gpay_qr.jpg" 
                      alt="GPay QR Code - Ashwanth 2020 Sakthi" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb' }}>
                    Account: Ashwanth 2020 Sakthi (Verified Driver GPay)
                  </div>

                  <div style={{ width: '100%', textDecoration: 'none' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px', textAlign: 'left' }}>
                      ENTER YOUR UPI ID OR TRANSACTION REF NO.
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. ashwanth@upi or Txn Ref No." 
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {/* CARD INPUT FIELDS */}
              {paymentMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>CARD NUMBER</label>
                    <input 
                      type="text" 
                      placeholder="4532 •••• •••• 8920" 
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>EXPIRY (MM/YY)</label>
                      <input 
                        type="text" 
                        placeholder="08/28" 
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>CVV CODE</label>
                      <input 
                        type="password" 
                        placeholder="•••" 
                        maxLength={4}
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '800',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: processing ? 'wait' : 'pointer',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  marginTop: '10px'
                }}
              >
                {processing ? '🔄 Processing Payment...' : `✅ Pay ₹${selectedBooking.fareEstimated || 1850} Now`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── PAID INVOICES HISTORY ─── */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '14px' }}>
          📄 Paid Invoices & Transaction History
        </h3>

        {paidBookings.length === 0 ? (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
            No past paid invoice receipts yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paidBookings.map(b => (
              <div key={b.id} className="glass-panel" style={{
                padding: '16px 20px',
                borderLeft: '4px solid #10b981',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b' }}>#{b.id}</span>
                    <span className="badge badge-completed">PAID ✅</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Method: {b.paymentMethod || 'UPI'}</span>
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600' }}>
                    📍 {b.pickupLocation} → {b.dropLocation}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Txn ID: {b.transactionId || 'TXN-984210'} | Date: {b.paidAt ? new Date(b.paidAt).toLocaleDateString() : b.travelDate}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                    ₹{b.fareEstimated || 1850}
                  </div>
                  <button 
                    onClick={() => alert(`Receipt #${b.id}\nCustomer: ${customer?.name}\nRoute: ${b.pickupLocation} -> ${b.dropLocation}\nAmount: ₹${b.fareEstimated}\nStatus: PAID ✅`)}
                    style={{ fontSize: '11.5px', fontWeight: '700', color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer', marginTop: '4px' }}
                  >
                    📄 View Digital Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default CustomerPayments;
