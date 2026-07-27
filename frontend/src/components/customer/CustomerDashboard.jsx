/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomerBooking from "./CustomerBooking";
import CustomerBookingHistory from "./CustomerBookingHistory";
import CustomerTrackTrip from "./CustomerTrackTrip";
import CustomerFeedback from "./CustomerFeedback";
import CustomerPayments from "./CustomerPayments";
import { BarChart, HorizontalBarChart } from "../admin/ChartComponents";

const NAV_ITEMS = [
  { key: "home",     icon: "🏠", label: "Dashboard",        color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
  { key: "booking",  icon: "🚗", label: "Book Your Trip",   color: "#f97316", bg: "rgba(249, 115, 22, 0.14)" },
  { key: "history",  icon: "📜", label: "Trip History",     color: "#f59e0b", bg: "rgba(245, 158, 11, 0.14)" },
  { key: "track",    icon: "📍", label: "Track Active Trip", color: "#10b981", bg: "rgba(16, 185, 129, 0.14)" },
  { key: "payments", icon: "💳", label: "Payments",         color: "#10b981", bg: "rgba(16, 185, 129, 0.14)" },
  { key: "feedback", icon: "💬", label: "Feedback",          color: "#06b6d4", bg: "rgba(6, 182, 212, 0.14)" },
];

function CustomerDashboard({ token, customer, onUpdateProfile, activeTab, activeTrackBooking, setActiveTrackBooking, handleLogout }) {
  const API_URL = "http://localhost:5001/api";
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, active: 0, completed: 0, cancelled: 0 });

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName]   = useState(customer ? customer.name  : "");
  const [editPhone, setEditPhone] = useState(customer ? customer.phone : "");
  const [editSuccess, setEditSuccess] = useState("");

  useEffect(() => {
    if (customer) {
      setEditName(customer.name || "");
      setEditPhone(customer.phone || "");
    }
  }, [customer]);

  const [recentActiveBookings, setRecentActiveBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      setCurrentTime(now.toLocaleString('en-US', options));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = useCallback(async () => {
    if (!customer) return;
    try {
      const res = await fetch(`${API_URL}/customer/bookings?customerName=${encodeURIComponent(customer.name)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      const data = await res.json();
      if (res.ok && data) {
        setAllBookings(data);
        setStats({
          total:     data.length,
          pending:   data.filter(b => b.status === "Pending").length,
          confirmed: data.filter(b => b.status === "Confirmed").length,
          active:    data.filter(b => b.status === "In Progress" || b.status === "Trip Started").length,
          completed: data.filter(b => b.status === "Completed" || b.status === "Trip Completed").length,
          cancelled: data.filter(b => b.status === "Cancelled").length
        });
        const actives = data.filter(b => !["Completed", "Trip Completed", "Cancelled"].includes(b.status));
        setRecentActiveBookings(actives);
      }
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  }, [token, customer]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editName || !editPhone) { alert("Name and Phone are required."); return; }
    const updated = { ...customer, name: editName, phone: editPhone };
    onUpdateProfile(updated);
    setEditSuccess("Profile updated successfully!");
    setTimeout(() => { setEditSuccess(""); setEditingProfile(false); }, 2000);
  };

  const handleSelectTrackTrip = (booking) => {
    setActiveTrackBooking(booking);
    navigate("/customer/track");
  };

  const handleClearActiveTrip = () => {
    setActiveTrackBooking(null);
    navigate("/customer/home");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
      case "dashboard":
        return (
          <div className="animate-fade-in text-left flex flex-col gap-5">
            {/* STANDALONE CUSTOMER HEADER CARD */}
            <div className="flex justify-between items-center flex-wrap gap-4 bg-white px-7 py-[18px] rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
              <div>
                <h2 className="text-[22px] font-extrabold m-0 text-slate-800 tracking-tight">
                  Welcome back, {customer ? customer.name : 'Valued Rider'}! 👋
                </h2>
                <p className="text-slate-500 text-[13.5px] m-0 font-semibold">
                  Customer Dashboard & Live Dispatch Logistics
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-[12.5px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-200 flex items-center gap-1.5">
                  ⏱️ <span>{currentTime}</span>
                </div>
              </div>
            </div>

            {/* 1. CUSTOMER STAT CARDS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2.5">
              <div className="glass-panel stat-card border-l-4 border-l-blue-600 flex justify-between items-center p-5">
                <div>
                  <div className="text-[11.5px] uppercase text-slate-500 font-extrabold tracking-wide">Total Bookings</div>
                  <div className="text-3xl font-extrabold text-blue-600 my-1">{stats.total}</div>
                  <div className="text-xs text-emerald-600 font-bold">📈 +14% this month</div>
                </div>
                <div className="text-2xl bg-blue-100 p-3 rounded-xl">📅</div>
              </div>

              <div className="glass-panel stat-card border-l-4 border-l-orange-500 flex justify-between items-center p-5">
                <div>
                  <div className="text-[11.5px] uppercase text-slate-500 font-extrabold tracking-wide">Active & Dispatched</div>
                  <div className="text-3xl font-extrabold text-orange-500 my-1">{stats.active + stats.confirmed}</div>
                  <div className="text-xs text-orange-500 font-bold">⚡ Live tracking</div>
                </div>
                <div className="text-2xl bg-orange-100 p-3 rounded-xl">🚗</div>
              </div>

              <div className="glass-panel stat-card border-l-4 border-l-emerald-500 flex justify-between items-center p-5">
                <div>
                  <div className="text-[11.5px] uppercase text-slate-500 font-extrabold tracking-wide">Completed Rides</div>
                  <div className="text-3xl font-extrabold text-emerald-500 my-1">{stats.completed}</div>
                  <div className="text-xs text-emerald-600 font-bold">✅ 100% On Time</div>
                </div>
                <div className="text-2xl bg-emerald-100 p-3 rounded-xl">✅</div>
              </div>

              <div className="glass-panel stat-card border-l-4 border-l-red-500 flex justify-between items-center p-5">
                <div>
                  <div className="text-[11.5px] uppercase text-slate-500 font-extrabold tracking-wide">Cancelled Trips</div>
                  <div className="text-3xl font-extrabold text-red-500 my-1">{stats.cancelled}</div>
                  <div className="text-xs text-slate-500 font-semibold">Aborted requests</div>
                </div>
                <div className="text-2xl bg-red-100 p-3 rounded-xl">❌</div>
              </div>
            </div>

            {/* 0. LIVE PAYMENT DUE NOTIFICATION BANNER */}
            {allBookings.filter(b => ["Destination Reached", "Reached", "Trip Ended", "Ended"].includes((b.status || '').trim()) && !['PAID', 'CONFIRMED', 'DRIVER CONFIRMED', 'CONFIRMED_BY_DRIVER'].includes((b.paymentStatus || '').toUpperCase().trim())).map(b => (
              <div key={b.id} className="p-5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-2 border-amber-500/40 rounded-2xl shadow-lg flex justify-between items-center flex-wrap gap-4 animate-bounce-short">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                    💳
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-slate-900">
                        📍 Trip Ended! Payment Due for #{b.id} ({b.vehicleType})
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-white animate-pulse">
                        ACTION REQUIRED
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-semibold mt-1">
                      Route: {b.pickupLocation} → {b.dropLocation} | Fare: <strong className="text-amber-800 font-black text-sm">₹{(b.fareEstimated || 1850).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/customer/payments')}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-black rounded-xl border-none cursor-pointer shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  ⚡ Pay ₹{(b.fareEstimated || 1850).toLocaleString('en-IN')} Now (GPay / Cash)
                </button>
              </div>
            ))}

            {/* 2. ACTIVE BOOKINGS & START OTP CODES */}
            {recentActiveBookings.length > 0 && (
              <div className="mt-5">
                <h3 className="text-lg font-extrabold mb-3.5 flex items-center gap-2 text-slate-800">
                  🔑 Active Bookings & Start OTP Code
                </h3>
                <div className="flex flex-col gap-4">
                  {recentActiveBookings.map(b => (
                    <div key={b.id} className="glass-panel p-5 flex justify-between items-center border-l-4 border-l-blue-600 flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="font-extrabold text-base text-slate-900">#{b.id}</span>
                          <span className={`badge ${
                            b.status === 'Pending' ? 'badge-pending' : 
                            ['Confirmed', 'Driver Assigned', 'Vehicle Assigned', 'Trip Scheduled'].includes(b.status) ? 'badge-confirmed' : 
                            ['Completed', 'Trip Completed'].includes(b.status) ? 'badge-completed' : 
                            'badge-inprogress'
                          }`}>
                            {b.status}
                          </span>
                          <span className="text-xs text-slate-500">({b.vehicleType})</span>
                        </div>
                        <div className="text-sm text-slate-500">
                          📍 {b.pickupLocation} → {b.dropLocation}
                        </div>
                      </div>

                      {b.startOtp && (
                        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 px-4 py-2.5 rounded-xl border border-blue-600 text-center">
                          <div className="text-[10.5px] uppercase text-blue-600 font-extrabold tracking-wider">
                            DRIVER TRIP START OTP
                          </div>
                          <div className="text-2xl font-black text-blue-700 tracking-widest mt-0.5">
                            {b.startOtp}
                          </div>
                        </div>
                      )}

                      <button 
                        className="px-4.5 py-2.5 text-[12.5px] font-bold bg-emerald-500 text-white border-none rounded-lg cursor-pointer shadow-md hover:bg-emerald-600 transition"
                        onClick={() => handleSelectTrackTrip(b)}
                      >
                        📍 Track Trip
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EASY ANALYTICS CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2.5">
              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase text-slate-500">Activity Overview</div>
                    <h4 className="text-base font-extrabold m-0 text-slate-800">Weekly Travel Demand</h4>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
                    📊 Peak Activity: Sat
                  </span>
                </div>
                <BarChart
                  data={[
                    { label: 'Mon', count: 3 },
                    { label: 'Tue', count: 5 },
                    { label: 'Wed', count: 4 },
                    { label: 'Thu', count: 8 },
                    { label: 'Fri', count: 12 },
                    { label: 'Sat', count: 15 },
                    { label: 'Sun', count: 9 }
                  ]}
                  dataKey="count"
                  labelKey="label"
                  color="#2563eb"
                />
              </div>

              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase text-slate-500">Fleet Preference</div>
                    <h4 className="text-base font-extrabold m-0 text-slate-800">Vehicle Class Distribution</h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
                    🚘 Top: Sedan
                  </span>
                </div>
                <HorizontalBarChart
                  data={{
                    Sedan: stats.total > 0 ? Math.max(1, Math.round(stats.total * 0.45)) : 8,
                    SUV: stats.total > 0 ? Math.max(1, Math.round(stats.total * 0.30)) : 5,
                    Luxury: stats.total > 0 ? Math.max(1, Math.round(stats.total * 0.15)) : 3,
                    Minivan: stats.total > 0 ? Math.max(1, Math.round(stats.total * 0.10)) : 2
                  }}
                />
              </div>
            </div>

          </div>
        );
      case "booking":
        return <CustomerBooking token={token} customer={customer} />;
      case "history":
        return <CustomerBookingHistory token={token} customer={customer} onSelectTrackTrip={handleSelectTrackTrip} />;
      case "track":
        return <CustomerTrackTrip token={token} customer={customer} activeBooking={activeTrackBooking} onClearActiveTrip={handleClearActiveTrip} />;
      case "payments":
        return <CustomerPayments token={token} customer={customer} onPaymentComplete={fetchStats} />;
      case "feedback":
        return <CustomerFeedback token={token} customer={customer} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-6 items-start max-w-[1400px] mx-auto">
      {/* LEFT SIDEBAR */}
      <div className="glass-panel w-[240px] min-w-[240px] p-3 flex flex-col gap-1.5 box-border">
        {/* Customer Panel Title */}
        <div className="py-2 px-1 text-center border-b border-slate-200 mb-2">
          <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent tracking-wide">
            Customer Panel
          </div>
        </div>

        {/* Profile block */}
        {!editingProfile ? (
          <div className="text-center py-2 px-1 border-b border-slate-200 mb-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-extrabold text-2xl text-white mx-auto mb-2 shadow-md">
              {customer ? customer.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div className="font-bold text-sm text-slate-800 mb-0.5">
              {customer ? customer.name : 'Rider'}
            </div>
            {customer?.email && (
              <div className="text-[11px] text-slate-500 mb-1 break-all">
                {customer.email}
              </div>
            )}
            {customer?.phone && (
              <div className="text-[11px] text-slate-500 mb-1.5">
                📞 {customer.phone}
              </div>
            )}
            <span className="badge badge-inprogress text-[10px] mb-2 inline-block">Rider</span>
            <div>
              <button
                onClick={() => setEditingProfile(true)}
                className="mt-1.5 py-1.5 px-3 text-[11.5px] font-bold rounded-lg w-full bg-blue-50 text-blue-600 border border-blue-200 cursor-pointer transition hover:bg-blue-600 hover:text-white"
              >
                ✏️ Edit Profile
              </button>
            </div>
          </div>
        ) : (
          /* Inline Edit Profile Form */
          <div className="py-2 px-1 border-b border-slate-200 mb-2">
            <div className="font-bold text-xs text-slate-800 mb-2 text-center">
              ✏️ Edit Profile
            </div>

            {editSuccess && (
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded text-[11px] mb-2 text-center border border-emerald-300">
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">Email</label>
                <input
                  type="email"
                  value={customer?.email || ""}
                  disabled
                  className="w-full py-1.5 px-2 rounded border border-slate-200 bg-slate-50 text-slate-400 text-[11px] opacity-60 cursor-not-allowed box-border"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full py-1.5 px-2 rounded border border-slate-300 text-[11px] box-border outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  className="w-full py-1.5 px-2 rounded border border-slate-300 text-[11px] box-border outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-1.5 mt-0.5">
                <button type="submit" className="flex-1 py-1.5 text-[11px] font-bold rounded border-none bg-blue-600 text-white cursor-pointer shadow-sm hover:bg-blue-700 transition">
                  Save
                </button>
                <button type="button" onClick={() => { setEditingProfile(false); setEditSuccess(""); }} className="flex-1 py-1.5 text-[11px] font-bold rounded border border-slate-300 bg-transparent text-slate-500 cursor-pointer hover:bg-slate-100 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Section Header */}
        <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest px-3 py-1 text-left">
          Customer Menu
        </div>

        {/* Navigation links */}
        <div className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { navigate(`/customer/${item.key}`); setEditingProfile(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl no-underline text-[14.5px] font-extrabold transition-all border-none text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-900 bg-transparent hover:bg-slate-100'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-lg shrink-0 ${
                  isActive ? 'bg-white/25' : ''
                }`} style={{ backgroundColor: isActive ? undefined : item.bg }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Logout */}
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

      {/* MAIN CONTENT PANEL */}
      <div className="flex-1 min-w-0 overflow-y-visible">
        {renderTabContent()}
      </div>

      {/* FLOATING STICKY BOOK YOUR TRIP CTA BUTTON */}
      <button
        onClick={() => navigate("/customer/booking")}
        className="animate-fade-in fixed bottom-7 right-7 z-[999] px-5 py-3.5 rounded-full bg-blue-600 text-white font-extrabold text-sm border-none shadow-xl cursor-pointer flex items-center gap-2.5 transition hover:scale-105 hover:-translate-y-0.5 hover:bg-blue-700"
        title="Book Your Trip"
      >
        <span className="text-lg">🚗</span>
        <span>Book Your Trip</span>
      </button>

    </div>
  );
}

export default CustomerDashboard;
