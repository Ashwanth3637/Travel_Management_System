import { useEffect, useState, useRef } from "react";

// Car name → public image path (key = vehicle name lowercased, no spaces)
const CAR_IMAGES = {
  "swiftdzire": "/cars/sedan/swift_dzire.png",
  "innovacrysta": "/cars/suv/innova_crysta.png",
  "crysta": "/cars/suv/innova_crysta.png",
  "tempotravellar": "/cars/minivan/tempo_traveller.png",
  "tempotraveller": "/cars/minivan/tempo_traveller.png",
  "mahindrascorpio": "/cars/suv/mahindra_scorpio.png",
  "scorpio": "/cars/suv/mahindra_scorpio.png",
  "fortuner": "/cars/suv/toyota_fortuner.png",
  "vitarabreeza": "/cars/sedan/vitara_brezza.png",
  "vitarabrezza": "/cars/sedan/vitara_brezza.png",
  "renaultduster": "/cars/suv/renault_duster.png",
  "duster": "/cars/suv/renault_duster.png",
  "urbania": "/cars/minivan/force_urbania.png",
  "aura": "/cars/sedan/hyundai_aura.png",
  "hyundaiaura": "/cars/sedan/hyundai_aura.png",
  "grandvitara": "/cars/suv/grand_vitara.png",
  "thar": "/cars/suv/mahindra_thar.png",
  "mahindrathar": "/cars/suv/mahindra_thar.png",
  "baleno": "/cars/sedan/suzuki_baleno.png",
  "marutibaleno": "/cars/sedan/suzuki_baleno.png",
  "waganor": "/cars/sedan/wagonr.png",
  "wagonr": "/cars/sedan/wagonr.png",
  "bolero": "/cars/suv/bolero.png",
  "bmw": "/cars/luxury/bmw.png",
  "audi": "/cars/luxury/audi.png",
  "benz": "/cars/luxury/benz.png",
  "mercedes": "/cars/luxury/benz.png",
  "mercedesbenz": "/cars/luxury/benz.png",
};

const PRESET_LOCATIONS = [
  "North Coimbatore Flyover, Coimbatore",
  "Raja Muthiah Road, Periamet, Chennai",
  "Coimbatore International Airport (CJB), Coimbatore",
  "Coimbatore Junction Railway Station, Coimbatore",
  "Gandhipuram Central Bus Stand, Coimbatore",
  "PSG College of Technology, Peelamedu, Coimbatore",
  "Hope College, Peelamedu, Coimbatore",
  "Saravanampatti, Coimbatore",
  "Town Hall, Coimbatore",
  "Chennai Central Railway Station (MAS), Chennai",
  "Chennai International Airport (MAA), Chennai",
  "Marina Beach, Chennai",
  "Koyambedu Omni Bus Terminus (CMBT), Chennai",
  "T. Nagar, Chennai",
  "Ooty Bus Stand, Ooty",
  "Mettupalayam Railway Station, Mettupalayam",
  "Singanallur Bus Stand, Coimbatore",
  "Sulur, Coimbatore",
  "Pollachi Junction Railway Station, Pollachi",
  "Tiruppur Railway Station, Tiruppur",
  "Erode Junction Railway Station, Erode",
  "Salem Junction Railway Station, Salem",
  "Madurai Junction Railway Station, Madurai"
];

// Partial-match helper — handles any spelling variation
function getCarImage(name) {
  if (!name) return null;
  const key = name.toLowerCase().replace(/\s+/g, "");
  if (CAR_IMAGES[key]) return CAR_IMAGES[key];
  for (const k of Object.keys(CAR_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return CAR_IMAGES[k];
  }
  return null;
}




// Color markers for Leaflet map (Green for Pickup, Red for Drop)
const greenIconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png";
const redIconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png";
const markerShadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png";

const TYPE_ICONS = { Hatchback: "🚗", Sedan: "🚘", SUV: "🚙", Minivan: "🚐" };

function getDistance(c1, c2) {
  if (!c1 || !c2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((c1.lat * Math.PI) / 180) * Math.cos((c2.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Nominatim reverse geocoding helper
const reverseGeocode = async (lat, lng, callback) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await res.json();
    if (data && data.display_name) {
      callback(data.display_name);
    } else {
      callback(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  } catch (error) {
    callback(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  }
};

function CustomerBooking({ token, customer }) {
  const API_URL = "http://localhost:5001/api";

  const [pickup, setPickup] = useState("North Coimbatore Flyover, Coimbatore");
  const [drop, setDrop] = useState("Raja Muthiah Road, Periamet, Chennai");
  const [pickupCoords, setPickupCoords] = useState({ lat: 11.0183, lng: 76.9602 }); // North Coimbatore Flyover
  const [dropCoords, setDropCoords] = useState({ lat: 13.0834, lng: 80.2718 }); // Raja Muthiah Road, Chennai
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");
  const [customerContact, setCustomerContact] = useState(customer ? customer.phone || '' : '');
  const [passengersCount, setPassengersCount] = useState(1);
  const [tripType, setTripType] = useState('One Way');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Filter type
  const [filterType, setFilterType] = useState("All");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mapRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropMarkerRef = useRef(null);

  const handleSearchLocation = async (query, type) => {
    if (!query) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        if (type === 'pickup') {
          setPickupCoords({ lat: newLat, lng: newLng });
          setPickup(display_name);
          if (pickupMarkerRef.current) {
            pickupMarkerRef.current.setLatLng([newLat, newLng]);
          }
          if (mapRef.current) {
            mapRef.current.setView([newLat, newLng], 13);
          }
        } else {
          setDropCoords({ lat: newLat, lng: newLng });
          setDrop(display_name);
          if (dropMarkerRef.current) {
            dropMarkerRef.current.setLatLng([newLat, newLng]);
          }
          if (mapRef.current) {
            mapRef.current.setView([newLat, newLng], 13);
          }
        }
      } else {
        setError(`No location found for "${query}"`);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to search location.");
    }
  };

  const handleKeyDown = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'pickup') {
        handleSearchLocation(pickup, 'pickup');
      } else {
        handleSearchLocation(drop, 'drop');
      }
    }
  };

  const fetchBookingOptions = async () => {
    setOptionsLoading(true);
    try {
      const res = await fetch(`${API_URL}/customer/booking-options`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load cars.");
      setVehicles(data.vehicles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBookingOptions();
  }, [token]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!window.L) return;
    const L = window.L;

    const mapContainer = document.getElementById('map-container');
    if (!mapContainer || mapContainer._leaflet_id) return;

    // Center map around South India region
    const map = L.map('map-container').setView([12.0, 78.6], 7);
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

    // Create markers
    const pickupMarker = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: greenIcon, draggable: true })
      .addTo(map)
      .bindPopup("<b>Pickup Location</b><br>Drag me!")
      .openPopup();
    pickupMarkerRef.current = pickupMarker;

    const dropMarker = L.marker([dropCoords.lat, dropCoords.lng], { icon: redIcon, draggable: true })
      .addTo(map)
      .bindPopup("<b>Drop Location</b><br>Drag me!");
    dropMarkerRef.current = dropMarker;

    // Set bounds
    const bounds = L.latLngBounds([pickupCoords.lat, pickupCoords.lng], [dropCoords.lat, dropCoords.lng]);
    map.fitBounds(bounds, { padding: [40, 40] });

    // Initial reverse geocode setup
    reverseGeocode(pickupCoords.lat, pickupCoords.lng, setPickup);
    reverseGeocode(dropCoords.lat, dropCoords.lng, setDrop);

    // Event listeners
    pickupMarker.on('dragend', () => {
      const pos = pickupMarker.getLatLng();
      const newCoords = { lat: pos.lat, lng: pos.lng };
      setPickupCoords(newCoords);
      reverseGeocode(pos.lat, pos.lng, setPickup);
    });

    dropMarker.on('dragend', () => {
      const pos = dropMarker.getLatLng();
      const newCoords = { lat: pos.lat, lng: pos.lng };
      setDropCoords(newCoords);
      reverseGeocode(pos.lat, pos.lng, setDrop);
    });

    // Clicking map moves nearest marker
    map.on('click', (e) => {
      const clickLatLng = e.latlng;
      const pickupLatLng = pickupMarker.getLatLng();
      const dropLatLng = dropMarker.getLatLng();

      const distToPickup = clickLatLng.distanceTo(pickupLatLng);
      const distToDrop = clickLatLng.distanceTo(dropLatLng);

      if (distToPickup < distToDrop) {
        pickupMarker.setLatLng(clickLatLng);
        setPickupCoords({ lat: clickLatLng.lat, lng: clickLatLng.lng });
        reverseGeocode(clickLatLng.lat, clickLatLng.lng, setPickup);
      } else {
        dropMarker.setLatLng(clickLatLng);
        setDropCoords({ lat: clickLatLng.lat, lng: clickLatLng.lng });
        reverseGeocode(clickLatLng.lat, clickLatLng.lng, setDrop);
      }
    });

    return () => {
      map.remove();
    };
  }, []);

  const distance = getDistance(pickupCoords, dropCoords);
  const ratePerKm = selectedVehicle?.ratePerKm || 12;
  const estimatedFare = distance * ratePerKm;

  // Unique vehicle types present in fetched vehicles
  const availableTypes = ["All", ...Array.from(new Set(vehicles.map(v => v.type)))];
  const filteredVehicles = filterType === "All" ? vehicles : vehicles.filter(v => v.type === filterType);

  const handleBooking = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!pickup || !drop || !dateTime || !selectedVehicle) {
      setError("Please fill out all required fields and select a car model.");
      return;
    }
    if (distance === 0) {
      setError("Pickup and Drop locations cannot be the same coordinates.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/customer/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          pickupLocation: pickup, 
          dropLocation: drop, 
          pickupDateTime: dateTime,
          vehicleType: selectedVehicle.type,
          modelName: selectedVehicle.name,     // backend will auto-pick first available unit
          customerName: customer ? customer.name : undefined,
          customerContact,
          passengersCount,
          tripType,
          specialRequirements: specialRequirements || notes || '',
          notes: notes || specialRequirements || '',
          fareEstimated: estimatedFare
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking creation failed.");

      setSuccess(`✅ Booking confirmed! Your Booking ID is #${data.id}. Vehicle: ${selectedVehicle.name} — reserved for you. Our team will assign a driver shortly.`);
      setDateTime(""); 
      setSelectedVehicle(null); 
      setNotes(""); 
      setSpecialRequirements(""); 
      setPassengersCount(1);
      setTripType("One Way");
      fetchBookingOptions(); // Refresh — booked car disappears from the list
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredPickupPresets = PRESET_LOCATIONS.filter(loc =>
    loc.toLowerCase().includes((pickup || "").toLowerCase())
  );

  const filteredDropPresets = PRESET_LOCATIONS.filter(loc =>
    loc.toLowerCase().includes((drop || "").toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'left' }}>
        Book a New Ride
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '28px', alignItems: 'start' }}>

        {/* ── Left: Booking Form ── */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled)', borderRadius: '8px', fontSize: '14px', marginBottom: '18px', border: '1px solid var(--status-cancelled)' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--status-completed-bg)', color: 'var(--status-completed)', borderRadius: '8px', fontSize: '14px', marginBottom: '18px', border: '1px solid var(--status-completed)' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleBooking}>
            {/* Map Selection Container */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Select Route on Map</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Drag pins to adjust</span>
              </label>
              <div
                id="map-container"
                style={{
                  height: '280px',
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  marginBottom: '10px',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 1
                }}
              ></div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.4' }}>
                📍 <span style={{ color: '#10b981', fontWeight: '600' }}>Green pin</span> is Pickup. <span style={{ color: '#ef4444', fontWeight: '600' }}>Red pin</span> is Drop. Drag them or click the map to set your route.
              </div>
            </div>

            {/* Pickup Address Display */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Pickup Address</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text" className="form-input"
                  value={pickup}
                  onChange={(e) => {
                    setPickup(e.target.value);
                    setShowPickupSuggestions(true);
                  }}
                  onFocus={() => setShowPickupSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 250)}
                  placeholder="Enter pickup location..."
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSearchLocation(pickup, 'pickup')}
                  style={{
                    padding: '0 16px',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  🔍 Search
                </button>
              </div>
              
              {showPickupSuggestions && filteredPickupPresets.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#1a1e2d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
                  {filteredPickupPresets.map(loc => (
                    <div
                      key={loc}
                      onMouseDown={() => {
                        setPickup(loc);
                        handleSearchLocation(loc, 'pickup');
                        setShowPickupSuggestions(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      📍 {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drop Address Display */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Drop Address</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text" className="form-input"
                  value={drop}
                  onChange={(e) => {
                    setDrop(e.target.value);
                    setShowDropSuggestions(true);
                  }}
                  onFocus={() => setShowDropSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDropSuggestions(false), 250)}
                  placeholder="Enter drop location..."
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSearchLocation(drop, 'drop')}
                  style={{
                    padding: '0 16px',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  🔍 Search
                </button>
              </div>
              
              {showDropSuggestions && filteredDropPresets.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#1a1e2d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
                  {filteredDropPresets.map(loc => (
                    <div
                      key={loc}
                      onMouseDown={() => {
                        setDrop(loc);
                        handleSearchLocation(loc, 'drop');
                        setShowDropSuggestions(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      📍 {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div className="form-group">
              <label className="form-label">Customer Contact Details (Phone)</label>
              <input 
                type="tel" className="form-input" 
                value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} 
                placeholder="Enter contact number..." 
                required 
              />
            </div>

            {/* Date/Time */}
            <div className="form-group">
              <label className="form-label">Travel Date & Time</label>
              <input type="datetime-local" className="form-input" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required />
            </div>

            {/* Trip Type & Number of Passengers */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Trip Type</label>
                <select className="form-select" value={tripType} onChange={(e) => setTripType(e.target.value)}>
                  <option value="One Way">One Way</option>
                  <option value="Round Trip">Round Trip</option>
                  <option value="Local Travel">Local Travel</option>
                  <option value="Outstation Travel">Outstation Travel</option>
                  <option value="Airport Pickup">Airport Pickup</option>
                  <option value="Airport Drop">Airport Drop</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Number of Passengers</label>
                <input 
                  type="number" className="form-input" 
                  min="1" max="50"
                  value={passengersCount} onChange={(e) => setPassengersCount(parseInt(e.target.value) || 1)} 
                  required 
                />
              </div>
            </div>

            {/* ── Car Model Grid ── */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'block', marginBottom: '10px' }}>
                Select Car Model
                {optionsLoading && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>Loading...</span>}
              </label>

              {/* Filter tabs by type */}
              {!optionsLoading && vehicles.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {availableTypes.map(type => (
                    <button
                      key={type} type="button"
                      onClick={() => { setFilterType(type); setSelectedVehicle(null); }}
                      style={{
                        padding: '5px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '20px',
                        border: filterType === type ? '1.5px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: filterType === type ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                        color: filterType === type ? 'var(--color-primary)' : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      {type === "All" ? "All Types" : `${TYPE_ICONS[type] || "🚘"} ${type}`}
                    </button>
                  ))}
                </div>
              )}

              {optionsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  🔄 Loading cars...
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div style={{ padding: '20px 16px', backgroundColor: 'rgba(255,60,60,0.05)', border: '1px solid rgba(255,60,60,0.15)', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚗</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    No {filterType !== 'All' ? filterType : ''} Vehicles in Fleet
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Please contact us to check availability.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '12px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredVehicles.map((vehicle) => {
                    const isAvailable = vehicle.availableCount > 0;
                    const isSelected = selectedVehicle?.name === vehicle.name;
                    const img = getCarImage(vehicle.name) || vehicle.image;
                    return (
                      <div
                        key={vehicle.name}
                        onClick={() => isAvailable && setSelectedVehicle(vehicle)}
                        style={{
                          padding: '14px 10px', borderRadius: '12px', textAlign: 'center',
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                          border: isSelected
                            ? '2px solid var(--color-primary)'
                            : isAvailable ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(239,68,68,0.2)',
                          backgroundColor: isSelected
                            ? 'rgba(16,185,129,0.09)'
                            : isAvailable ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.04)',
                          boxShadow: isSelected ? '0 0 14px rgba(16,185,129,0.18)' : 'none',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                          transition: 'all 0.2s ease',
                          opacity: isAvailable ? 1 : 0.5,
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (isAvailable && !isSelected) {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isAvailable && !isSelected) {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                          }
                        }}
                      >
                        {/* Availability count badge — top right */}
                        <div style={{
                          position: 'absolute', top: '7px', right: '7px',
                          fontSize: '9px', fontWeight: '800', padding: '2px 7px', borderRadius: '20px',
                          background: isAvailable
                            ? `rgba(16,185,129,${vehicle.availableCount === vehicle.totalCount ? '0.2' : '0.12'})`
                            : 'rgba(239,68,68,0.2)',
                          color: isAvailable ? '#10b981' : '#ef4444',
                          whiteSpace: 'nowrap'
                        }}>
                          {isAvailable ? `${vehicle.availableCount}/${vehicle.totalCount} avail` : 'FULL'}
                        </div>

                        {img ? (
                          <img
                            src={img}
                            alt={vehicle.name}
                            style={{
                              width: '100%', height: '90px', objectFit: 'cover',
                              marginBottom: '6px', borderRadius: '8px', display: 'block',
                              background: 'rgba(0,0,0,0.3)',
                              filter: isAvailable ? 'none' : 'grayscale(80%)'
                            }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ fontSize: '30px', marginBottom: '6px', filter: isAvailable ? 'none' : 'grayscale(1)' }}>
                            {TYPE_ICONS[vehicle.type] || '🚘'}
                          </div>
                        )}

                        <div style={{ fontWeight: '700', fontSize: '13px', color: isAvailable ? 'var(--text-main)' : 'var(--text-muted)', marginBottom: '3px' }}>
                          {vehicle.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          {vehicle.type} • {vehicle.capacity} Seats
                        </div>

                        {isAvailable ? (
                          <div style={{
                            fontSize: '11px', fontWeight: '800',
                            color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)',
                            backgroundColor: isSelected ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                            padding: '3px 8px', borderRadius: '10px', display: 'inline-block'
                          }}>
                            ₹{vehicle.ratePerKm}/km
                          </div>
                        ) : (
                          <div style={{
                            fontSize: '10px', fontWeight: '700', color: '#ef4444',
                            padding: '2px 8px', borderRadius: '10px', display: 'inline-block',
                            background: 'rgba(239,68,68,0.1)'
                          }}>
                            Fully Booked
                          </div>
                        )}

                        {isAvailable && vehicle.acpreference && (
                          <div style={{ fontSize: '10px', color: '#60a5fa', marginTop: '4px' }}>{vehicle.acpreference}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>



            {/* Special Requirements */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Special Requirements</label>
              <textarea
                className="form-input" placeholder="E.g. infant seat required, extra luggage, etc."
                value={specialRequirements} onChange={(e) => setSpecialRequirements(e.target.value)}
                rows="2" style={{ resize: 'vertical', minHeight: '64px', fontFamily: 'inherit' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
              🚗 Confirm Booking
            </button>
          </form>
        </div>

        {/* ── Right: Fare Summary ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', margin: '0 0 14px 0' }}>Fare Estimate</h3>
            <div className="details-list" style={{ gap: '12px' }}>
              <div className="details-row">
                <span className="details-label">Car</span>
                <span className="details-value">{selectedVehicle ? selectedVehicle.name : '—'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Type</span>
                <span className="details-value">{selectedVehicle ? selectedVehicle.type : '—'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Plate</span>
                <span className="details-value">{selectedVehicle ? selectedVehicle.plateNumber : '—'}</span>
              </div>

              <div className="details-row">
                <span className="details-label">Distance</span>
                <span className="details-value">{distance > 0 ? `${distance} km` : '—'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Rate</span>
                <span className="details-value">₹{ratePerKm}/km</span>
              </div>
              <div className="details-row" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: '8px' }}>
                <span className="details-label" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                  Total Fare
                </span>
                <span className="details-value" style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>
                  {estimatedFare > 0 ? `₹${estimatedFare.toLocaleString()}` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Selected car summary card */}
          {selectedVehicle && (
            <div className="glass-panel" style={{ padding: '18px', border: '1px solid rgba(16,185,129,0.25)', backgroundColor: 'rgba(16,185,129,0.04)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 12px 0', color: 'var(--color-primary)' }}>
                ✅ Selected Car
              </h3>
              <div style={{ textAlign: 'center' }}>
                {getCarImage(selectedVehicle.name) ? (
                  <img
                    src={getCarImage(selectedVehicle.name)}
                    alt={selectedVehicle.name}
                    style={{ width: '100%', height: '100px', objectFit: 'contain', marginBottom: '8px', borderRadius: '8px' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>{TYPE_ICONS[selectedVehicle.type] || "🚘"}</div>
                )}
                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-main)', marginBottom: '4px' }}>{selectedVehicle.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{selectedVehicle.plateNumber}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{selectedVehicle.capacity} Seats · {selectedVehicle.acpreference}</div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--color-primary)', fontWeight: '700', fontSize: '12px' }}>
                  ₹{selectedVehicle.ratePerKm}/km
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default CustomerBooking;
