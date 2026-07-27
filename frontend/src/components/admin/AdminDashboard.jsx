import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import AdminBookings from './AdminBookings';
import AdminVehicles from './AdminVehicles';
import AdminDrivers from './AdminDrivers';
import AdminReports from './AdminReports';
import AdminCustomers from './AdminCustomers';
import AdminOverview from './AdminOverview';
import AdminProfile from './AdminProfile';
import AdminFeedbacks from './AdminFeedbacks';
import AdminQueries from './AdminQueries';
import AdminPayments from './AdminPayments';

function AdminDashboard({ token, handleLogout }) {
  const API_URL = 'http://localhost:5001/api';

  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const triggerToast = (success, error) => {
    if (success) {
      setSuccessMsg(success);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
    if (error) {
      setErrorMsg(error);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [bRes, vRes, dRes, sRes] = await Promise.all([
        fetch(`${API_URL}/bookings`, { headers, cache: 'no-store' }),
        fetch(`${API_URL}/vehicles`, { headers, cache: 'no-store' }),
        fetch(`${API_URL}/drivers`, { headers, cache: 'no-store' }),
        fetch(`${API_URL}/dashboard/stats`, { headers, cache: 'no-store' })
      ]);

      const [bData, vData, dData, sData] = await Promise.all([
        bRes.json(),
        vRes.json(),
        dRes.json(),
        sRes.json()
      ]);

      if (bRes.ok) setBookings(bData);
      if (vRes.ok) setVehicles(vData);
      if (dRes.ok) setDrivers(dData);
      if (sRes.ok) setStats(sData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [token]);

  const navItems = [
    { to: "/admin/overview", label: "Dashboard", icon: "🏠", bg: "rgba(59,130,246,0.12)" },
    { to: "/admin/bookings", label: "Bookings", icon: "📅", bg: "rgba(99,102,241,0.12)" },
    { to: "/admin/history", label: "Trip History", icon: "📜", bg: "rgba(245,158,11,0.14)" },
    { to: "/admin/customers", label: "Customers", icon: "👥", bg: "rgba(236,72,153,0.12)" },
    { to: "/admin/vehicles", label: "Vehicles", icon: "🚗", bg: "rgba(249,115,22,0.14)" },
    { to: "/admin/drivers", label: "Drivers", icon: "👨‍✈️", bg: "rgba(16,185,129,0.14)" },
    { to: "/admin/reports", label: "Reports", icon: "📊", bg: "rgba(139,92,246,0.14)" },
    { to: "/admin/payments", label: "Payment Reports", icon: "💳", bg: "rgba(16,185,129,0.14)" },
    { to: "/admin/queries", label: "Feedback", icon: "💬", bg: "rgba(6,182,212,0.14)" },
  ];

  return (
    <div className="relative">
      {/* Toast notifications */}
      {successMsg && createPortal(
        <div className="fixed top-6 right-6 z-[99999] min-w-[280px] max-w-[400px] p-4 bg-gradient-to-br from-emerald-900 to-emerald-800 text-emerald-300 rounded-2xl border border-emerald-500/40 font-semibold text-sm shadow-2xl flex items-start gap-3 animate-slide-in-right leading-snug">
          <span className="text-xl shrink-0">✅</span>
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="bg-transparent border-none text-emerald-300 cursor-pointer text-base p-0 shrink-0 opacity-70 hover:opacity-100">✕</button>
        </div>,
        document.body
      )}
      {errorMsg && createPortal(
        <div className="fixed top-6 right-6 z-[99999] min-w-[280px] max-w-[400px] p-4 bg-gradient-to-br from-red-950 to-red-900 text-red-300 rounded-2xl border border-red-500/40 font-semibold text-sm shadow-2xl flex items-start gap-3 animate-slide-in-right leading-snug">
          <span className="text-xl shrink-0">❌</span>
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="bg-transparent border-none text-red-300 cursor-pointer text-base p-0 shrink-0 opacity-70 hover:opacity-100">✕</button>
        </div>,
        document.body
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-6 items-start mt-2.5">
        {/* Left Side Sidebar Menu */}
        <div className="glass-panel w-[240px] min-w-[240px] flex flex-col gap-2 p-5 sticky top-[90px] min-h-[calc(100vh-120px)] border-l-4 border-l-amber-500 box-border">
          <div className="flex flex-col gap-2">
            <div className="py-4 px-2 text-center border-b border-slate-200 mb-4">
              <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent tracking-wide">
                Administration
              </div>
            </div>
          </div>

          <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest px-3 py-1 text-left">
            Admin Menu
          </div>

          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl no-underline text-[14.5px] font-extrabold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-900 bg-transparent hover:bg-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-lg shrink-0 ${
                    isActive ? 'bg-white/25' : ''
                  }`} style={{ backgroundColor: isActive ? undefined : item.bg }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Logout Section */}
          <div className="mt-auto pt-4 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 text-[14.5px] font-extrabold rounded-xl flex items-center justify-center gap-2 bg-red-500 text-white border-none cursor-pointer shadow-md hover:bg-red-600 hover:-translate-y-0.5 transition"
            >
              <span className="text-base">🔑</span>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Right Side Content */}
        <div className="animate-fade-in min-w-0 w-full overflow-hidden">
          <Routes>
            <Route path="bookings" element={<AdminBookings token={token} bookings={bookings} vehicles={vehicles} drivers={drivers} refresh={fetchData} toast={triggerToast} onlyActive={true} />} />
            <Route path="history" element={<AdminBookings token={token} bookings={bookings} vehicles={vehicles} drivers={drivers} refresh={fetchData} toast={triggerToast} onlyHistory={true} />} />
            <Route path="vehicles" element={<AdminVehicles token={token} vehicles={vehicles} refresh={fetchData} toast={triggerToast} />} />
            <Route path="drivers" element={<AdminDrivers token={token} drivers={drivers} refresh={fetchData} toast={triggerToast} />} />
            <Route path="customers" element={<AdminCustomers token={token} toast={triggerToast} />} />
            <Route path="reports" element={<AdminReports token={token} stats={stats} bookings={bookings} vehicles={vehicles} drivers={drivers} refresh={fetchData} toast={triggerToast} />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="feedbacks" element={<AdminFeedbacks token={token} toast={triggerToast} />} />
            <Route path="queries" element={<AdminQueries token={token} toast={triggerToast} />} />
            <Route path="overview" element={<AdminOverview token={token} toast={triggerToast} />} />
            <Route path="profile" element={<AdminProfile token={token} toast={triggerToast} />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
