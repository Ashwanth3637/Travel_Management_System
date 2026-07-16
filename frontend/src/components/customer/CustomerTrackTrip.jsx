import { useState, useEffect } from "react";

function CustomerTrackTrip({ token, customer, activeBooking, onClearActiveTrip }) {
  const API_URL = "http://localhost:5001/api";
  const booking = activeBooking;

  const [assignedDetails, setAssignedDetails] = useState({ driver: null, vehicle: null });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(35); // Simulated trip progress percent

  // Fetch assigned resources on load/change
  useEffect(() => {
    if (activeBooking) {
      const fetchAssigned = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_URL}/customer/assigned-resources/${activeBooking.id}?customerName=${encodeURIComponent(customer ? customer.name : "")}`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (res.ok) {
            setAssignedDetails(data);
          }
        } catch (err) {
          console.error("Failed to load assigned details", err);
        } finally {
          setLoading(false);
        }
      };
      fetchAssigned();
    }
  }, [activeBooking, token]);

  // Simulate progress indicator ticking
  useEffect(() => {
    if (!booking || booking.status !== "In Progress") return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [booking]);

  if (!booking) {
    return (
      <div className="glass-panel animate-fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
          <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"></path>
          <circle cx="12" cy="12" r="1"></circle>
        </svg>
        <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
          No Active Trip Selected
        </p>
        <p style={{ fontSize: '14px', marginBottom: '25px' }}>
          Select an "In Progress" booking from your Ride History log to view real-time GPS tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
          Live GPS Route Tracking
        </h2>
        <button className="btn btn-secondary" onClick={onClearActiveTrip} style={{ padding: '8px 16px' }}>
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '30px' }}>
        
        {/* Simulated Map Card */}
        <div className="glass-panel" style={{ padding: 0, height: '400px', position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
          {/* Simulated Map Background */}
          <div style={{
            position: 'absolute',
            width: '150%',
            height: '150%',
            backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.15,
            top: '-25%',
            left: '-25%'
          }}></div>

          {/* Simulated Route Line */}
          <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            <path
              d="M 150 280 C 250 180, 350 320, 500 120"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 150 280 C 250 180, 350 320, 500 120"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="4"
              strokeDasharray="400"
              strokeDashoffset={400 - (400 * progress) / 100}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
            />
          </svg>

          {/* Pickup Marker */}
          <div style={{
            position: 'absolute',
            left: '150px',
            top: '280px',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 2
          }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#6366f1', border: '3px solid #0b0f19', borderRadius: '50%' }}></div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap' }}>
              Pickup: {booking.pickupLocation}
            </div>
          </div>

          {/* Destination Marker */}
          <div style={{
            position: 'absolute',
            left: '500px',
            top: '120px',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 2
          }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#ef4444', border: '3px solid #0b0f19', borderRadius: '50%' }}></div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap' }}>
              Drop: {booking.dropLocation}
            </div>
          </div>

          {/* Car Marker (Moving) */}
          <div style={{
            position: 'absolute',
            // Simple bezier helper calculations based on progress percent
            left: `${150 + (500 - 150) * (progress / 100)}px`,
            top: `${280 + (120 - 280) * (progress / 100)}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
            transition: 'left 0.8s ease-in-out, top 0.8s ease-in-out'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--color-primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px var(--color-primary-glow)',
              color: 'var(--text-dark)'
            }}>
              🚗
            </div>
            {/* Pulsing glow around car */}
            <div className="live-pulse-dot" style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              border: '2px solid var(--color-primary)',
              borderRadius: '50%',
              left: '-10px',
              top: '-10px',
              opacity: 0.3,
              pointerEvents: 'none'
            }}></div>
          </div>

          {/* Live tracking overlay details */}
          <div className="glass-panel" style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            right: '20px',
            padding: '15px 25px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                Trip Status
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-pulse-dot" style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></span>
                {progress === 100 ? "Approaching Destination" : progress > 50 ? "En-Route on Highway" : "Trip Started"}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                Estimated Arrival
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-primary)' }}>
                {progress === 100 ? "1 Min" : `${Math.ceil((100 - progress) / 3)} Mins`}
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Info Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Active Trip Info Card */}
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 15px 0' }}>
              Booking Details
            </h3>
            <div className="details-list" style={{ gap: '12px' }}>
              <div className="details-row">
                <span className="details-label">Booking ID</span>
                <span className="details-value">{booking.id}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Fare Cost</span>
                <span className="details-value" style={{ color: '#10b981', fontWeight: '700' }}>₹{booking.fareEstimated}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Cab Category</span>
                <span className="details-value">{booking.vehicleType}</span>
              </div>
            </div>
          </div>

          {/* Assigned Driver & Vehicle details */}
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 15px 0' }}>
              Assigned Fleet
            </h3>

            {loading ? (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading assigned resource details...</span>
            ) : assignedDetails.vehicle || assignedDetails.driver ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {assignedDetails.vehicle && (
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Cab Details
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {assignedDetails.vehicle.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Plate: {assignedDetails.vehicle.plateNumber}
                    </div>
                  </div>
                )}
                {assignedDetails.driver && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Chauffeur Details
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {assignedDetails.driver.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Phone: {assignedDetails.driver.phone}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Awaiting cab and driver assignment dispatch from Admin dashboard.
              </span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default CustomerTrackTrip;
