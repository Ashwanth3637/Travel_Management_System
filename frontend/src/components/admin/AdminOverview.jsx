import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, AreaChart, DoughnutChart, HorizontalBarChart } from './ChartComponents';

function StatCard({ title, value, icon, color, subtitle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-white rounded-2xl p-4.5 flex items-center gap-3.5 transition-all duration-300 cursor-default shadow-sm border"
      style={{
        borderColor: hovered ? color : 'rgba(15, 23, 42, 0.12)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? `0 10px 25px ${color}33` : '0 4px 16px rgba(15, 23, 42, 0.05)'
      }}
    >
      <div
        className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ backgroundColor: `${color}18`, border: `1px solid ${color}33` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          {title}
        </div>
        <div className="text-[30px] font-extrabold leading-none" style={{ color }}>
          {value}
        </div>
        {subtitle && (
          <div className="text-[11px] text-slate-500 mt-1">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-1 h-4 rounded bg-blue-600" />
      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
        {label}
      </span>
    </div>
  );
}

function AdminOverview({ token, toast }) {
  const API_URL = 'http://localhost:5001/api';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      if (toast) toast(null, err.message);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    const updateTime = () => {
      const opts = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      setCurrentTime(new Date().toLocaleDateString('en-US', opts));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 60000);
    return () => { clearInterval(interval); clearInterval(timeInterval); };
  }, [fetchStats]);

  return (
    <div className="animate-fade-in flex flex-col gap-5 text-left pb-12">
      {/* STANDALONE ADMIN HEADER CARD */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white px-7 py-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
        <div>
          <h2 className="text-2xl font-extrabold m-0 text-slate-800 tracking-tight">
            Administration
          </h2>
          <p className="text-slate-500 text-sm m-0 font-medium">
            Fleet analytics, trip dispatch logistics, and system health hub
          </p>
        </div>

        <div className="text-[12.5px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-200 flex items-center gap-1.5">
          ⏱️ <span>{currentTime}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-slate-500 text-center text-sm font-semibold">
          <div className="inline-block text-3xl mb-3 animate-spin">🔄</div>
          <div>Initializing metrics engine...</div>
        </div>
      ) : stats ? (
        <>
          {/* 1. BOOKING & TRIP LIFECYCLE GRID */}
          <div>
            <SectionLabel label="Booking & Trip Lifecycle" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard title="Total Bookings"     value={stats.counts.bookings}   icon="📊" color="#2563eb" subtitle="All time records" />
              <StatCard title="Pending Bookings"   value={stats.counts.pending}    icon="⏳" color="#d97706" subtitle="Awaiting allocation" />
              <StatCard title="Confirmed Bookings" value={stats.counts.confirmed}  icon="📅" color="#2563eb" subtitle="Driver assigned" />
              <StatCard title="Ongoing Trips"      value={stats.counts.ongoing}    icon="🚗" color="#f59e0b" subtitle="Passengers in transit" />
              <StatCard title="Completed Trips"    value={stats.counts.completed}  icon="✅" color="#10b981" subtitle="Successfully closed" />
              <StatCard title="Cancelled Bookings" value={stats.counts.cancelled}  icon="❌" color="#ef4444" subtitle="Aborted requests" />
            </div>
          </div>

          {/* 2. FLEET STATISTICS + DRIVERS & CUSTOMERS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2.5">
            <div>
              <SectionLabel label="Fleet Statistics" />
              <div className="flex flex-col gap-3.5">
                <StatCard title="Total Vehicles"     value={stats.counts.vehicles}            icon="🚙" color="#8b5cf6" subtitle="Registered cars" />
                <StatCard title="Available Vehicles" value={stats.counts.availableVehicles}   icon="🟢" color="#16a34a" subtitle={`${stats.utilization?.vehicleRate ?? 0}% utilization rate`} />
                <StatCard title="Vehicles on Trip"   value={stats.counts.vehiclesOnTrip ?? 0} icon="🟠" color="#f97316" subtitle="Active telemetry" />
              </div>
            </div>

            <div>
              <SectionLabel label="Drivers & Customers" />
              <div className="flex flex-col gap-3.5">
                <StatCard title="Total Drivers"     value={stats.counts.drivers}          icon="👨‍✈️" color="#f97316" subtitle="Registered staff" />
                <StatCard title="Available Drivers" value={stats.counts.availableDrivers} icon="🛂"   color="#10b981" subtitle={`${stats.utilization?.driverRate ?? 0}% active rate`} />
                <StatCard title="Total Customers"   value={stats.counts.customers ?? 0}   icon="👥"   color="#06b6d4" subtitle="Registered user profiles" />
              </div>
            </div>
          </div>

          {/* 3. ANALYTICS & CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 mt-2.5">
            <div className="flex flex-col gap-5">
              <div className="glass-panel p-5">
                <div className="flex justify-between items-center mb-3.5">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase text-slate-500">Volume Overview</div>
                    <div className="text-base font-extrabold text-slate-800">Monthly Bookings Volume</div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-xl">
                    📈 +18% Growth
                  </span>
                </div>
                <BarChart data={stats.analytics?.monthlyData} dataKey="bookings" labelKey="label" color="#2563eb" />
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="glass-panel p-[22px] text-center flex flex-col items-center">
                <div className="text-[11px] font-extrabold uppercase text-slate-500 mb-3">
                  Fleet Readiness Index
                </div>
                
                <div className="relative w-[120px] h-[120px] flex items-center justify-center">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" stroke="#e2e8f0" strokeWidth="10" fill="none" />
                    <circle cx="60" cy="60" r="50" stroke="#2563eb" strokeWidth="10" fill="none" strokeDasharray="314" strokeDashoffset="35" strokeLinecap="round" transform="rotate(-90 60 60)" />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-2xl font-extrabold text-slate-800">{stats.utilization?.vehicleRate ?? 88}%</div>
                    <div className="text-[10px] text-slate-500 font-bold">READY</div>
                  </div>
                </div>
                <div className="text-xs text-emerald-600 font-bold mt-2.5">
                  ✅ {stats.counts.availableVehicles} Vehicles Available
                </div>
              </div>

              <div className="glass-panel p-5">
                <div className="text-[11px] font-extrabold uppercase text-slate-500 mb-3.5">
                  System Allocation
                </div>
                <div className="flex justify-around items-center">
                  <div className="text-center">
                    <div className="w-[46px] h-[46px] rounded-full border-4 border-blue-600 flex items-center justify-center font-extrabold text-xs text-blue-600 mx-auto mb-1.5">
                      {stats.counts.vehicles}
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">Vehicles</div>
                  </div>
                  <div className="text-center">
                    <div className="w-[46px] h-[46px] rounded-full border-4 border-emerald-500 flex items-center justify-center font-extrabold text-xs text-emerald-500 mx-auto mb-1.5">
                      {stats.counts.drivers}
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">Drivers</div>
                  </div>
                  <div className="text-center">
                    <div className="w-[46px] h-[46px] rounded-full border-4 border-orange-500 flex items-center justify-center font-extrabold text-xs text-orange-500 mx-auto mb-1.5">
                      {stats.counts.customers ?? 0}
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">Riders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: REVENUE & OPERATIONAL CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
            <div className="glass-panel p-6">
              <div className="mb-4">
                <h3 className="m-0 text-base font-extrabold">Revenue Overview</h3>
                <span className="text-xs text-slate-500">Earnings derived from completed bookings</span>
              </div>
              <AreaChart data={stats.analytics?.monthlyData} dataKey="revenue" labelKey="label" color="#eab308" formatVal={(v) => `₹${v}`} />
            </div>

            <div className="glass-panel p-6">
              <div className="mb-4">
                <h3 className="m-0 text-base font-extrabold">Daily Booking Load Trends</h3>
                <span className="text-xs text-slate-500">Operations volume over last 7 days</span>
              </div>
              <AreaChart data={stats.analytics?.dailyTrends} dataKey="count" labelKey="label" color="#f97316" />
            </div>
          </div>

          {/* SECTION 4: STATUS ALLOCATION & CLASS USAGE CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <div className="glass-panel p-6">
              <div className="mb-4">
                <h3 className="m-0 text-base font-extrabold">Trip Status Allocation</h3>
                <span className="text-xs text-slate-500">Breakdown share by booking status</span>
              </div>
              <div className="flex items-center justify-center min-h-[200px]">
                <DoughnutChart data={stats.analytics?.tripStatusBreakdown} />
              </div>
            </div>

            <div className="glass-panel p-6">
              <div className="mb-4">
                <h3 className="m-0 text-base font-extrabold">Fleet Utilization by Class</h3>
                <span className="text-xs text-slate-500">Share of trips by vehicle category</span>
              </div>
              <HorizontalBarChart data={stats.analytics?.vehicleTypeUsage || { Sedan: 0, SUV: 0, Luxury: 0, Minivan: 0 }} />
            </div>
          </div>
        </>
      ) : (
        <div className="py-20 text-slate-500 text-center text-sm">
          ⚠️ Unable to load dashboard stats. Please refresh.
        </div>
      )}
    </div>
  );
}

export default AdminOverview;
