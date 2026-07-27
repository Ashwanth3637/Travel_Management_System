import React, { useState, useEffect } from "react";
import { FaToggleOn, FaToggleOff, FaCircle } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function Availability() {
  const [status, setStatus] = useState("Available");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_URL}/driver/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { setStatus(data.status || "Available"); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleAvailability = async () => {
    const newStatus = status === "Available" ? "Offline" : "Available";
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_URL}/driver/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(newStatus);
      setToast(`Status updated to "${newStatus}"`);
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update availability.");
    } finally {
      setSaving(false);
    }
  };

  const isAvailable = status === "Available";
  const statusColor = isAvailable ? "#10b981" : "#64748b";

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-[28px] font-bold mb-2">Availability Status</h2>
        <p className="text-slate-500">Set your availability to receive new trip assignments.</p>
      </div>

      {toast && <div className="px-4 py-3 rounded-lg text-sm font-medium mb-5 text-emerald-600 bg-emerald-50 border border-emerald-500">{toast}</div>}
      {error && <div className="px-4 py-3 rounded-lg text-sm font-medium mb-5 text-red-600 bg-red-50 border border-red-400">{error}</div>}

      <div className="glass-panel max-w-[480px]">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : (
          <div className="flex flex-col items-center text-center py-2.5">
            <div className="text-[90px] mb-4 transition-colors" style={{ color: statusColor }}>
              {isAvailable ? <FaToggleOn /> : <FaToggleOff />}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <FaCircle size={10} color={statusColor} />
              <h3 className="text-[22px] font-semibold m-0" style={{ color: statusColor }}>
                {isAvailable ? "You are Available" : "You are Offline"}
              </h3>
            </div>
            <p className="text-slate-500 mb-8 text-sm">
              {isAvailable
                ? "You can currently receive new trip assignments from the admin."
                : "You will not receive any new trip assignments until you go online."}
            </p>
            <button
              className={`btn ${isAvailable ? "btn-danger" : "btn-primary"} w-full py-3.5 text-base`}
              onClick={toggleAvailability} disabled={saving}>
              {saving ? "Updating..." : isAvailable ? "Go Offline" : "Go Online"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
