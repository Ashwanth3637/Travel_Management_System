/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";

function CustomerBookingHistory({ token, customer, onSelectTrackTrip }) {
  const API_URL = "http://localhost:5001/api";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [historyCategory, setHistoryCategory] = useState(null);
  const [subHistoryModel, setSubHistoryModel] = useState(null);

  const HISTORY_CATEGORIES = [
    { type: 'Sedan', img: '/cars/sedan/swift_dzire.png', color: '#2563eb' },
    { type: 'SUV', img: '/cars/suv/mahindra_thar.png', color: '#f97316' },
    { type: 'Luxury', img: '/cars/luxury/bmw.png', color: '#8b5cf6' },
    { type: 'Minivan', img: '/cars/minivan/tempo_traveller.png', color: '#10b981' }
  ];
  const [assignedDetails, setAssignedDetails] = useState({ driver: null, vehicle: null });
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [submittingRating, setSubmittingRating] = useState(5);
  const [submittingComment, setSubmittingComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (submittingRating < 1 || submittingRating > 5) {
      alert("Please select a rating between 1 and 5 stars.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/customer/bookings/${selectedBooking.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: submittingRating,
          feedback: submittingComment,
          customerName: customer ? customer.name : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback.");
      alert("Thank you for your feedback!");
      setSelectedBooking({ ...selectedBooking, rating: submittingRating, feedback: submittingComment });
      setSubmittingComment('');
      fetchBookings();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const [vehicles, setVehicles] = useState([]);

  const fetchBookings = useCallback(async () => {
    if (!customer) return;
    setLoading(true);
    setError("");
    try {
      const [bRes, vRes] = await Promise.all([
        fetch(`${API_URL}/customer/bookings?customerName=${encodeURIComponent(customer.name)}`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${API_URL}/vehicles`, { headers: { "Authorization": `Bearer ${token}` } }).catch(() => null)
      ]);
      const contentType = bRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned HTML or invalid response. Please restart your backend server to load the new APIs.");
      }
      const data = await bRes.json();
      if (!bRes.ok) {
        throw new Error(data.error || "Failed to load bookings.");
      }
      if (vRes && vRes.ok) {
        const vData = await vRes.json();
        setVehicles(Array.isArray(vData) ? vData : (vData.vehicles || []));
      }
      const sorted = (data || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setBookings(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, customer]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setError("");
    try {
      const res = await fetch(`${API_URL}/customer/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: customer ? customer.name : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel booking.");
      }
      alert("Booking cancelled successfully.");
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewDetails = async (booking) => {
    setSelectedBooking(booking);
    setAssignedDetails({ driver: null, vehicle: null });

    if (booking.assignedDriverId || booking.assignedVehicleId) {
      setDetailsLoading(true);
      try {
        const res = await fetch(`${API_URL}/customer/assigned-resources/${booking.id}?customerName=${encodeURIComponent(customer ? customer.name : "")}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setAssignedDetails(data);
        }
      } catch (err) {
        console.error("Failed to load assigned resource details", err);
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case "Pending": return "badge-pending";
      case "Confirmed":
      case "Driver Assigned":
      case "Vehicle Assigned":
      case "Trip Scheduled":
        return "badge-confirmed";
      case "In Progress":
      case "Trip Started":
      case "Customer Picked Up":
      case "Ongoing":
      case "Destination Reached":
        return "badge-inprogress";
      case "Completed":
      case "Trip Completed":
        return "badge-completed";
      case "Cancelled": return "badge-cancelled";
      default: return "";
    }
  };

  if (selectedBooking) {
    return (
      <div className="animate-fade-in text-left">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-extrabold m-0">Booking Details ({selectedBooking.id})</h2>
          <button className="btn btn-secondary px-4 py-2" onClick={() => setSelectedBooking(null)}>
            ← Back to History
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-500 rounded-lg text-sm mb-5 border border-red-200">
            {error}
          </div>
        )}

        <div className="glass-panel p-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mb-7">
            <div>
              <h3 className="text-base font-bold m-0 mb-3.5 pb-2 border-b border-slate-200 text-blue-600">
                Ride Information
              </h3>
              <div className="details-list">
                <div className="details-row"><span className="details-label">Booking ID</span><span className="details-value font-bold">#{selectedBooking.id}</span></div>
                <div className="details-row"><span className="details-label">Rider Name</span><span className="details-value">{selectedBooking.customerName}</span></div>
                <div className="details-row"><span className="details-label">Contact Details</span><span className="details-value">{selectedBooking.customerContact || 'N/A'}</span></div>
                <div className="details-row"><span className="details-label">Booking Date</span><span className="details-value">{selectedBooking.bookingDate || (selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleDateString() : 'N/A')}</span></div>
                <div className="details-row"><span className="details-label">Vehicle Category</span><span className="details-value">{selectedBooking.vehicleType}</span></div>
                <div className="details-row"><span className="details-label">Estimated Fare</span><span className="details-value font-bold text-emerald-500">₹{selectedBooking.fareEstimated.toLocaleString()}</span></div>
                <div className="details-row"><span className="details-label">Status</span><span className="details-value"><span className={`badge ${getBadgeClass(selectedBooking.status)}`}>{selectedBooking.status}</span></span></div>
                {selectedBooking.startOtp && (
                  <div className="details-row mt-1.5 pt-1.5 border-t border-dashed border-slate-200">
                    <span className="details-label font-bold text-blue-600">🔑 Start Trip OTP</span>
                    <span className="details-value font-black tracking-widest text-slate-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                      {selectedBooking.startOtp}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold m-0 mb-3.5 pb-2 border-b border-slate-200 text-blue-600">
                Route &amp; Schedule
              </h3>
              <div className="details-list">
                <div className="details-row"><span className="details-label">Pickup Location</span><span className="details-value">{selectedBooking.pickupLocation}</span></div>
                <div className="details-row"><span className="details-label">Destination Location</span><span className="details-value">{selectedBooking.dropLocation}</span></div>
                <div className="details-row"><span className="details-label">Travel Date</span><span className="details-value">{selectedBooking.travelDate || new Date(selectedBooking.pickupDateTime).toLocaleDateString()}</span></div>
                <div className="details-row"><span className="details-label">Travel Time</span><span className="details-value">{selectedBooking.travelTime || new Date(selectedBooking.pickupDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                <div className="details-row"><span className="details-label">Trip Type</span><span className="details-value font-semibold text-blue-600">{selectedBooking.tripType || 'One Way'}</span></div>
                <div className="details-row"><span className="details-label">No. of Passengers</span><span className="details-value">{selectedBooking.passengersCount || 1} Passengers</span></div>
              </div>
            </div>
          </div>

          {selectedBooking.notes && (
            <div className="mb-7 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold mb-1 uppercase">Special Requests / Notes</div>
              <div className="text-sm text-slate-800 leading-relaxed">{selectedBooking.notes}</div>
            </div>
          )}

          {/* Assigned Fleet / Driver details */}
          <div className="border-t border-slate-200 pt-5 mb-7">
            <h3 className="text-base font-bold m-0 mb-3.5 text-blue-600">Assigned Fleet &amp; Driver Details</h3>
            {detailsLoading ? (
              <span className="text-sm text-slate-500">Loading assigned resources...</span>
            ) : assignedDetails.driver || assignedDetails.vehicle ? (
              <div className="flex flex-col gap-3.5">
                {assignedDetails.vehicle && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-5">
                    {assignedDetails.vehicle.image && (
                      <img src={assignedDetails.vehicle.image} alt={assignedDetails.vehicle.name} className="w-[90px] h-[60px] rounded-md object-contain bg-black/10" />
                    )}
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold uppercase mb-1 tracking-wide">Assigned Vehicle</div>
                      <div className="text-base font-bold text-slate-800">{assignedDetails.vehicle.name}</div>
                      <div className="text-xs text-slate-500 mt-1">Plate Number: <span className="font-mono font-bold">{assignedDetails.vehicle.plateNumber}</span></div>
                      <div className="text-xs text-slate-500 mt-0.5">Type: {assignedDetails.vehicle.type} ({assignedDetails.vehicle.acpreference})</div>
                    </div>
                  </div>
                )}
                {assignedDetails.driver && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                    <img src={assignedDetails.driver.photo || (assignedDetails.driver.gender?.toLowerCase() === 'female' ? '/drivers/driver_avatar_4.png' : '/drivers/driver_avatar_1.png')} alt={assignedDetails.driver.name} className="w-14 h-14 rounded-full object-cover border-2 border-blue-600" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold uppercase mb-1 tracking-wide">Assigned Driver</div>
                      <div className="text-base font-bold text-slate-800">{assignedDetails.driver.name}</div>
                      <div className="text-xs text-slate-500 mt-1">Phone: <a href={`tel:${assignedDetails.driver.phone}`} className="color-emerald-500 font-semibold no-underline">{assignedDetails.driver.phone}</a></div>
                      <div className="text-xs text-slate-500 mt-0.5">License: {assignedDetails.driver.licenseNumber}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-slate-500">
                {selectedBooking.status === "Cancelled" ? "No resources assigned to cancelled booking." : "Awaiting dispatch assignment by Administrator."}
              </span>
            )}
          </div>

          {/* Feedback Section */}
          {selectedBooking.status === "Completed" && (
            <div className="border-t border-slate-200 pt-5 mb-7">
              <h3 className="text-base font-bold m-0 mb-3.5 text-blue-600">Trip Feedback &amp; Rating</h3>
              {selectedBooking.rating > 0 ? (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-sm font-semibold text-slate-500">Your Rating:</span>
                    <span className="text-lg color-amber-400">{'★'.repeat(selectedBooking.rating)}{'☆'.repeat(5 - selectedBooking.rating)}</span>
                  </div>
                  {selectedBooking.feedback && (
                    <div>
                      <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Your Comments</div>
                      <div className="text-sm text-slate-800 italic leading-relaxed">"{selectedBooking.feedback}"</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <span className="text-sm font-semibold text-slate-800">Rate your experience:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} onClick={() => setSubmittingRating(star)} className={`text-2xl cursor-pointer transition ${star <= submittingRating ? 'text-amber-400' : 'text-slate-300'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className="form-group mb-3.5">
                    <label className="form-label">Review Comments</label>
                    <textarea className="form-input min-h-[80px] resize-y w-full box-border" placeholder="Share details of your ride experience..." value={submittingComment} onChange={(e) => setSubmittingComment(e.target.value)} />
                  </div>
                  <button className="btn btn-primary px-5 py-2 text-xs" onClick={handleSubmitFeedback} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3.5 border-t border-slate-200 pt-5 justify-end">
            {(selectedBooking.status === "Pending" || selectedBooking.status === "Confirmed") && (
              <button className="btn btn-danger px-5 py-2.5 text-sm" onClick={() => handleCancelBooking(selectedBooking.id)}>
                Cancel Booking Request
              </button>
            )}
            <button className="btn btn-secondary px-5 py-2.5 text-sm" onClick={() => setSelectedBooking(null)}>
              Back to History Log
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in text-left">
      {!historyCategory ? (
        <>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-extrabold m-0">Your Booking History</h2>
            <button className="btn btn-secondary px-4 py-2" onClick={fetchBookings}>🔄 Refresh Log</button>
          </div>

          {error && <div className="p-3.5 bg-red-50 text-red-500 rounded-lg text-sm mb-5 border border-red-200">{error}</div>}

          {loading ? (
            <div className="glass-panel p-10 text-base text-slate-400">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="glass-panel p-15 text-slate-400 text-center">
              <p className="text-lg font-semibold mb-2 text-slate-800">No bookings found</p>
              <p className="text-sm">You haven't requested any rides yet. Book a cab to start!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
              {HISTORY_CATEGORIES.map(cat => {
                const count = bookings.filter(b => b.vehicleType && b.vehicleType.toLowerCase() === cat.type.toLowerCase()).length;
                return (
                  <div
                    key={cat.type}
                    className="glass-panel p-7 rounded-xl text-center cursor-pointer transition-all duration-300 flex flex-col items-center gap-2.5 hover:-translate-y-1 hover:shadow-xl hover:bg-white/5 border-l-4"
                    style={{ borderLeftColor: cat.color }}
                    onClick={() => setHistoryCategory(cat.type)}
                  >
                    <img src={cat.img} alt={cat.type} className="w-[95px] h-[62px] object-contain mb-2 rounded" />
                    <div className="text-lg font-extrabold">{cat.type} History</div>
                    <div className="text-sm text-slate-500">{count} {count === 1 ? 'booking' : 'bookings'} found</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3.5">
              <button
                className="btn btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-lg"
                onClick={() => subHistoryModel ? setSubHistoryModel(null) : setHistoryCategory(null)}
              >
                ← {subHistoryModel ? `Back to ${historyCategory} Folders` : 'Back to History'}
              </button>
              <div>
                <h3 className="m-0 flex items-center gap-2 text-xl font-bold">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: HISTORY_CATEGORIES.find(c => c.type.toLowerCase() === historyCategory.toLowerCase())?.color || '#2563eb' }} />
                  {subHistoryModel ? `${subHistoryModel} History Folder` : `${historyCategory} Category History`}
                </h3>
                <span className="text-xs text-slate-500">
                  {subHistoryModel ? `Showing your bookings for ${subHistoryModel}` : `Select a car model folder (WagonR, Brezza, Aura, Dzire, etc.)`}
                </span>
              </div>
            </div>
            <button className="btn btn-secondary px-4 py-2" onClick={fetchBookings}>🔄 Refresh Log</button>
          </div>

          {error && <div className="p-3.5 bg-red-50 text-red-500 rounded-lg text-sm mb-5 border border-red-200">{error}</div>}

          {loading ? (
            <div className="glass-panel p-10 text-base text-slate-400">Loading bookings...</div>
          ) : !subHistoryModel ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
              {(() => {
                const DEFAULT_SUBMODELS = {
                  Sedan: ['Swift Dzire', 'Vitara Brezza', 'WagonR', 'Baleno', 'Aura'],
                  SUV: ['Innova Crysta', 'Mahindra Thar', 'Mahindra Scorpio', 'Fortuner', 'Bolero'],
                  Luxury: ['BMW 5 Series', 'Audi A6', 'Mercedes E-Class'],
                  Minivan: ['Tempo Traveller', 'Urbania']
                };
                const categoryBookings = bookings.filter(b => b.vehicleType && b.vehicleType.toLowerCase() === historyCategory.toLowerCase());
                const subModelGroups = {};
                const defaults = DEFAULT_SUBMODELS[historyCategory] || [];
                
                categoryBookings.forEach((b, idx) => {
                  const vObj = vehicles.find(v => v.id === b.assignedVehicleId || v._id === b.assignedVehicleId);
                  const exactName = vObj?.name || b.assignedVehicleName || (b.vehicleType !== historyCategory ? b.vehicleType : null);
                  let targetGroup = exactName;
                  if (exactName) {
                    const matchedDefault = defaults.find(d => d.toLowerCase() === exactName.toLowerCase() || exactName.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(exactName.toLowerCase()));
                    if (matchedDefault) targetGroup = matchedDefault;
                  }
                  if (!targetGroup && defaults.length > 0) targetGroup = defaults[idx % defaults.length];
                  if (targetGroup) {
                    if (!subModelGroups[targetGroup]) subModelGroups[targetGroup] = [];
                    subModelGroups[targetGroup].push(b);
                  }
                });

                defaults.forEach(defName => { if (!subModelGroups[defName]) subModelGroups[defName] = []; });
                const groupKeys = Object.keys(subModelGroups).filter(k => k.toLowerCase() !== historyCategory.toLowerCase());

                return groupKeys.map(modelName => {
                  const subBookings = subModelGroups[modelName];
                  const catColor = HISTORY_CATEGORIES.find(c => c.type.toLowerCase() === historyCategory.toLowerCase())?.color || '#3b82f6';
                  const sampleImg = HISTORY_CATEGORIES.find(c => c.type.toLowerCase() === historyCategory.toLowerCase())?.img;

                  return (
                    <div
                      key={modelName}
                      className="glass-panel p-6 rounded-xl text-center cursor-pointer transition-all duration-300 flex flex-col items-center gap-2.5 hover:-translate-y-1 hover:shadow-xl hover:bg-white/5 border-l-4"
                      style={{ borderLeftColor: catColor }}
                      onClick={() => setSubHistoryModel(modelName)}
                    >
                      {sampleImg ? (
                        <img src={sampleImg} alt={modelName} className="w-[95px] h-[62px] object-contain mb-2 rounded" />
                      ) : (
                        <div className="text-3xl mb-2">📁</div>
                      )}
                      <div className="text-base font-extrabold">{modelName} History</div>
                      <div className="text-xs text-slate-500">{subBookings.length} {subBookings.length === 1 ? 'booking' : 'bookings'} found</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSubHistoryModel(modelName); }}
                        className="mt-2.5 w-full py-2 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-600 hover:text-white transition"
                      >
                        Open {modelName} History
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="table-container glass-panel p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Pickup / Destination</th>
                    <th>Pickup Date &amp; Time</th>
                    <th>Vehicle Class</th>
                    <th>Estimated Fare</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const DEFAULT_SUBMODELS = {
                      Sedan: ['Swift Dzire', 'Vitara Brezza', 'WagonR', 'Baleno', 'Aura'],
                      SUV: ['Innova Crysta', 'Mahindra Thar', 'Mahindra Scorpio', 'Fortuner', 'Bolero'],
                      Luxury: ['BMW 5 Series', 'Audi A6', 'Mercedes E-Class'],
                      Minivan: ['Tempo Traveller', 'Urbania']
                    };
                    const defaults = DEFAULT_SUBMODELS[historyCategory] || [];
                    const categoryBookings = bookings.filter(b => b.vehicleType && b.vehicleType.toLowerCase() === historyCategory.toLowerCase());

                    const filtered = categoryBookings.filter((b, idx) => {
                      const vObj = vehicles.find(v => v.id === b.assignedVehicleId || v._id === b.assignedVehicleId);
                      const exactName = vObj?.name || b.assignedVehicleName || (b.vehicleType !== historyCategory ? b.vehicleType : null);
                      let targetGroup = exactName;
                      if (exactName) {
                        const matchedDefault = defaults.find(d => d.toLowerCase() === exactName.toLowerCase() || exactName.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(exactName.toLowerCase()));
                        if (matchedDefault) targetGroup = matchedDefault;
                      }
                      if (!targetGroup && defaults.length > 0) targetGroup = defaults[idx % defaults.length];
                      return targetGroup === subHistoryModel;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" className="text-center text-slate-400 py-8">
                            No {subHistoryModel} bookings found.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((b) => (
                      <tr key={b.id}>
                        <td className="font-bold">{b.id}</td>
                        <td>
                          <div className="font-semibold">{b.pickupLocation}</div>
                          <div className="text-xs text-slate-400 mt-1">→ {b.dropLocation}</div>
                        </td>
                        <td>{new Date(b.pickupDateTime).toLocaleString()}</td>
                        <td>{subHistoryModel || b.vehicleType}</td>
                        <td className="font-bold text-emerald-500">₹{b.fareEstimated.toLocaleString()}</td>
                        <td><span className={`badge ${getBadgeClass(b.status)}`}>{b.status}</span></td>
                        <td className="text-center">
                          <div className="flex gap-2 items-center justify-between w-full min-w-[170px]">
                            <button className="btn btn-view px-3 py-1 text-xs rounded-md whitespace-nowrap" onClick={() => handleViewDetails(b)}>
                              View Details
                            </button>
                            {["In Progress", "Trip Started", "Customer Picked Up", "Ongoing", "Destination Reached"].includes(b.status) && (
                              <button className="btn btn-primary px-3 py-1 text-xs rounded-md whitespace-nowrap" onClick={() => onSelectTrackTrip(b)}>
                                Track Trip
                              </button>
                            )}
                            {(b.status === "Pending" || b.status === "Confirmed") && (
                              <button className="btn btn-danger px-3 py-1 text-xs rounded-md whitespace-nowrap" onClick={() => handleCancelBooking(b.id)}>
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CustomerBookingHistory;
