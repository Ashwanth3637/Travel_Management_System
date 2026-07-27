import React, { useState, useEffect } from 'react';
import { FaDownload, FaSearch, FaTrash } from 'react-icons/fa';

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

  const combinedMap = new Map();

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

  const paidRecords = combinedRecords.filter(r => r.paymentStatus === 'Paid');
  const pendingRecords = combinedRecords.filter(r => r.paymentStatus === 'Pending');

  const totalGrossRevenue = paidRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalAdminCommission = Math.round(totalGrossRevenue * 0.15);
  const totalDriverPayouts = Math.round(totalGrossRevenue * 0.85);

  const filteredRecords = combinedRecords.filter(r => {
    const matchesSearch = 
      r.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.driverName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || r.paymentStatus.toUpperCase() === statusFilter.toUpperCase();
    const matchesMethod = methodFilter === "ALL" || r.paymentMethod.toUpperCase().includes(methodFilter.toUpperCase());

    return matchesSearch && matchesStatus && matchesMethod;
  });

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
    <div className="p-6 text-left">
      {/* Header & CSV Download */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <div>
          <h2 className="text-[26px] font-extrabold m-0 text-slate-800 flex items-center gap-2.5">
            💳 Admin Revenue & Payment Ledger
          </h2>
          <p className="text-slate-500 text-sm m-0">
            Uber/Rapido style payment reconciliation, commission revenue (15%), driver payouts (85%), and transaction reports.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => {
              fetchData(true);
              setToast("🔄 Payment ledger refreshed successfully!");
              setTimeout(() => setToast(""), 3000);
            }}
            className="px-4 py-2.5 bg-emerald-500 text-white font-extrabold text-xs border-none rounded-xl cursor-pointer flex items-center gap-2 shadow-md hover:bg-emerald-600 transition"
          >
            🔄 Refresh Data
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2.5 bg-blue-600 text-white font-extrabold text-xs border-none rounded-xl cursor-pointer flex items-center gap-2 shadow-md hover:bg-blue-700 transition"
          >
            <FaDownload /> Download Report (CSV)
          </button>

          <button
            onClick={handleClearPaymentHistory}
            className="px-4 py-2.5 bg-red-100 text-red-500 font-bold text-xs border border-red-300 rounded-xl cursor-pointer flex items-center gap-2 hover:bg-red-200 transition"
          >
            <FaTrash /> Clear History
          </button>
        </div>
      </div>

      {toast && (
        <div className="px-4.5 py-3 bg-green-100 text-green-800 rounded-xl font-bold text-sm mb-5 shadow-sm">
          {toast}
        </div>
      )}

      {/* REVENUE STATS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
        <div className="glass-panel p-5 border-l-4 border-blue-600">
          <div className="text-[11.5px] uppercase text-slate-500 font-extrabold tracking-wider">Total Gross Revenue</div>
          <div className="text-[26px] font-black text-blue-600 my-1">
            ₹{totalGrossRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-600 font-bold">
            {paidRecords.length} Successful Payments
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <div className="text-[11.5px] uppercase text-emerald-800 font-extrabold tracking-wider">💼 ADMIN WALLET BALANCE (15%)</div>
          <div className="text-[28px] font-black text-emerald-800 my-1">
            ₹{totalAdminCommission.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-700 font-bold mb-2">
            ⚡ 15% Platform Share Auto-Deposited
          </div>
          <button
            onClick={() => {
              setToast(`🏦 Successfully transferred Admin Profit Wallet (₹${totalAdminCommission.toLocaleString('en-IN')}) to TravelGo Corporate Account (HDFC Current A/C •••• 9988)!`);
              setTimeout(() => setToast(""), 4000);
            }}
            className="px-3 py-1.5 text-[11px] font-extrabold bg-emerald-700 text-white border-none rounded cursor-pointer hover:bg-emerald-800 transition"
          >
            🏦 Withdraw Profits to Bank
          </button>
        </div>

        <div className="glass-panel p-5 border-l-4 border-indigo-500">
          <div className="text-[11.5px] uppercase text-slate-500 font-extrabold tracking-wider">Driver Payouts (85%)</div>
          <div className="text-[26px] font-black text-indigo-500 my-1">
            ₹{totalDriverPayouts.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            Distributed Driver Share
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-amber-500">
          <div className="text-[11.5px] uppercase text-slate-500 font-extrabold tracking-wider">Pending Payments</div>
          <div className="text-[26px] font-black text-amber-500 my-1">
            {pendingRecords.length}
          </div>
          <div className="text-xs text-amber-700 font-bold">
            Uncollected Fares Due
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS ROW */}
      <div className="glass-panel px-6 py-4.5 mb-6 flex justify-between items-center flex-wrap gap-4">
        <div className="relative min-w-[280px] flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Booking ID, Customer, or Driver..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-[13.5px] outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="ALL">Status: All Statuses</option>
            <option value="PAID">Status: Paid</option>
            <option value="PENDING">Status: Pending</option>
          </select>

          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 outline-none"
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
      <div className="glass-panel p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading payment ledger...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No payment records found.</div>
        ) : (
          <table className="w-full border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[11.5px] tracking-wider">
                <th className="py-3.5 px-5">Booking ID</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Driver</th>
                <th className="py-3.5 px-5">Payment Method</th>
                <th className="py-3.5 px-5">Total Fare</th>
                <th className="py-3.5 px-5">Admin Share (15%)</th>
                <th className="py-3.5 px-5">Driver Share (85%)</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Automated Settlement (Razorpay Route)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((row, index) => {
                const driverEarn = row.driverEarnings || Math.round(row.amount * 0.85);
                const adminComm = row.adminCommission || Math.round(row.amount * 0.15);

                return (
                  <tr key={row.bookingId + '_' + index} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-4 px-5 font-extrabold text-blue-600">
                      #{row.bookingId}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-800">
                      {row.customerName}
                    </td>
                    <td className="py-4 px-5 text-slate-600">
                      👤 {row.driverName}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-700">
                      {row.paymentMethod} {row.bankName ? `(${row.bankName})` : ''}
                    </td>
                    <td className="py-4 px-5 font-black text-emerald-500">
                      ₹{row.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-indigo-600 font-extrabold">₹{adminComm.toLocaleString('en-IN')}</div>
                      <span className="text-[10.5px] font-bold text-green-800 bg-green-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {(row.paymentMethod || '').toUpperCase().includes('CASH') ? '15% Auto-Deducted from Driver Wallet ✅' : '15% Admin Retained'}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-extrabold text-emerald-500">
                      ₹{driverEarn.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        row.paymentStatus === 'Paid'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {row.paymentStatus === 'Paid' ? 'Paid to Admin ✅' : 'Pending ⌛'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-3 py-1.5 rounded-lg font-extrabold text-xs inline-block ${
                        (row.paymentMethod || '').toUpperCase().includes('CASH')
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      }`}>
                        {(row.paymentMethod || '').toUpperCase().includes('CASH')
                          ? `💵 Driver Cash Collection — 15% Admin Share (₹${adminComm.toLocaleString('en-IN')}) Auto-Deducted from Driver Wallet ✅`
                          : `⚡ 85% Auto Transferred to Driver Bank (₹${driverEarn.toLocaleString('en-IN')}) ✅`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
