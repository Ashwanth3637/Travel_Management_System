import { useState } from "react";

// Pre-defined cities list (alphabetical order)
const cities = [
  "Bangalore",
  "Chennai",
  "Coimbatore",
  "Erode",
  "Hosur",
  "Kanyakumari",
  "Kodaikanal",
  "Madurai",
  "Mysore",
  "Nagercoil",
  "Ooty",
  "Pondicherry",
  "Salem",
  "Thoothukudi (Tuticorin)",
  "Tiruchirappalli (Trichy)",
  "Tirunelveli",
  "Tiruppur",
  "Valparai",
  "Vellore"
].sort();

// Exact coordinates for computing distance via Haversine
const cityCoordinates = {
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Erode: { lat: 11.3410, lng: 77.7172 },
  Hosur: { lat: 12.7409, lng: 77.8253 },
  Kanyakumari: { lat: 8.0883, lng: 77.5385 },
  Kodaikanal: { lat: 10.2381, lng: 77.4892 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Mysore: { lat: 12.2958, lng: 76.6394 },
  Nagercoil: { lat: 8.1833, lng: 77.4119 },
  Ooty: { lat: 11.4102, lng: 76.6950 },
  Pondicherry: { lat: 11.9416, lng: 79.8083 },
  Salem: { lat: 11.6643, lng: 78.1460 },
  "Thoothukudi (Tuticorin)": { lat: 8.7642, lng: 78.1348 },
  "Tiruchirappalli (Trichy)": { lat: 10.7905, lng: 78.7047 },
  Tirunelveli: { lat: 8.7139, lng: 77.7567 },
  Tiruppur: { lat: 11.1085, lng: 77.3411 },
  Valparai: { lat: 10.3275, lng: 76.9554 },
  Vellore: { lat: 12.9165, lng: 79.1325 }
};

// Rate sheet configuration
const rates = {
  Hatchback: 10,
  Sedan: 12,
  SUV: 18,
  Minivan: 25
};

function CustomerBooking({ token, customer }) {
  const API_URL = "http://localhost:5001/api";

  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [pickupSearch, setPickupSearch] = useState("");
  const [dropSearch, setDropSearch] = useState("");
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [dateTime, setDateTime] = useState("");
  const [category, setCategory] = useState("Sedan");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredPickupCities = cities.filter(city =>
    city.toLowerCase().includes(pickupSearch.toLowerCase())
  );
  const filteredDropCities = cities.filter(city =>
    city.toLowerCase().includes(dropSearch.toLowerCase())
  );

  // Derived states via Haversine formula
  const distance = (() => {
    if (!pickup || !drop || pickup === drop) return 0;
    const c1 = cityCoordinates[pickup];
    const c2 = cityCoordinates[drop];
    if (!c1 || !c2) return 0;

    const R = 6371; // Earth radius in km
    const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
    const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1.lat * Math.PI) / 180) *
        Math.cos((c2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  })();

  const ratePerKm = rates[category] || 12;
  const estimatedFare = distance * ratePerKm;

  const handleBooking = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!pickup || !drop || !dateTime || !category) {
      setError("Please fill out all required fields.");
      return;
    }

    if (pickup === drop) {
      setError("Pickup and drop locations cannot be the same place.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/customer/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          pickupLocation: pickup,
          dropLocation: drop,
          pickupDateTime: dateTime,
          vehicleType: category,
          notes,
          customerName: customer ? customer.name : undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Booking creation failed.");
      }

      setSuccess(`Booking created successfully! Your Booking ID is ${data.id}.`);
      // Reset form
      setPickup("");
      setDrop("");
      setPickupSearch("");
      setDropSearch("");
      setDateTime("");
      setCategory("Sedan");
      setNotes("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', textAlign: 'left' }}>
        Book a New Ride
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Booking Form Card */}
        <div className="glass-panel" style={{ padding: '30px' }}>
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

          {success && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--status-completed-bg)',
              color: 'var(--status-completed)',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px',
              border: '1px solid var(--status-completed)',
              textAlign: 'left'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleBooking}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Pickup Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="Type or search pickup location..."
                value={pickupSearch}
                onChange={(e) => {
                  setPickupSearch(e.target.value);
                  setShowPickupSuggestions(true);
                  if (pickup !== e.target.value) setPickup("");
                }}
                onFocus={() => setShowPickupSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowPickupSuggestions(false), 200);
                }}
                required
              />
              {showPickupSuggestions && filteredPickupCities.length > 0 && (
                <ul className="suggestions-list">
                  {filteredPickupCities.map((city) => (
                    <li
                      key={city}
                      onMouseDown={() => {
                        setPickup(city);
                        setPickupSearch(city);
                        setShowPickupSuggestions(false);
                      }}
                    >
                      {city}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Drop Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="Type or search drop location..."
                value={dropSearch}
                onChange={(e) => {
                  setDropSearch(e.target.value);
                  setShowDropSuggestions(true);
                  if (drop !== e.target.value) setDrop("");
                }}
                onFocus={() => setShowDropSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowDropSuggestions(false), 200);
                }}
                required
              />
              {showDropSuggestions && filteredDropCities.length > 0 && (
                <ul className="suggestions-list">
                  {filteredDropCities.map((city) => (
                    <li
                      key={city}
                      onMouseDown={() => {
                        setDrop(city);
                        setDropSearch(city);
                        setShowDropSuggestions(false);
                      }}
                    >
                      {city}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Travel Date & Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '10px', textAlign: 'left' }}>Select Vehicle Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
                {[
                  { key: "Hatchback", label: "Hatchback", desc: "4 Seats", rate: 10, icon: "🚗" },
                  { key: "Sedan", label: "Sedan", desc: "4 Seats", rate: 12, icon: "🚘" },
                  { key: "SUV", label: "SUV", desc: "6 Seats", rate: 18, icon: "🚙" },
                  { key: "Minivan", label: "Minivan", desc: "8 Seats", rate: 25, icon: "🚐" }
                ].map((item) => {
                  const isSelected = category === item.key;
                  return (
                    <div
                      key={item.key}
                      onClick={() => setCategory(item.key)}
                      style={{
                        padding: '16px 8px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                        boxShadow: isSelected ? '0 0 15px rgba(16, 185, 129, 0.15)' : 'none',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease-in-out',
                        transform: isSelected ? 'translateY(-2px)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        }
                      }}
                    >
                      <div style={{ fontSize: '28px', marginBottom: '6px' }}>{item.icon}</div>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)', marginBottom: '3px' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{item.desc}</div>
                      <div style={{ 
                        fontSize: '11px', 
                        fontWeight: '800', 
                        color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)',
                        backgroundColor: isSelected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        padding: '3px 6px',
                        borderRadius: '10px',
                        display: 'inline-block'
                      }}>
                        ₹{item.rate}/km
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label className="form-label">Special Notes / Special Requests (Optional)</label>
              <textarea
                className="form-input"
                placeholder="E.g. infant seat required, extra luggage capacity, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
              Confirm Booking & Estimate
            </button>
          </form>
        </div>

        {/* Fare Summary & Available Services Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Fare Summary Glass Card */}
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 15px 0', textAlign: 'left' }}>
              Fare Estimate
            </h3>
            
            <div className="details-list" style={{ gap: '15px' }}>
              <div className="details-row">
                <span className="details-label">Cab Class</span>
                <span className="details-value">{category}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Estimated Distance</span>
                <span className="details-value">{distance > 0 ? `${distance} km` : '—'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Rate Per KM</span>
                <span className="details-value">₹{ratePerKm} / km</span>
              </div>
              <div className="details-row" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: '10px' }}>
                <span className="details-label" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                  Total Estimated Fare
                </span>
                <span className="details-value" style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>
                  {estimatedFare > 0 ? `₹${estimatedFare.toLocaleString()}` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Service Cabs Info Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 15px 0', textAlign: 'left' }}>
              Available Services & Fleet
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span>🚗 Hatchback</span>
                <span style={{ color: 'var(--text-muted)' }}>4 Seats | ₹10/km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span>🚘 Sedan</span>
                <span style={{ color: 'var(--text-muted)' }}>4 Seats | ₹12/km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span>🚙 SUV</span>
                <span style={{ color: 'var(--text-muted)' }}>6 Seats | ₹18/km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '2px' }}>
                <span>🚐 Minivan</span>
                <span style={{ color: 'var(--text-muted)' }}>8 Seats | ₹25/km</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default CustomerBooking;
