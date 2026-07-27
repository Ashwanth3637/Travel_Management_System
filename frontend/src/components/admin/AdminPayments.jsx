import React, { useState, useEffect } from 'react';
import { FaDownload, FaSearch, FaFilter, FaMoneyBillWave, FaPercentage, FaChartLine, FaTrash } from 'react-icons/fa';

export default function AdminPayments() {
  const API_URL = "http://localhost:5001/api";
  const token = localStorage.getItem("token");

  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [toast, setToast] = useState("");

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [bookingsRes, paymentsRes] = await Promise.all([
        fetch(`${API_URL}/bookings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/payments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const bookingsData = await bookingsRes.json();
      const paymentsData = await paymentsRes.json();

      const newB = Array.isArray(bookingsData) ? bookingsData : [];
      const newP = Array.isArray(paymentsData) ? paymentsData : [];

      // Avoid unnecessary state updates if data has not changed
      setBookings(prev => JSON.stringify(prev) === JSON.stringify(newB) ? prev : newB);
      setPayments(prev => JSON.stringify(prev) === JSON.stringify(newP) ? prev : newP);
    } catch (err) {
      console.error("Failed to load admin payment records:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClearPaymentHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all payment ledger history records?")) return;
    try {
      await fetch(`${API_URL}/payments/clear-history`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast("🗑️ Payment history cleared successfully!");
      setPayments([]);
      fetchData();
      setTimeout(() => setToast(""), 5000);
    } catch (err) {
      console.error("Error clearing payment history:", err);
    }
  };

  // Merge payments ledger with bookings list into unified admin payment records
  const combinedMap = new Map();

  // First add payments from DB payments collection
  payments.forEach(p => {
    const amount = p.amount || 1850;
    combinedMap.set(p.bookingId, {
      bookingId: p.bookingId,
      customerName: p.customerName || 'Customer',
      driverName: p.driverName || 'Unassigned',
      amount,
      adminCommission: p.adminCommission || Math.round(amount * 0.15),
      driverEarnings: p.driverEarnings || Math.round(amount * 0.85),
      paymentMethod: p.paymentMethod || 'GPay',
      bankName: p.bankName || '',
      paymentStatus: 'Paid',
      transactionId: p.transactionId || ('TXN' + Math.floor(100000 + Math.random() * 900000)),
      date: p.paymentDate || new Date().toLocaleDateString('en-GB')
    });
  });

  // Then add or update from bookings list
  bookings.forEach(b => {
    const isPaid = (b.paymentStatus || '').toUpperCase() === 'PAID';
    if (!combinedMap.has(b.id) || isPaid) {
      const existing = combinedMap.get(b.id) || {};
      const amount = b.fareEstimated || existing.amount || 1850;
      combinedMap.set(b.id, {
        bookingId: b.id,
        customerName: b.customerName || existing.customerName || 'Customer',
        driverName: b.assignedDriverId || existing.driverName || 'Unassigned',
        amount,
        adminCommission: Math.round(amount * 0.15),
        driverEarnings: Math.round(amount * 0.85),
        paymentMethod: b.paymentMethod || existing.paymentMethod || 'GPay',
        bankName: b.bankName || existing.bankName || '',
        paymentStatus: isPaid ? 'Paid' : (existing.paymentStatus || 'Pending'),
        transactionId: b.transactionId || existing.transactionId || (isPaid ? 'TXN' + Math.floor(100000 + Math.random() * 900000) : '—'),
        date: b.paidAt || existing.date || new Date().toLocaleDateString('en-GB')
      });
    }
  });

  const combinedRecords = Array.from(combinedMap.values());

  // Calculate Revenue Stats
  const paidRecords = combinedRecords.filter(r => r.paymentStatus === 'Paid');
  const pendingRecords = combinedRecords.filter(r => r.paymentStatus === 'Pending');

  const totalGrossRevenue = paidRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalAdminCommission = Math.round(totalGrossRevenue * 0.15);
  const totalDriverPayouts = Math.round(totalGrossRevenue * 0.85);

  // Search & Filter
  const filteredRecords = combinedRecords.filter(r => {
    const matchesSearch = 
      r.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.driverName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || r.paymentStatus.toUpperCase() === statusFilter.toUpperCase();
    const matchesMethod = methodFilter === "ALL" || r.paymentMethod.toUpperCase().includes(methodFilter.toUpperCase());

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Download CSV Report
  const handleDownloadCSV = () => {
    const headers = ["Booking ID", "Customer", "Driver", "Amount", "Admin Commission (15%)", "Driver Payout (85%)", "Method", "Status", "Transaction ID", "Date"];
    const rows = filteredRecords.map(r => [
      r.bookingId,
      r.customerName,
      r.driverName,
      `₹${r.amount}`,
      `₹${r.adminCommission}`,
      `₹${r.driverEarnings}`,
      r.paymentMethod,
      r.paymentStatus,
      r.transactionId,
      r.date
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payment_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '24px', textAlign: 'left' }}>
      
      {/* Header & CSV Download */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            💳 Admin Revenue & Payment Ledger
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Uber/Rapido style payment reconciliation, commission revenue (15%), driver payouts (85%), and transaction reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              fetchData(true);
              setToast("🔄 Payment ledger refreshed successfully!");
              setTimeout(() => setToast(""), 3000);
            }}
            style={{
              padding: '10px 18px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '13px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            🔄 Refresh Data
          </button>

          <button
            onClick={handleDownloadCSV}
            style={{
              padding: '10px 18px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '13px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
            }}
          >
            <FaDownload /> Download Report (CSV)
          </button>

          <button
            onClick={handleClearPaymentHistory}
            style={{
              padding: '10px 18px',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              fontWeight: '700',
              fontSize: '13px',
              border: '1px solid #fca5a5',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaTrash /> Clear History
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ padding: '12px 18px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '10px', fontWeight: '700', fontSize: '14px', marginBottom: '20px' }}>
          {toast}
        </div>
      )}

      {/* REVENUE STATS SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '5px solid #2563eb' }}>
          <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', letterSpacing: '0.5px' }}>Total Gross Revenue</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#2563eb', margin: '4px 0' }}>
            ₹{totalGrossRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>
            {paidRecords.length} Successful Payments
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '5px solid #10b981' }}>
          <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', letterSpacing: '0.5px' }}>Admin Commission (15%)</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#10b981', margin: '4px 0' }}>
            ₹{totalAdminCommission.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            Net Platform Revenue Share
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '5px solid #6366f1' }}>
          <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', letterSpacing: '0.5px' }}>Driver Payouts (85%)</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#6366f1', margin: '4px 0' }}>
            ₹{totalDriverPayouts.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            Distributed Driver Share
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '5px solid #f59e0b' }}>
          <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', letterSpacing: '0.5px' }}>Pending Payments</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#f59e0b', margin: '4px 0' }}>
            {pendingRecords.length}
          </div>
          <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '700' }}>
            Uncollected Fares Due
          </div>
        </div>

      </div>

      {/* SEARCH AND FILTERS ROW */}
      <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
          <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by Booking ID, Customer, or Driver..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              outline: 'none'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', color: '#334155' }}
          >
            <option value="ALL">Status: All Statuses</option>
            <option value="PAID">Status: Paid</option>
            <option value="PENDING">Status: Pending</option>
          </select>

          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', color: '#334155' }}
          >
            <option value="ALL">Method: All Methods</option>
            <option value="GPAY">Google Pay (GPay)</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI / PhonePe</option>
            <option value="CARD">Credit / Debit Card</option>
          </select>
        </div>

      </div>

      {/* ADMIN PAYMENT TABLE */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading payment ledger...</div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>No payment records found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '800', textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.5px' }}>
                <th style={{ padding: '14px 20px' }}>Booking ID</th>
                <th style={{ padding: '14px 20px' }}>Customer</th>
                <th style={{ padding: '14px 20px' }}>Driver</th>
                <th style={{ padding: '14px 20px' }}>Payment Method</th>
                <th style={{ padding: '14px 20px' }}>Bank</th>
                <th style={{ padding: '14px 20px' }}>Amount</th>
                <th style={{ padding: '14px 20px' }}>Commission (15%)</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px' }}>Transaction ID</th>
                <th style={{ padding: '14px 20px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((row, index) => (
                <tr key={row.bookingId + '_' + index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s ease' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '800', color: '#2563eb' }}>
                    #{row.bookingId}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: '#1e293b' }}>
                    {row.customerName}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#475569' }}>
                    {row.driverName}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: '#334155' }}>
                    {row.paymentMethod}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: '#2563eb' }}>
                    {row.bankName || '—'}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '900', color: '#10b981' }}>
                    ₹{row.amount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ color: '#6366f1', fontWeight: '800' }}>₹{row.adminCommission.toLocaleString('en-IN')}</div>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      color: (row.paymentMethod || '').toUpperCase().includes('CASH') ? '#b45309' : '#15803d',
                      backgroundColor: (row.paymentMethod || '').toUpperCase().includes('CASH') ? '#fef3c7' : '#dcfce7',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      marginTop: '3px',
                      display: 'inline-block'
                    }}>
                      {(row.paymentMethod || '').toUpperCase().includes('CASH') ? '15% Due from Driver' : '15% Admin Retained'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: '#334155' }}>
                    {row.paymentMethod}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '800',
                      backgroundColor: row.paymentStatus === 'Paid' ? '#dcfce7' : '#fef3c7',
                      color: row.paymentStatus === 'Paid' ? '#15803d' : '#b45309',
                      border: row.paymentStatus === 'Paid' ? '1px solid #86efac' : '1px solid #fde68a'
                    }}>
                      {row.paymentStatus === 'Paid' ? 'Paid ✅' : 'Pending ⌛'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '12.5px', color: '#64748b' }}>
                    {row.transactionId}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '13px' }}>
                    {row.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
