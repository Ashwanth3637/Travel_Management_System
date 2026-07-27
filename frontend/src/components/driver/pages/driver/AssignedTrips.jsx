import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaMapMarkerAlt, FaCalendarAlt, FaPlay, FaRupeeSign } from "react-icons/fa";

const API_URL = "http://localhost:5001/api";

export default function AssignedTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const token = localStorage.getItem("token");

  const fetchTrips = (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    fetch(`${API_URL}/driver/trips`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const active = data.filter(t => ["Confirmed", "Driver Assigned", "Vehicle Assigned", "Trip Scheduled", "Trip Started", "Customer Picked Up", "Ongoing", "Destination Reached"].includes(t.status));
        setTrips(active);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load trips.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrips(true);
    const interval = setInterval(() => {
      fetchTrips(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [otpTripId, setOtpTripId] = useState(null);
  const [otpInput, setOtpInput] = useState("");

  const updateStatus = async (tripId, status, otp = null) => {
    setUpdating(tripId);
    setError("");
    try {
      const res = await fetch(`${API_URL}/driver/trips/${tripId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, otp })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }
      setToast(`Trip marked as "${status}" successfully!`);
      setTimeout(() => setToast(""), 3000);
      setOtpTripId(null);
      setOtpInput("");
      fetchTrips();
    } catch (err) {
      setError(err.message || "Failed to update trip status.");
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dt) => new Date(dt).toLocaleString("en-IN", {
    dateStyle: "medium", timeStyle: "short"
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-[28px] font-bold mb-2">Assigned Trips</h2>
        <p className="text-slate-500">View and manage your upcoming and active trips.</p>
      </div>

      {toast && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium mb-5 text-emerald-600 bg-emerald-50 border border-emerald-500">
          {toast}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium mb-5 text-red-600 bg-red-50 border border-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel text-center py-10 text-slate-400">
          Loading trips...
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {trips.length > 0 ? trips.map(trip => (
            <div key={trip.id} className="glass-panel">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-bold">{trip.customerName}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      trip.status === "In Progress" ? "bg-blue-100 text-blue-600" : "bg-blue-50 text-blue-500"
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-slate-500 text-sm">
                    <div className="flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-blue-600" />
                      {trip.pickupLocation} → {trip.dropLocation}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-blue-500" />
                      {formatDate(trip.pickupDateTime)}
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <FaRupeeSign className="text-emerald-500" />
                      Fare: ₹{trip.fareEstimated?.toLocaleString("en-IN")}
                    </div>
                    <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-xl text-xs font-extrabold border border-green-300">
                      💰 Your Earning: ₹{Math.round((trip.fareEstimated || 0) * 0.85).toLocaleString("en-IN")} (85%)
                    </div>
                  </div>
                  {trip.notes && (
                    <div className="mt-2.5 text-xs text-slate-400 italic">
                      Note: {trip.notes}
                    </div>
                  )}
                </div>
                <div className="flex gap-2.5 shrink-0">
                  {["Confirmed", "Driver Assigned", "Vehicle Assigned", "Trip Scheduled"].includes(trip.status) && (
                    <button
                      className="btn btn-start px-4 py-2.5 flex items-center gap-2"
                      disabled={updating === trip.id}
                      onClick={() => {
                        setOtpTripId(trip.id);
                        setOtpInput("");
                        setError("");
                      }}
                    >
                      <FaPlay /> {updating === trip.id ? "Updating..." : "Start Trip"}
                    </button>
                  )}
                  {trip.status === "Trip Started" && (
                    <button
                      className="btn btn-warning px-4 py-2.5"
                      disabled={updating === trip.id}
                      onClick={() => updateStatus(trip.id, "Customer Picked Up")}
                    >
                      👤 {updating === trip.id ? "Updating..." : "Customer Picked Up"}
                    </button>
                  )}
                  {trip.status === "Customer Picked Up" && (
                    <button
                      className="btn btn-indigo px-4 py-2.5"
                      disabled={updating === trip.id}
                      onClick={() => updateStatus(trip.id, "Ongoing")}
                    >
                      🚖 {updating === trip.id ? "Updating..." : "Trip Ongoing"}
                    </button>
                  )}
                  {["Ongoing", "In Progress"].includes(trip.status) && (
                    <button
                      className="btn btn-warning px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                      disabled={updating === trip.id}
                      onClick={() => updateStatus(trip.id, "Destination Reached")}
                    >
                      🏁 {updating === trip.id ? "Updating..." : "End Trip / Destination Reached"}
                    </button>
                  )}
                  {["Destination Reached", "Completed", "Trip Completed"].includes(trip.status) && (
                    <div className="flex flex-col gap-2 items-end">
                      <div className="text-xs font-black text-blue-600">
                        Fare: ₹{(trip.fareEstimated || 1850).toLocaleString('en-IN')}
                      </div>

                      {trip.paymentStatus === 'Paid' ? (
                        <div className="flex flex-col gap-1.5 items-end">
                          <span className="text-[12.5px] font-extrabold bg-green-100 text-green-800 px-3 py-1.5 rounded-lg border border-green-300">
                            Payment Received ✔ {trip.paymentMethod || 'Google Pay'}
                          </span>
                          <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                            🎉 Driver Net Earning (85%): ₹{Math.round((trip.fareEstimated || 1850) * 0.85).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            🏢 Admin Commission (15%): ₹{Math.round((trip.fareEstimated || 1850) * 0.15).toLocaleString('en-IN')}
                          </span>
                          {trip.status === "Destination Reached" && (
                            <button
                              className="btn btn-success px-4 py-2 bg-emerald-500 text-white text-xs font-extrabold rounded-lg"
                              disabled={updating === trip.id}
                              onClick={() => updateStatus(trip.id, "Completed")}
                            >
                              🏁 Complete Ride
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11.5px] text-amber-800 bg-amber-100 px-3 py-1.5 rounded-lg font-bold border border-amber-300">
                            ⏳ Waiting for Customer to Pay Fare (Online / Cash)...
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="glass-panel text-center py-12 text-slate-400">
              You have no assigned trips at the moment.
            </div>
          )}
        </div>
      )}

      {/* OTP Verification Modal Portal */}
      {otpTripId && createPortal(
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-[999999]">
          <div className="w-[90%] max-w-[420px] bg-white rounded-2xl p-8 text-center shadow-2xl border border-slate-300">
            <div className="text-4xl mb-2">🔑</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">
              Enter Customer OTP
            </h3>
            <p className="text-slate-500 text-[13.5px] mb-6 leading-relaxed">
              Ask customer for the 4-digit OTP displayed on their booking confirmation to verify and start the trip.
            </p>

            <input
              type="text"
              maxLength={4}
              placeholder="e.g. 1234"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full p-4 text-3xl font-black tracking-[12px] text-center rounded-xl border-2 border-blue-600 bg-slate-50 text-slate-800 outline-none mb-6 shadow-md"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                className="flex-1 p-3 text-sm font-bold rounded-lg border border-slate-300 bg-slate-100 text-slate-600 cursor-pointer hover:bg-slate-200 transition"
                onClick={() => { setOtpTripId(null); setOtpInput(""); }}
              >
                Cancel
              </button>
              <button
                className={`flex-1 p-3 text-sm font-extrabold rounded-lg border-none text-white transition ${
                  otpInput.length === 4 ? "bg-emerald-500 shadow-lg cursor-pointer hover:bg-emerald-600" : "bg-slate-300 cursor-not-allowed"
                }`}
                disabled={otpInput.length !== 4 || updating === otpTripId}
                onClick={() => updateStatus(otpTripId, "Trip Started", otpInput)}
              >
                {updating === otpTripId ? "Verifying..." : "Verify & Start"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
