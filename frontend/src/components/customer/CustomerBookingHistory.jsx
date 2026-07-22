/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";

function CustomerBookingHistory({ token, customer, onSelectTrackTrip }) {
  const API_URL = "http://localhost:5001/api";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [historyCategory, setHistoryCategory] = useState(null);

  const HISTORY_CATEGORIES = [
    { type: 'Sedan', img: '/cars/sedan/swift_dzire.png', color: 'var(--color-primary)' },
    { type: 'SUV', img: '/cars/suv/mahindra_thar.png', color: '#f59e0b' },
    { type: 'Luxury', img: '/cars/luxury/bmw.png', color: '#10b981' },
    { type: 'Minivan', img: '/cars/minivan/tempo_traveller.png', color: '#6366f1' }
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

  const fetchBookings = useCallback(async () => {
    if (!customer) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/customer/bookings?customerName=${encodeURIComponent(customer.name)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned HTML or invalid response. Please restart your backend server to load the new APIs.");
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load bookings.");
      }
      // Sort bookings by creation date/time (newest first)
      const sorted = (data || []).sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
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
          headers: {
            "Authorization": `Bearer ${token}`
          }
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

  // Helper to get status badge styling class
  const getBadgeClass = (status) => {
    switch (status) {
      case "Pending": return "badge-pending";
      case "Confirmed": return "badge-confirmed";
      case "In Progress": return "badge-inprogress";
      case "Completed": return "badge-completed";
      case "Cancelled": return "badge-cancelled";
      default: return "";
    }
  };

  if (selectedBooking) {
    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Booking Details ({selectedBooking.id})</h2>
          <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>
            ← Back to History
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--status-cancelled-bg)',
            color: 'var(--status-cancelled)',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '20px',
            border: '1px solid var(--status-cancelled)',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <div className="glass-panel" style={{ padding: '30px', textAlign: 'left' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', marginBottom: '30px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 15px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--color-primary)' }}>
                Ride Information
              </h3>
              <div className="details-list">
                <div className="details-row">
                  <span className="details-label">Booking ID</span>
                  <span className="details-value" style={{ fontWeight: '700' }}>#{selectedBooking.id}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Rider Name</span>
                  <span className="details-value">{selectedBooking.customerName}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Contact Details</span>
                  <span className="details-value">{selectedBooking.customerContact || 'N/A'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Booking Date</span>
                  <span className="details-value">
                    {selectedBooking.bookingDate || (selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleDateString() : 'N/A')}
                  </span>
                </div>
                <div className="details-row">
                  <span className="details-label">Vehicle Category</span>
                  <span className="details-value">{selectedBooking.vehicleType}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Estimated Fare</span>
                  <span className="details-value" style={{ color: '#10b981', fontWeight: '700' }}>
                    ₹{selectedBooking.fareEstimated.toLocaleString()}
                  </span>
                </div>
                <div className="details-row">
                  <span className="details-label">Status</span>
                  <span className="details-value">
                    <span className={`badge ${getBadgeClass(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </span>
                </div>
                {selectedBooking.startOtp && (
                  <div className="details-row" style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)' }}>
                    <span className="details-label" style={{ color: 'var(--color-primary)', fontWeight: '700' }}>🔑 Start Trip OTP</span>
                    <span className="details-value" style={{ fontWeight: '800', letterSpacing: '2px', color: '#fcfcfd', background: 'rgba(197, 168, 92, 0.2)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--color-primary)' }}>
                      {selectedBooking.startOtp}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 15px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--color-primary)' }}>
                Route & Schedule
              </h3>
              <div className="details-list">
                <div className="details-row">
                  <span className="details-label">Pickup Location</span>
                  <span className="details-value">{selectedBooking.pickupLocation}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Destination Location</span>
                  <span className="details-value">{selectedBooking.dropLocation}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Travel Date</span>
                  <span className="details-value">{selectedBooking.travelDate || new Date(selectedBooking.pickupDateTime).toLocaleDateString()}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Travel Time</span>
                  <span className="details-value">{selectedBooking.travelTime || new Date(selectedBooking.pickupDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Trip Type</span>
                  <span className="details-value" style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{selectedBooking.tripType || 'One Way'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">No. of Passengers</span>
                  <span className="details-value">{selectedBooking.passengersCount || 1} Passengers</span>
                </div>
              </div>
            </div>
          </div>

          {selectedBooking.notes && (
            <div style={{ marginBottom: '30px', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>
                Special Requests / Notes
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                {selectedBooking.notes}
              </div>
            </div>
          )}

          {/* Assigned Fleet / Driver details */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 15px 0', color: 'var(--color-primary)' }}>
              Assigned Fleet & Driver Details
            </h3>

            {detailsLoading ? (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading assigned resources...</span>
            ) : assignedDetails.driver || assignedDetails.vehicle ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {assignedDetails.vehicle && (
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {assignedDetails.vehicle.image && (
                      <img
                        src={assignedDetails.vehicle.image}
                        alt={assignedDetails.vehicle.name}
                        style={{ width: '90px', height: '60px', borderRadius: '6px', objectFit: 'contain', background: 'rgba(0,0,0,0.2)' }}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                        Assigned Vehicle
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {assignedDetails.vehicle.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Plate Number: <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{assignedDetails.vehicle.plateNumber}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Type: {assignedDetails.vehicle.type} ({assignedDetails.vehicle.acpreference})
                      </div>
                    </div>
                  </div>
                )}
                {assignedDetails.driver && (
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img
                      src={assignedDetails.driver.photo || (assignedDetails.driver.gender && assignedDetails.driver.gender.toLowerCase() === 'female' ? '/drivers/driver_avatar_4.png' : '/drivers/driver_avatar_1.png')}
                      alt={assignedDetails.driver.name}
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
                    />
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                        Assigned Driver
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {assignedDetails.driver.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Phone: <a href={`tel:${assignedDetails.driver.phone}`} style={{ color: '#10b981', fontWeight: '600', textDecoration: 'none' }}>{assignedDetails.driver.phone}</a>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        License: {assignedDetails.driver.licenseNumber}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                {selectedBooking.status === "Cancelled" ? "No resources assigned to cancelled booking." : "Awaiting dispatch assignment by Administrator."}
              </span>
            )}
          </div>

          {/* Feedback Section */}
          {selectedBooking.status === "Completed" && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 15px 0', color: 'var(--color-primary)' }}>
                Trip Feedback & Rating
              </h3>
              {selectedBooking.rating > 0 ? (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Your Rating:</span>
                    <span style={{ fontSize: '18px', color: '#fbbf24' }}>
                      {'★'.repeat(selectedBooking.rating)}{'☆'.repeat(5 - selectedBooking.rating)}
                    </span>
                  </div>
                  {selectedBooking.feedback && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Your Comments
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.4' }}>
                        "{selectedBooking.feedback}"
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Rate your experience:</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span 
                          key={star} 
                          onClick={() => setSubmittingRating(star)}
                          style={{ 
                            fontSize: '24px', 
                            cursor: 'pointer', 
                            color: star <= submittingRating ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                            transition: 'color 0.15s ease'
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label className="form-label">Review Comments</label>
                    <textarea 
                      className="form-input" 
                      style={{ minHeight: '80px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                      placeholder="Share details of your ride experience..."
                      value={submittingComment} 
                      onChange={(e) => setSubmittingComment(e.target.value)} 
                    />
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSubmitFeedback}
                    disabled={submitting}
                    style={{ padding: '8px 20px', fontSize: '13px' }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', justifyContent: 'flex-end' }}>
            {(selectedBooking.status === "Pending" || selectedBooking.status === "Confirmed") && (
              <button
                className="btn btn-danger"
                style={{ padding: '10px 20px', fontSize: '14px' }}
                onClick={() => handleCancelBooking(selectedBooking.id)}
              >
                Cancel Booking Request
              </button>
            )}
            <button className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '14px' }} onClick={() => setSelectedBooking(null)}>
              Back to History Log
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {!historyCategory ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Your Booking History</h2>
            <button className="btn btn-secondary" onClick={fetchBookings} style={{ padding: '8px 16px' }}>
              🔄 Refresh Log
            </button>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--status-cancelled-bg)',
              color: 'var(--status-cancelled)',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px',
              border: '1px solid var(--status-cancelled)',
              textAlign: 'left'
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="glass-panel" style={{ padding: '40px', fontSize: '16px', color: 'var(--text-muted)' }}>
              Loading bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
                No bookings found
              </p>
              <p style={{ fontSize: '14px' }}>
                You haven't requested any rides yet. Book a cab to start!
              </p>
            </div>
          ) : (
            /* Category Folders (Grid) */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {HISTORY_CATEGORIES.map(cat => {
                const count = bookings.filter(b => b.vehicleType && b.vehicleType.toLowerCase() === cat.type.toLowerCase()).length;
                return (
                  <div 
                    key={cat.type}
                    className="glass-panel"
                    onClick={() => setHistoryCategory(cat.type)}
                    style={{
                      padding: '30px 20px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease-in-out',
                      borderLeft: `4px solid ${cat.color}`,
                      borderTop: '1px solid transparent',
                      borderRight: '1px solid transparent',
                      borderBottom: '1px solid transparent',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.25)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.borderTop = `1px solid ${cat.color}`;
                      e.currentTarget.style.borderRight = `1px solid ${cat.color}`;
                      e.currentTarget.style.borderBottom = `1px solid ${cat.color}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                      e.currentTarget.style.borderTop = '1px solid transparent';
                      e.currentTarget.style.borderRight = '1px solid transparent';
                      e.currentTarget.style.borderBottom = '1px solid transparent';
                    }}
                  >
                    <img
                      src={cat.img}
                      alt={cat.type}
                      style={{
                        width: '95px',
                        height: '62px',
                        objectFit: 'contain',
                        marginBottom: '8px',
                        borderRadius: '4px'
                      }}
                    />
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>{cat.type} History</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      {count} {count === 1 ? 'booking' : 'bookings'} found
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Header with back button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setHistoryCategory(null)}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '13px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  borderRadius: '8px'
                }}
              >
                ← Back to History
              </button>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: HISTORY_CATEGORIES.find(c => c.type.toLowerCase() === historyCategory.toLowerCase())?.color || 'var(--color-primary)'
                  }}></span>
                  {historyCategory} Booking History
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Showing all {bookings.filter(b => b.vehicleType && b.vehicleType.toLowerCase() === historyCategory.toLowerCase()).length} {historyCategory.toLowerCase()} booking(s)
                </span>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={fetchBookings} style={{ padding: '8px 16px' }}>
              🔄 Refresh Log
            </button>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--status-cancelled-bg)',
              color: 'var(--status-cancelled)',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px',
              border: '1px solid var(--status-cancelled)',
              textAlign: 'left'
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="glass-panel" style={{ padding: '40px', fontSize: '16px', color: 'var(--text-muted)' }}>
              Loading bookings...
            </div>
          ) : (
            <div className="table-container glass-panel" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Pickup / Destination</th>
                    <th>Pickup Date & Time</th>
                    <th>Vehicle Class</th>
                    <th>Estimated Fare</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.filter(b => b.vehicleType && b.vehicleType.toLowerCase() === historyCategory.toLowerCase()).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                        No {historyCategory} bookings found.
                      </td>
                    </tr>
                  ) : (
                    bookings.filter(b => b.vehicleType && b.vehicleType.toLowerCase() === historyCategory.toLowerCase()).map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>{b.id}</td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{b.pickupLocation}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>→ {b.dropLocation}</div>
                        </td>
                        <td>{new Date(b.pickupDateTime).toLocaleString()}</td>
                        <td>{b.vehicleType}</td>
                        <td style={{ fontWeight: '700', color: '#10b981' }}>₹{b.fareEstimated.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${getBadgeClass(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-view"
                              style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px' }}
                              onClick={() => handleViewDetails(b)}
                            >
                              View Details
                            </button>

                            {b.status === "In Progress" && (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px' }}
                                onClick={() => onSelectTrackTrip(b)}
                              >
                                Track Trip
                              </button>
                            )}

                            {(b.status === "Pending" || b.status === "Confirmed") && (
                              <button
                                className="btn btn-danger"
                                style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px' }}
                                onClick={() => handleCancelBooking(b.id)}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
