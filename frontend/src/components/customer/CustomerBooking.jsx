import { useEffect, useState, useRef } from "react";

// ── Car image map ──────────────────────────────────────────────────────────────
const CAR_IMAGES = {
  "swiftdzire": "/cars/sedan/swift_dzire.png",
  "innovacrysta": "/cars/suv/innova_crysta.png",
  "crysta": "/cars/suv/innova_crysta.png",
  "tempotraveller": "/cars/minivan/tempo_traveller.png",
  "mahindrascorpio": "/cars/suv/mahindra_scorpio.png",
  "scorpio": "/cars/suv/mahindra_scorpio.png",
  "fortuner": "/cars/suv/toyota_fortuner.png",
  "vitarabrezza": "/cars/sedan/vitara_brezza.png",
  "duster": "/cars/suv/renault_duster.png",
  "urbania": "/cars/minivan/force_urbania.png",
  "aura": "/cars/sedan/hyundai_aura.png",
  "hyundaiaura": "/cars/sedan/hyundai_aura.png",
  "thar": "/cars/suv/mahindra_thar.png",
  "baleno": "/cars/sedan/suzuki_baleno.png",
  "wagonr": "/cars/sedan/wagonr.png",
  "bolero": "/cars/suv/bolero.png",
  "bmw": "/cars/luxury/bmw.png",
  "audi": "/cars/luxury/audi.png",
  "benz": "/cars/luxury/benz.png",
  "mercedesbenz": "/cars/luxury/benz.png",
};
function getCarImage(name) {
  if (!name) return null;
  const key = name.toLowerCase().replace(/\s+/g, "");
  if (CAR_IMAGES[key]) return CAR_IMAGES[key];
  for (const k of Object.keys(CAR_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return CAR_IMAGES[k];
  }
  return null;
}

// ── Haversine distance ─────────────────────────────────────────────────────────
function getDistance(c1, c2) {
  if (!c1 || !c2) return 0;
  const R = 6371;
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((c1.lat * Math.PI) / 180) * Math.cos((c2.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ── fetchWithTimeout helper ───────────────────────────────────────────────────
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 3500 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// ── Nominatim geocoding ────────────────────────────────────────────────────────
async function geocode(query) {
  try {
    const res = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();
    return data && data.length > 0 ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name } : null;
  } catch {
    return null;
  }
}

// ── Type icons ─────────────────────────────────────────────────────────────────
const TYPE_ICONS = { Sedan: "🚘", SUV: "🚙", Minivan: "🚐", Luxury: "🏎️" };
const TYPE_COLORS = { Sedan: "#2563eb", SUV: "#f97316", Minivan: "#10b981", Luxury: "#8b5cf6", All: "#2563eb" };

// ── Quick presets ──────────────────────────────────────────────────────────────
const QUICK_CITIES = [
  { label: "Coimbatore Airport", icon: "✈️", place: "Coimbatore International Airport (CJB), Coimbatore" },
  { label: "Chennai Airport", icon: "✈️", place: "Chennai International Airport (MAA), Chennai" },
  { label: "Coimbatore Jn.", icon: "🚉", place: "Coimbatore Junction Railway Station, Coimbatore" },
  { label: "Chennai Central", icon: "🚉", place: "Chennai Central Railway Station (MAS), Chennai" },
  { label: "Ooty", icon: "🏔️", place: "Ooty Bus Stand, Ooty" },
  { label: "Madurai", icon: "🕌", place: "Madurai Junction Railway Station, Madurai" },
  { label: "Erode Jn.", icon: "🚉", place: "Erode Junction Railway Station, Erode" },
  { label: "Salem Jn.", icon: "🚉", place: "Salem Junction Railway Station, Salem" },
];

const ALL_LOCATIONS = [
  "North Coimbatore Flyover, Coimbatore",
  "Raja Muthiah Road, Periamet, Chennai",
  "Coimbatore International Airport (CJB), Coimbatore",
  "Coimbatore Junction Railway Station, Coimbatore",
  "Gandhipuram Central Bus Stand, Coimbatore",
  "PSG College of Technology, Peelamedu, Coimbatore",
  "Saravanampatti, Coimbatore",
  "Town Hall, Coimbatore",
  "Chennai Central Railway Station (MAS), Chennai",
  "Chennai International Airport (MAA), Chennai",
  "Marina Beach, Chennai",
  "Koyambedu Omni Bus Terminus (CMBT), Chennai",
  "T. Nagar, Chennai",
  "Ooty Bus Stand, Ooty",
  "Mettupalayam Railway Station, Mettupalayam",
  "Pollachi Junction Railway Station, Pollachi",
  "Tiruppur Railway Station, Tiruppur",
  "Erode Junction Railway Station, Erode",
  "Salem Junction Railway Station, Salem",
  "Madurai Junction Railway Station, Madurai",
];

// ── LocationInput with live Nominatim search ──────────────────────────────────
function LocationInput({ value, onChange, onCoordSelect, placeholder, color, accentBg, label, icon }) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Live search as user types — debounced 500ms
  const liveSearch = (q) => {
    clearTimeout(debounceRef.current);
    if (!q || q.length < 3) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchWithTimeout(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=7&addressdetails=1&countrycodes=in`
        );
        const data = await res.json();
        setResults(data.map(r => ({
          display: r.display_name,
          short: r.address?.village || r.address?.town || r.address?.city || r.address?.suburb || r.display_name.split(',')[0],
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        })));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const handleChange = (val) => {
    onChange(val);
    setOpen(true);
    liveSearch(val);
  };

  const handleSelect = (item) => {
    onChange(item.display);
    onCoordSelect({ lat: item.lat, lng: item.lng }, item.display);
    setResults([]);
    setOpen(false);
  };

  const handleManualSearch = async () => {
    if (!value) return;
    setSearching(true);
    setOpen(true);
    try {
      const res = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=7&addressdetails=1&countrycodes=in`
      );
      const data = await res.json();
      const mapped = data.map(r => ({
        display: r.display_name,
        short: r.address?.village || r.address?.town || r.address?.city || r.address?.suburb || r.display_name.split(',')[0],
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      }));
      setResults(mapped);
      if (mapped.length === 1) handleSelect(mapped[0]);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      {/* Input box */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: accentBg, border: `1.5px solid ${open ? `${color}60` : `${color}25`}`,
        borderRadius: '14px', padding: '14px 16px',
        boxShadow: open ? `0 0 0 3px ${color}14` : 'none',
        transition: 'all 0.2s',
      }}>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '18px' }}>{icon}</span>
          <span style={{ fontSize: '9px', fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        </div>
        <div style={{ width: '1px', height: '32px', background: `${color}25`, flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { setOpen(true); if (value && value.length >= 3) liveSearch(value); }}
          onBlur={() => setTimeout(() => { setOpen(false); }, 220)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleManualSearch(); } }}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: '14px', fontWeight: '500', color: 'var(--text-main)',
            caretColor: color, minWidth: 0,
          }}
        />
        <button
          type="button"
          onClick={handleManualSearch}
          style={{
            background: `${color}20`, border: `1px solid ${color}40`,
            borderRadius: '8px', color, fontSize: '11px', fontWeight: '800',
            padding: '5px 11px', cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          {searching ? '⏳' : '🔍'}
        </button>
      </div>

      {/* Live results dropdown */}
      {open && (results.length > 0 || searching) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#0f1623', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '14px', boxShadow: '0 16px 48px rgba(0,0,0,0.75)',
          zIndex: 2000, overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.8px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {searching
              ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</span> Searching...</>
              : `${results.length} location${results.length !== 1 ? 's' : ''} found`
            }
          </div>
          {results.map((r, i) => (
            <div
              key={i}
              onMouseDown={() => handleSelect(r)}
              style={{
                padding: '10px 16px', cursor: 'pointer', fontSize: '13px',
                color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'flex-start', gap: '10px', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${color}0d`}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ color, fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>📍</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)', marginBottom: '2px' }}>
                  {r.short}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.display}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {open && !searching && results.length === 0 && value && value.length >= 3 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#0f1623', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          zIndex: 2000, padding: '14px 16px',
          fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center',
        }}>
          No results found for "<b style={{ color: 'var(--text-main)' }}>{value}</b>". Try a more specific address.
        </div>
      )}
    </div>
  );
}


// ── Main Component ─────────────────────────────────────────────────────────────
function CustomerBooking({ token, customer }) {
  const API_URL = "http://localhost:5001/api";

  const [pickup, setPickup] = useState("North Coimbatore Flyover, Coimbatore");
  const [drop, setDrop] = useState("Raja Muthiah Road, Periamet, Chennai");
  const [pickupCoords, setPickupCoords] = useState({ lat: 11.0183, lng: 76.9602 });
  const [dropCoords, setDropCoords] = useState({ lat: 13.0834, lng: 80.2718 });
  const [searching, setSearching] = useState({ pickup: false, drop: false });
  const [activeQuick, setActiveQuick] = useState(null); // 'pickup' | 'drop'

  const [dateTime, setDateTime] = useState("");
  const [customerContact, setCustomerContact] = useState(customer?.phone || "");
  const [passengersCount, setPassengersCount] = useState(1);
  const [tripType, setTripType] = useState("One Way");
  const [specialRequirements, setSpecialRequirements] = useState("");

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const distance = getDistance(pickupCoords, dropCoords);
  const ratePerKm = selectedVehicle?.ratePerKm || 0;
  
  let estimatedFare = 0;
  if (selectedVehicle && distance > 0) {
    const baseFare = distance * ratePerKm;
    if (tripType === "Round Trip") {
      estimatedFare = 2 * baseFare;
    } else if (tripType === "Local Travel") {
      estimatedFare = Math.round(1.3 * baseFare + 100);
    } else if (tripType === "Outstation Travel") {
      estimatedFare = Math.round(1.5 * baseFare + 300);
    } else if (tripType === "Airport Pickup") {
      estimatedFare = Math.round(1.1 * baseFare + 180);
    } else {
      estimatedFare = baseFare; // One Way / Default
    }
  }

  // Fetch vehicles
  const fetchBookingOptions = async () => {
    setOptionsLoading(true);
    try {
      const res = await fetch(`${API_URL}/customer/booking-options`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load cars.");
      setVehicles(data.vehicles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setOptionsLoading(false);
    }
  };
  useEffect(() => { if (token) fetchBookingOptions(); }, [token]);

  // Search & geocode a location
  const handleSearch = async (query, type) => {
    if (!query) return;
    setSearching(s => ({ ...s, [type]: true }));
    try {
      const result = await geocode(query);
      if (result) {
        if (type === 'pickup') { setPickup(result.display); setPickupCoords({ lat: result.lat, lng: result.lng }); }
        else { setDrop(result.display); setDropCoords({ lat: result.lat, lng: result.lng }); }
      } else {
        setError(`No results for "${query}"`);
      }
    } catch {
      setError("Location search failed.");
    } finally {
      setSearching(s => ({ ...s, [type]: false }));
    }
  };

  // Quick chip select
  const handleQuickPick = async (place) => {
    if (!activeQuick) return;
    const type = activeQuick;
    if (type === 'pickup') setPickup(place);
    else setDrop(place);
    setActiveQuick(null);
    await handleSearch(place, type);
  };

  const swapLocations = () => {
    setPickup(drop); setDrop(pickup);
    setPickupCoords(dropCoords); setDropCoords(pickupCoords);
  };

  // Booking submit
  const handleBooking = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!pickup || !drop || !dateTime || !selectedVehicle) {
      setError("Please fill in all required fields and select a car."); return;
    }
    if (distance === 0) { setError("Pickup and drop locations are the same."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/customer/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pickupLocation: pickup, dropLocation: drop, pickupDateTime: dateTime,
          vehicleType: selectedVehicle.type, modelName: selectedVehicle.name,
          customerName: customer?.name, customerContact, passengersCount,
          tripType, specialRequirements, fareEstimated: estimatedFare,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed.");
      setSuccess({
        message: `✅ Booking confirmed! ID: #${data.id} — ${selectedVehicle.name} reserved.`,
        startOtp: data.startOtp
      });
      setDateTime(""); setSelectedVehicle(null); setPassengersCount(1);
      setTripType("One Way"); setSpecialRequirements("");
      fetchBookingOptions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const availableTypes = ["All", ...Array.from(new Set(vehicles.map(v => v.type)))];
  const filteredVehicles = filterType === "All" ? vehicles : vehicles.filter(v => v.type === filterType);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '48px' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0' }}>Book a Ride</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Plan your journey and choose a vehicle below.</p>
      </div>

      {/* Alerts */}
      {error && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '10px', fontSize: '13px', marginBottom: '18px' }}>{error}</div>}
      {success && (
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
          border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: '14px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#34d399', marginBottom: '4px' }}>
              {success.message || success}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Driver will verify this OTP code before starting your ride.
            </div>
          </div>
          {success.startOtp && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--color-primary)',
              padding: '6px 16px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🔑 Your Start OTP
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '4px', color: '#fff' }}>
                {success.startOtp}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ JOURNEY PLANNER CARD ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(99,102,241,0.05) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'visible',
      }}>
        {/* Section label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '4px', height: '20px', background: 'var(--color-primary)', borderRadius: '4px' }} />
            <span style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Journey Planner</span>
          </div>
          {distance > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '20px', padding: '6px 16px',
            }}>
              <span style={{ fontSize: '14px' }}>📏</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#10b981' }}>{distance} km</span>
              {ratePerKm > 0 && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>≈ <b style={{ color: '#34d399' }}>₹{estimatedFare.toLocaleString()}</b></span>}
            </div>
          )}
        </div>

        {/* Location inputs row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <LocationInput
            value={pickup}
            onChange={setPickup}
            onCoordSelect={(coords, display) => { setPickupCoords(coords); setPickup(display); }}
            placeholder="Search any place — city, village, street..."
            color="#10b981"
            accentBg="rgba(16,185,129,0.05)"
            label="FROM"
            icon="🟢"
          />

          {/* Swap button */}
          <button
            type="button"
            onClick={swapLocations}
            title="Swap pickup and drop"
            style={{
              width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', fontWeight: '700',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            ⇄
          </button>

          <LocationInput
            value={drop}
            onChange={setDrop}
            onCoordSelect={(coords, display) => { setDropCoords(coords); setDrop(display); }}
            placeholder="Search any place — city, village, street..."
            color="#ef4444"
            accentBg="rgba(239,68,68,0.05)"
            label="TO"
            icon="🔴"
          />
        </div>

        {/* ── Quick location chips ── */}
        <div style={{ marginTop: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Quick Select:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['pickup', 'drop'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveQuick(activeQuick === t ? null : t)}
                  style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                    border: activeQuick === t
                      ? `1.5px solid ${t === 'pickup' ? '#10b981' : '#ef4444'}`
                      : '1px solid rgba(255,255,255,0.1)',
                    background: activeQuick === t
                      ? t === 'pickup' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'
                      : 'rgba(255,255,255,0.03)',
                    color: activeQuick === t
                      ? t === 'pickup' ? '#10b981' : '#ef4444'
                      : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  Set {t === 'pickup' ? '🟢 Pickup' : '🔴 Drop'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {QUICK_CITIES.map(c => (
              <button
                key={c.label}
                type="button"
                onClick={() => activeQuick ? handleQuickPick(c.place) : null}
                title={activeQuick ? `Set as ${activeQuick}` : 'Select pickup or drop above first'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  color: activeQuick ? 'var(--text-main)' : 'var(--text-muted)',
                  cursor: activeQuick ? 'pointer' : 'default',
                  opacity: activeQuick ? 1 : 0.5, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (activeQuick) { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'; e.currentTarget.style.color = '#10b981'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = activeQuick ? 'var(--text-main)' : 'var(--text-muted)'; }}
              >
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
          {activeQuick && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#10b981', fontWeight: '600' }}>
              ↑ Click any chip above to set as <b>{activeQuick}</b> location
            </div>
          )}
        </div>
      </div>

      {/* ═══ MAIN GRID: FORM  |  FARE PANEL ═══ */}
      <form onSubmit={handleBooking}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '24px', alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Trip details row */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', padding: '22px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '16px', background: '#6366f1', borderRadius: '4px' }} />
                Trip Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '7px' }}>
                    Travel Date & Time
                  </label>
                  <input type="datetime-local" className="form-input" value={dateTime} onChange={e => setDateTime(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '7px' }}>
                    Contact Number
                  </label>
                  <input type="tel" className="form-input" value={customerContact} onChange={e => setCustomerContact(e.target.value)} placeholder="Phone number" required style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '7px' }}>
                    Trip Type
                  </label>
                  <select className="form-select" value={tripType} onChange={e => setTripType(e.target.value)} style={{ width: '100%' }}>
                    <option value="One Way">One Way</option>
                    <option value="Round Trip">Round Trip</option>
                    <option value="Local Travel">Local Travel</option>
                    <option value="Outstation Travel">Outstation Travel</option>
                    <option value="Airport Pickup">Airport Pickup</option>
                    <option value="Airport Drop">Airport Drop</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '7px' }}>
                    Passengers
                  </label>
                  <input type="number" className="form-input" min="1" max="50" value={passengersCount} onChange={e => setPassengersCount(parseInt(e.target.value) || 1)} required style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Vehicle selection */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', padding: '22px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '4px', height: '16px', background: '#f97316', borderRadius: '4px' }} />
                  Select Vehicle
                </div>
                {/* Type filter pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {availableTypes.map(t => (
                    <button key={t} type="button"
                      onClick={() => { setFilterType(t); setSelectedVehicle(null); }}
                      style={{
                        padding: '4px 13px', fontSize: '11px', fontWeight: '700', borderRadius: '20px', cursor: 'pointer',
                        background: filterType === t ? `${TYPE_COLORS[t] || '#10b981'}18` : 'rgba(255,255,255,0.03)',
                        border: filterType === t ? `1.5px solid ${TYPE_COLORS[t] || '#10b981'}` : '1px solid rgba(255,255,255,0.08)',
                        color: filterType === t ? (TYPE_COLORS[t] || '#10b981') : 'var(--text-muted)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {t === 'All' ? 'All' : `${TYPE_ICONS[t] || '🚘'} ${t}`}
                    </button>
                  ))}
                </div>
              </div>

              {optionsLoading ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>🔄 Loading vehicles...</div>
              ) : filteredVehicles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚗</div>
                  <div style={{ fontWeight: '700' }}>No vehicles available</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(152px, 1fr))', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredVehicles.map(vehicle => {
                    const isAvail = vehicle.availableCount > 0;
                    const isSel = selectedVehicle?.name === vehicle.name;
                    const img = getCarImage(vehicle.name) || vehicle.image;
                    const typeColor = TYPE_COLORS[vehicle.type] || '#10b981';
                    return (
                      <div
                        key={vehicle.name}
                        onClick={() => isAvail && setSelectedVehicle(vehicle)}
                        style={{
                          borderRadius: '14px', overflow: 'hidden', cursor: isAvail ? 'pointer' : 'not-allowed',
                          border: isSel ? `2px solid ${typeColor}` : isAvail ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(239,68,68,0.15)',
                          background: isSel ? `${typeColor}0d` : 'rgba(255,255,255,0.02)',
                          boxShadow: isSel ? `0 0 20px ${typeColor}25` : 'none',
                          transform: isSel ? 'translateY(-3px)' : 'none',
                          transition: 'all 0.2s ease',
                          opacity: isAvail ? 1 : 0.45,
                          position: 'relative',
                        }}
                        onMouseEnter={e => { if (isAvail && !isSel) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.transform = 'none'; }}
                      >
                        {/* Availability badge */}
                        <div style={{
                          position: 'absolute', top: '7px', right: '7px', zIndex: 1,
                          fontSize: '9px', fontWeight: '800', padding: '2px 7px', borderRadius: '20px',
                          background: isAvail ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                          color: isAvail ? '#10b981' : '#ef4444',
                        }}>
                          {isAvail ? `${vehicle.availableCount}/${vehicle.totalCount}` : 'FULL'}
                        </div>

                        {/* Car image */}
                        {img ? (
                          <img src={img} alt={vehicle.name} style={{ width: '100%', height: '88px', objectFit: 'cover', display: 'block', filter: isAvail ? 'none' : 'grayscale(80%)' }} onError={e => e.target.style.display = 'none'} />
                        ) : (
                          <div style={{ height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: 'rgba(255,255,255,0.02)' }}>
                            {TYPE_ICONS[vehicle.type] || '🚘'}
                          </div>
                        )}

                        <div style={{ padding: '10px 10px 12px' }}>
                          <div style={{ fontWeight: '700', fontSize: '12px', color: isAvail ? 'var(--text-main)' : 'var(--text-muted)', marginBottom: '3px', lineHeight: '1.2' }}>{vehicle.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '7px' }}>{vehicle.type} · {vehicle.capacity} Seats</div>
                          {isAvail ? (
                            <div style={{ fontSize: '12px', fontWeight: '800', color: isSel ? typeColor : 'var(--text-muted)', background: isSel ? `${typeColor}15` : 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '8px', display: 'inline-block' }}>
                              ₹{vehicle.ratePerKm}/km
                            </div>
                          ) : (
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '8px', display: 'inline-block' }}>
                              Booked
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '16px', background: '#ec4899', borderRadius: '4px' }} />
                Special Requirements (Optional)
              </label>
              <textarea
                className="form-input"
                placeholder="E.g. infant seat, extra luggage, wheelchair access..."
                value={specialRequirements}
                onChange={e => setSpecialRequirements(e.target.value)}
                rows="2"
                style={{ resize: 'vertical', minHeight: '60px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '16px', fontSize: '15px', fontWeight: '800',
                background: submitting ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', border: 'none', borderRadius: '14px', cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 8px 24px rgba(16,185,129,0.3)',
                transition: 'all 0.2s', letterSpacing: '0.3px',
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {submitting ? '⏳ Confirming...' : '🚗 Confirm Booking'}
            </button>

          </div>

          {/* ── RIGHT COLUMN: FARE PANEL ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>

            {/* Fare estimate */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '18px', overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(99,102,241,0.08))', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>💰 Fare Estimate</div>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Car', value: selectedVehicle?.name || '—' },
                  { label: 'Type', value: selectedVehicle?.type || '—' },
                  { label: 'Plate', value: selectedVehicle?.plateNumber || (selectedVehicle ? 'Assigned on confirm' : '—'), mono: true },
                  { label: 'Distance', value: distance > 0 ? `${distance} km` : '—' },
                  { label: 'Rate', value: selectedVehicle ? `₹${ratePerKm}/km` : '—' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', fontFamily: r.mono ? 'monospace' : 'inherit', letterSpacing: r.mono ? '0.5px' : 'normal' }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Total Fare</span>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>
                    {estimatedFare > 0 ? `₹${estimatedFare.toLocaleString()}` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected car card */}
            {selectedVehicle && (() => {
              const img = getCarImage(selectedVehicle.name) || selectedVehicle.image;
              const tc = TYPE_COLORS[selectedVehicle.type] || '#10b981';
              return (
                <div style={{
                  background: `${tc}08`, border: `1px solid ${tc}30`,
                  borderRadius: '18px', padding: '18px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: tc, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                    ✅ Selected Car
                  </div>
                  {img ? (
                    <img src={img} alt={selectedVehicle.name} style={{ width: '100%', height: '90px', objectFit: 'contain', borderRadius: '10px', marginBottom: '10px' }} onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>{TYPE_ICONS[selectedVehicle.type] || '🚘'}</div>
                  )}
                  <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>{selectedVehicle.name}</div>
                  {selectedVehicle.plateNumber && (
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', letterSpacing: '0.8px', color: tc, marginBottom: '4px', fontWeight: '700' }}>
                      🪪 {selectedVehicle.plateNumber}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    {selectedVehicle.capacity} Seats · {selectedVehicle.acpreference}
                  </div>
                  <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '20px', background: `${tc}18`, color: tc, fontWeight: '800', fontSize: '12px', border: `1px solid ${tc}35` }}>
                    ₹{selectedVehicle.ratePerKm}/km
                  </span>
                </div>
              );
            })()}

            {/* Route summary mini-card */}
            {(pickup || drop) && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '12px' }}>Route Summary</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px', flexShrink: 0 }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b98170' }} />
                    <div style={{ width: '2px', flex: 1, background: 'repeating-linear-gradient(to bottom,rgba(255,255,255,0.15) 0px,rgba(255,255,255,0.15) 3px,transparent 3px,transparent 6px)', margin: '3px 0', minHeight: '18px' }} />
                    <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#ef4444', boxShadow: '0 0 6px #ef444470' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pickup || '—'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>Pickup</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {drop || '—'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Drop-off</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </form>
    </div>
  );
}

export default CustomerBooking;
