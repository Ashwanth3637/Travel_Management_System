import React, { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaCircle } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function DriverProfile() {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_URL}/driver/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { setDriver(data); setLoading(false); })
      .catch(() => {
        const cached = JSON.parse(localStorage.getItem("driver"));
        if (cached) setDriver(cached);
        setError("Could not refresh profile from server.");
        setLoading(false);
      });
  }, []);

  const statusColor =
    driver?.status === "Available" ? "#10b981" :
    driver?.status === "On Trip" ? "#d97706" : "#64748b";

  const fields = [
    { icon: <FaUser />, label: "Full Name", value: driver?.name },
    { icon: <FaEnvelope />, label: "Email Address", value: driver?.email },
    { icon: <FaPhone />, label: "Phone Number", value: driver?.phone },
    { icon: <FaIdCard />, label: "License Number", value: driver?.licenseNumber },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-[28px] font-bold mb-2">My Profile</h2>
        <p className="text-slate-500">Your personal information and account details.</p>
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-lg text-[13px] mb-5 text-amber-700 bg-amber-50 border border-amber-500">{error}</div>
      )}

      {loading ? (
        <div className="glass-panel text-center py-10 text-slate-400">Loading profile...</div>
      ) : (
        <div className="glass-panel max-w-[600px]">
          <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-200">
            <div className="text-[22px] font-bold">{driver?.name}</div>
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: statusColor }}>
              <FaCircle size={10} color={statusColor} />
              <span>{driver?.status || "Unknown"}</span>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            {fields.map(f => (
              <div key={f.label} className="form-group mb-0">
                <label className="form-label flex items-center gap-2">{f.icon} {f.label}</label>
                <div className="form-input bg-white/5">{f.value || "N/A"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
