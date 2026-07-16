/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";

function CustomerBookingHistory({ token, customer, onSelectTrackTrip }) {
  const API_URL = "http://localhost:5001/api";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignedDetails, setAssignedDetails] = useState({ driver: null, vehicle: null });
  const [detailsLoading, setDetailsLoading] = useState(false);

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
                  <span className="details-label">Rider Name</span>
                  <span className="details-value">{selectedBooking.customerName}</span>
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
                  <span className="details-label">Pickup Date & Time</span>
                  <span className="details-value">{new Date(selectedBooking.pickupDateTime).toLocaleString()}</span>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                {assignedDetails.vehicle && (
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      Assigned Vehicle
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {assignedDetails.vehicle.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Plate: <span style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontWeight: '600' }}>{assignedDetails.vehicle.plateNumber}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Type: {assignedDetails.vehicle.type} ({assignedDetails.vehicle.acpreference})
                    </div>
                  </div>
                )}
                {assignedDetails.driver && (
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
                )}
              </div>
            ) : (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                {selectedBooking.status === "Cancelled" ? "No resources assigned to cancelled booking." : "Awaiting dispatch assignment by Administrator."}
              </span>
            )}
          </div>

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
              {bookings.map((b) => (
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
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => handleViewDetails(b)}
                      >
                        View Details
                      </button>

                      {b.status === "In Progress" && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => onSelectTrackTrip(b)}
                        >
                          Track Trip
                        </button>
                      )}

                      {(b.status === "Pending" || b.status === "Confirmed") && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => handleCancelBooking(b.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CustomerBookingHistory;
