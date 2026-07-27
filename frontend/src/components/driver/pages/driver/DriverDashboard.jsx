import React, { useState, useEffect } from "react";
import { FaCarSide, FaCheckCircle, FaSpinner, FaCalendarCheck } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function DriverDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState("Driver");

  const fetchDashboardData = (isInitial = false) => {
    if (isInitial) setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/driver/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setRecentTrips((data.trips || []).filter(t => t.status !== "Completed" && t.status !== "Cancelled").slice(0, 5));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const driver = JSON.parse(localStorage.getItem("driver"));
    if (driver?.name) setDriverName(driver.name);
    fetchDashboardData(true);
    const interval = setInterval(() => fetchDashboardData(false), 3000);
    return () => clearInterval(interval);
  }, []);

  const totalEarnings = (stats?.trips || [])
    .filter(t => t.status === "Completed")
    .reduce((sum, t) => sum + Math.round((t.fareEstimated || 0) * 0.85), 0);

  const statCards = [
    { label: "Total Earnings", value: `₹${totalEarnings.toLocaleString("en-IN")}`, icon: "💰", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
    { label: "Total Trips", value: stats?.totalTrips ?? 0, icon: <FaCarSide />, color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    { label: "Completed", value: stats?.completedTrips ?? 0, icon: <FaCheckCircle />, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    { label: "Ongoing", value: stats?.ongoingTrips ?? 0, icon: <FaSpinner />, color: "#2563eb", bg: "rgba(37,99,235,0.15)" },
    { label: "Upcoming", value: stats?.upcomingTrips ?? 0, icon: <FaCalendarCheck />, color: "#d97706", bg: "rgba(217,119,6,0.15)" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-[28px] font-bold mb-2">Welcome back, {driverName}!</h2>
        <p className="text-slate-500">Here is your dashboard overview and ride earnings payout for today.</p>
      </div>

      {loading ? (
        <div className="glass-panel text-center py-10 text-slate-400">Loading dashboard...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 mb-9" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {statCards.map(card => (
              <div key={card.label} className="glass-panel flex items-center gap-4 px-5 py-[18px]">
                <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: card.bg, color: card.color }}>
                  {card.icon}
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase mb-0.5">{card.label}</div>
                  <div className="text-[22px] font-extrabold" style={{ color: card.label === "Total Earnings" ? "#10b981" : "#1e293b" }}>
                    {card.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Trips */}
          <div className="glass-panel">
            <h3 className="text-lg font-bold mb-5 pb-4 border-b border-slate-200">Active & Assigned Ride Earnings Payout</h3>
            {recentTrips.length > 0 ? recentTrips.map(trip => {
              const driverEarn = Math.round((trip.fareEstimated || 0) * 0.85);
              const isInProgress = trip.status === "In Progress";
              return (
                <div key={trip.id} className="flex justify-between items-center py-4 border-b border-slate-200 flex-wrap gap-3">
                  <div>
                    <div className="font-extrabold text-base mb-1">{trip.customerName}</div>
                    <div className="text-slate-500 text-[13px]">📍 {trip.pickupLocation} → {trip.dropLocation}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase">Ride Fare</div>
                      <div className="text-[15px] font-bold text-slate-800">₹{trip.fareEstimated?.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="bg-green-100 border border-green-300 px-3.5 py-1.5 rounded-xl text-right">
                      <div className="text-[10px] font-extrabold text-green-700 uppercase">Your Earning (85%)</div>
                      <div className="text-[17px] font-extrabold text-green-800">💰 ₹{driverEarn.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: isInProgress ? 'rgba(37,99,235,0.15)' : 'rgba(59,130,246,0.15)',
                        color: isInProgress ? '#2563eb' : '#3b82f6'
                      }}>
                      {trip.status}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-slate-400 text-center py-8">No active or upcoming trips.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
