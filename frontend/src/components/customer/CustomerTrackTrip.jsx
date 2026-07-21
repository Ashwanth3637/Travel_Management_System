import { useState, useEffect, useRef } from "react";

// Color markers for Leaflet map (Green for Pickup, Red for Drop)
const greenIconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png";
const redIconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png";
const markerShadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png";

function CustomerTrackTrip({ token, customer, activeBooking, onClearActiveTrip }) {
  const API_URL = "http://localhost:5001/api";

  const [currentBooking, setCurrentBooking] = useState(activeBooking);
  const booking = currentBooking;

  const [assignedDetails, setAssignedDetails] = useState({ driver: null, vehicle: null });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(35); // Simulated trip progress percent

  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);

  const mapRef = useRef(null);
  const carMarkerRef = useRef(null);

  // Sync state if activeBooking prop changes
  useEffect(() => {
    setCurrentBooking(activeBooking);
    setPickupCoords(null);
    setDropCoords(null);
    setRoutePoints([]);
  }, [activeBooking]);

  // Fetch real road route geometry from OSRM
  useEffect(() => {
    if (!pickupCoords || !dropCoords) return;

    const fetchRoute = async () => {
      try {
        const res = await fetch(`https://router.projectosrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${dropCoords.lng},${dropCoords.lat}?overview=full&geometries=geojson`);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRoutePoints(coords);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch OSRM route:", err);
      }
      // Fallback to straight line points
      setRoutePoints([
        [pickupCoords.lat, pickupCoords.lng],
        [dropCoords.lat, dropCoords.lng]
      ]);
    };
    fetchRoute();
  }, [pickupCoords, dropCoords]);

  // Adjust progress based on trip status
  useEffect(() => {
    if (booking) {
      if (booking.status === "Completed") {
        setProgress(100);
      } else if (booking.status === "Pending" || booking.status === "Confirmed" || booking.status === "Cancelled") {
        setProgress(0);
      } else if (booking.status === "In Progress" && progress === 0) {
        setProgress(35);
      }
    }
  }, [booking?.status]);

  // Auto-fetch customer's active trip if none is selected
  useEffect(() => {
    if (!currentBooking && customer) {
      const fetchActiveBooking = async () => {
        try {
          const res = await fetch(`${API_URL}/customer/bookings?customerName=${encodeURIComponent(customer.name)}`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (res.ok) {
            const bookings = await res.json();
            // Try to find the most relevant active trip (In Progress > Confirmed > Pending)
            const active = bookings.find(b => b.status === "In Progress") || 
                           bookings.find(b => b.status === "Confirmed") ||
                           bookings.find(b => b.status === "Pending");
            if (active) {
              setCurrentBooking(active);
            }
          }
        } catch (err) {
          console.error("Failed to fetch active bookings", err);
        }
      };
      fetchActiveBooking();
    }
  }, [currentBooking, customer, token]);

  // Geocode pickup & drop address strings into coordinates
  useEffect(() => {
    if (booking) {
      const geocodeLocations = async () => {
        try {
          // Geocode pickup
          const pickupRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(booking.pickupLocation)}&limit=1`);
          const pickupData = await pickupRes.json();
          let pCoords = { lat: 11.0168, lng: 76.9558 }; // default Coimbatore
          if (pickupData && pickupData.length > 0) {
            pCoords = { lat: parseFloat(pickupData[0].lat), lng: parseFloat(pickupData[0].lon) };
          }
          setPickupCoords(pCoords);

          // Geocode drop
          const dropRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(booking.dropLocation)}&limit=1`);
          const dropData = await dropRes.json();
          let dCoords = { lat: 13.0827, lng: 80.2707 }; // default Chennai
          if (dropData && dropData.length > 0) {
            dCoords = { lat: parseFloat(dropData[0].lat), lng: parseFloat(dropData[0].lon) };
          }
          setDropCoords(dCoords);
        } catch (err) {
          console.error("Geocoding error in tracking map:", err);
          // Fallback to defaults
          setPickupCoords({ lat: 11.0168, lng: 76.9558 });
          setDropCoords({ lat: 13.0827, lng: 80.2707 });
        }
      };
      geocodeLocations();
    }
  }, [booking]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!window.L || !pickupCoords || !dropCoords || routePoints.length === 0) return;
    const L = window.L;

    const mapContainer = document.getElementById('track-map-container');
    if (!mapContainer || mapContainer._leaflet_id) return;

    const map = L.map('track-map-container').setView([12.0, 78.6], 7);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const greenIcon = new L.Icon({
      iconUrl: greenIconUrl,
      shadowUrl: markerShadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const redIcon = new L.Icon({
      iconUrl: redIconUrl,
      shadowUrl: markerShadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const carIcon = L.divIcon({
      html: `<div style="
        width: 36px;
        height: 36px;
        background-color: var(--color-primary);
        border: 2px solid #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 12px rgba(16,185,129,0.7);
        font-size: 18px;
      ">🚗</div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    // Create markers
    L.marker([pickupCoords.lat, pickupCoords.lng], { icon: greenIcon })
      .addTo(map)
      .bindPopup(`<b>Pickup:</b> ${booking.pickupLocation}`)
      .openPopup();

    L.marker([dropCoords.lat, dropCoords.lng], { icon: redIcon })
      .addTo(map)
      .bindPopup(`<b>Destination:</b> ${booking.dropLocation}`);

    // Draw route line
    L.polyline(routePoints, { color: 'var(--color-primary)', weight: 4, dashArray: '5, 10' }).addTo(map);

    // Car marker (interpolated position based on progress)
    const index = Math.min(routePoints.length - 1, Math.floor((progress / 100) * routePoints.length));
    const currentPoint = routePoints[index] || [pickupCoords.lat, pickupCoords.lng];
    const carMarker = L.marker(currentPoint, { icon: carIcon }).addTo(map)
      .bindPopup(`<b>Trip Status:</b> ${booking.status}`);
    carMarkerRef.current = carMarker;

    const bounds = L.polyline(routePoints).getBounds();
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      map.remove();
    };
  }, [pickupCoords, dropCoords, routePoints]);

  // Update car position on simulated progress ticks
  useEffect(() => {
    if (carMarkerRef.current && routePoints.length > 0) {
      const index = Math.min(routePoints.length - 1, Math.floor((progress / 100) * routePoints.length));
      const currentPoint = routePoints[index];
      if (currentPoint) {
        carMarkerRef.current.setLatLng(currentPoint);
        
        if (mapRef.current) {
          mapRef.current.setView(currentPoint, mapRef.current.getZoom());
        }
      }
    }
  }, [progress, routePoints]);

  // Fetch assigned resources on load/change
  useEffect(() => {
    if (currentBooking) {
      const fetchAssigned = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_URL}/customer/assigned-resources/${currentBooking.id}?customerName=${encodeURIComponent(customer ? customer.name : "")}`, {
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
  }, [currentBooking, token, customer]);

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

  const getTimingDetails = () => {
    if (!booking) return { label: "Estimated Arrival", value: "" };

    const pickupDate = new Date(booking.pickupDateTime);
    const now = new Date();

    if (booking.status === "Pending" || booking.status === "Confirmed") {
      const diffMs = pickupDate - now;
      const timeStr = pickupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (diffMs > 0) {
        const diffMins = Math.ceil(diffMs / 60000);
        if (diffMins < 60) {
          return {
            label: `Pickup in ${diffMins} Mins`,
            value: `Scheduled: ${timeStr}`
          };
        } else if (diffMins < 1440) {
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          return {
            label: `Pickup in ${hours}h ${mins}m`,
            value: `Scheduled: ${timeStr}`
          };
        } else {
          const days = Math.ceil(diffMins / 1440);
          return {
            label: `Pickup in ${days} ${days === 1 ? 'Day' : 'Days'}`,
            value: `Scheduled: ${pickupDate.toLocaleDateString()} ${timeStr}`
          };
        }
      } else {
        return {
          label: "Driver Arriving shortly",
          value: `Scheduled: ${timeStr}`
        };
      }
    }

    if (booking.status === "In Progress") {
      // Estimate total duration based on fare (approx ₹15 per km, speed 50km/h)
      // duration in mins = fare / 15
      const totalDurationMins = Math.max(15, Math.round((booking.fareEstimated || 300) / 15));
      const remainingMins = Math.max(1, Math.round(totalDurationMins * (1 - progress / 100)));
      
      const etaDate = new Date(now.getTime() + remainingMins * 60000);
      const etaStr = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      return {
        label: `${remainingMins} Mins remaining`,
        value: `ETA: ${etaStr}`
      };
    }

    if (booking.status === "Completed") {
      return {
        label: "Arrived at Destination",
        value: "Trip Completed"
      };
    }

    if (booking.status === "Cancelled") {
      return {
        label: "Trip Cancelled",
        value: "N/A"
      };
    }

    return { label: "Estimated Arrival", value: "N/A" };
  };

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
        
        {/* Real Leaflet Map Card */}
        <div className="glass-panel" style={{ padding: 0, height: '400px', position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
          <div 
            id="track-map-container" 
            style={{ 
              height: '100%', 
              width: '100%', 
              zIndex: 1 
            }}
          ></div>

          {(!pickupCoords || !dropCoords || routePoints.length === 0) && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(15,23,42,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              color: 'var(--text-muted)',
              fontSize: '15px'
            }}>
              {routePoints.length === 0 && pickupCoords && dropCoords 
                ? "Calculating original live route geometry..." 
                : "Geocoding Real-Time GPS Coordinates..."}
            </div>
          )}

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
            borderRadius: '12px',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                Trip Status
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-pulse-dot" style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: booking.status === "Pending" ? "#fbbf24" : booking.status === "Confirmed" ? "#60a5fa" : booking.status === "Completed" ? "#10b981" : booking.status === "Cancelled" ? "#f87171" : "#10b981", 
                  borderRadius: '50%' 
                }}></span>
                {booking.status === "Pending" ? "Awaiting Dispatch" : 
                 booking.status === "Confirmed" ? "Driver Confirmed" : 
                 booking.status === "Completed" ? "Trip Completed" : 
                 booking.status === "Cancelled" ? "Trip Cancelled" : 
                 (progress === 100 ? "Approaching Destination" : progress > 50 ? "En-Route on Highway" : "Trip Started")}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                {booking.status === "Completed" ? "Trip Details" : booking.status === "Cancelled" ? "Cancellation" : "Timing Status"}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-primary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: '700' }}>
                  {getTimingDetails().label}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {getTimingDetails().value}
                </span>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img
                      src={assignedDetails.driver.photo || (assignedDetails.driver.gender && assignedDetails.driver.gender.toLowerCase() === 'female' ? '/drivers/driver_avatar_4.png' : '/drivers/driver_avatar_1.png')}
                      alt={assignedDetails.driver.name}
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
                    />
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
