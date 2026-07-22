import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  // Enforce Light Theme for Landing Page
  useEffect(() => {
    document.body.classList.add('light-theme');
    localStorage.setItem('theme', 'light');
  }, []);

  // Slider Slides for general Travel Booking
  const slides = [
    {
      title: "Premium Outstation & Intercity Rides",
      subtitle: "Book comfortable intercity rides and long-distance travels with professional chauffeurs.",
      bg: "linear-gradient(rgba(15,23,42,0.72), rgba(15,23,42,0.85)), url('/landing_hero.png') center/cover no-repeat"
    },
    {
      title: "Hourly Cab Rentals & Local Travel",
      subtitle: "Hire a premium vehicle by the hour for business meetings or flexible city travels.",
      bg: "linear-gradient(135deg, rgba(15,23,42,0.75) 0%, rgba(30,41,59,0.85) 100%), url('/landing_hero.png') center/cover no-repeat"
    },
    {
      title: "Outstation & Airport Taxi Booking",
      subtitle: "Seamless long-distance travel connecting major cities with verified, reliable drivers.",
      bg: "linear-gradient(135deg, rgba(30,41,59,0.78) 0%, rgba(15,23,42,0.85) 100%), url('/landing_hero.png') center/cover no-repeat"
    }
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  // Query / Contact Form state
  const [queryForm, setQueryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [querySending, setQuerySending] = useState(false);
  const [querySuccess, setQuerySuccess] = useState('');

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    setQuerySending(true);
    setQuerySuccess('');
    try {
      const res = await fetch('http://localhost:5001/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryForm)
      });
      if (res.ok) {
        setQuerySuccess('Thank you! Your query message has been received by Admin.');
        setQueryForm({ name: '', email: '', phone: '', message: '' });
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending message.');
    } finally {
      setQuerySending(false);
    }
  };

  // Live vehicle image slideshow — changes every 2 seconds
  const vehicleImages = [
    { src: '/cars/luxury/audi.png', label: 'Audi A8 — Luxury Class', type: 'car' },
    { src: '/cars/luxury/benz.png', label: 'Mercedes Benz — Business Class', type: 'car' },
    { src: '/cars/luxury/bmw.png', label: 'BMW 7 Series — Executive Class', type: 'car' },
    { src: '/cars/sedan/swift_dzire.png', label: 'Swift Dzire — Economy Sedan', type: 'car' },
    { src: '/cars/sedan/suzuki_baleno.png', label: 'Baleno — Premium Hatchback', type: 'car' },
    { src: '/cars/suv/toyota_fortuner.png', label: 'Fortuner — Full-Size SUV', type: 'car' },
    { src: '/cars/suv/mahindra_xuv700.png', label: 'XUV700 — Premium SUV', type: 'car' },
    { src: '/cars/suv/mahindra_thar.png', label: 'Thar — Off-Road Adventure', type: 'car' },
    { src: '/cars/suv/innova_crysta.png', label: 'Innova Crysta — Family MPV', type: 'car' },
    { src: '/cars/minivan/tempo_traveller.png', label: 'Tempo Traveller — Group Travel', type: 'car' },
  ];
  const [activeImg, setActiveImg] = useState(0);
  const [imgVisible, setImgVisible] = useState(true);

  useEffect(() => {
    const imgInterval = setInterval(() => {
      // Fade out, then swap image, then fade in
      setImgVisible(false);
      setTimeout(() => {
        setActiveImg((prev) => (prev + 1) % vehicleImages.length);
        setImgVisible(true);
      }, 350);
    }, 4000);
    return () => clearInterval(imgInterval);
  }, [vehicleImages.length]);

  // Scroll-triggered animation for travel banner
  const bannerRef = useRef(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [selectedBannerItem, setSelectedBannerItem] = useState(0);

  const bannerFeatures = [
    {
      icon: '🚗',
      label: 'Luxury Cars',
      tag: '🚀 Premium Fleet Showcase',
      title: 'Ride in Style with Our Premium Luxury Cars',
      description: 'Choose from our high-end sedan and SUV collection like Audi A8, Mercedes-Benz, and BMW 7 series.'
    },
    {
      icon: '🛣️',
      label: 'Outstation',
      tag: '🛣️ Long Distance Travel',
      title: 'Reliable Outstation & Intercity Rides',
      description: 'Book premium intercity cabs for long distance travel, round trips or one-way routes with ease.'
    },
    {
      icon: '✈️',
      label: 'Airport Rides',
      tag: '✈️ Airport Transfers',
      title: 'Punctual Airport Pickups & Transfers',
      description: 'Never miss a flight with our guaranteed on-time airport transfers and chauffeur services.'
    },
    {
      icon: '🕐',
      label: '24/7 Available',
      tag: '🕐 Live Round-The-Clock Dispatch',
      title: 'Around-the-clock Support & Dispatch',
      description: 'Professional support desk and active drivers ready to dispatch at any time of day or night.'
    }
  ];

  // Scroll-triggered animation for portals
  const portalsRef = useRef(null);
  const [portalsVisible, setPortalsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setBannerVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setPortalsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (portalsRef.current) {
      observer.observe(portalsRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--text-main)',
      backgroundColor: 'var(--bg-main)',
      fontFamily: 'var(--font-family)',
      boxSizing: 'border-box'
    }}>
      {/* ─── HOTLINE TOP HEADER BAR ─── */}
      <div style={{
        background: 'rgba(197, 168, 92, 0.08)',
        borderBottom: '1px solid var(--border-color)',
        padding: '8px 24px',
        fontSize: '13px',
        fontWeight: '600'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <span>📍 Travel Booking Management System</span>
            <span>🕒 Live 24/7 Dispatch Availability</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>📞 Call Us / Hotline:</span>
            <a href="tel:+919345271959" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '800' }}>
              +91-9345271959
            </a>
          </div>
        </div>
      </div>

      {/* ─── MAIN HEADER & NAVIGATION ─── */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '20px 24px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 4px 14px rgba(197, 168, 92, 0.35)'
          }}>
            🚖
          </div>
          <div>
            <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', display: 'block', lineHeight: 1.1 }}>
              Travel <span style={{ color: 'var(--color-primary)' }}>Booking</span>
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Management System
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            className="btn btn-primary"
            style={{
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              color: '#0a0a0d',
              border: 'none',
              boxShadow: '0 4px 15px rgba(197, 168, 92, 0.4)'
            }}
            onClick={() => navigate('/customer/booking')}
          >
            🚖 Book a Ride
          </button>
        </div>
      </header>

      {/* ─── HERO CAROUSEL BANNER ─── */}
      <section style={{
        margin: '0 24px 48px 24px'
      }}>
        <div className="glass-panel" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 40px',
          borderRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
          background: slides[activeSlide].bg,
          transition: 'all 0.5s ease',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '340px'
        }}>
          {/* Decorative tag */}
          <div style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            fontWeight: '800',
            letterSpacing: '2px',
            color: 'var(--color-primary)',
            background: 'rgba(197,168,92,0.12)',
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(197,168,92,0.25)',
            marginBottom: '20px'
          }}>
            🚕 Premium Travel Livery
          </div>

          <h1 style={{
            fontSize: '46px',
            fontWeight: '800',
            lineHeight: '1.2',
            margin: '0 0 16px 0',
            maxWidth: '800px',
            color: '#ffffff',
            textShadow: '0 4px 20px rgba(0,0,0,0.9)'
          }}>
            {slides[activeSlide].title}
          </h1>

          <p style={{
            fontSize: '17px',
            color: '#f1f5f9',
            maxWidth: '600px',
            margin: '0 0 32px 0',
            lineHeight: '1.6',
            fontWeight: '500',
            textShadow: '0 2px 10px rgba(0,0,0,0.9)'
          }}>
            {slides[activeSlide].subtitle}
          </p>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => navigate('/customer/booking')}
              style={{
                padding: '13px 32px',
                fontSize: '14px',
                fontWeight: '800',
                borderRadius: '50px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                color: '#0a0a0a',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(197,168,92,0.5), 0 4px 15px rgba(0,0,0,0.3)',
                animation: 'heroButtonPulse 2.5s ease-in-out infinite',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)';
                e.currentTarget.style.boxShadow = '1 1 35px rgba(197,168,92,0.75), 0 8px 25px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(197,168,92,0.5), 0 4px 15px rgba(0,0,0,0.3)';
              }}
            >
              🚖 Book a Cab Ride
            </button>
            <button
              onClick={() => navigate('/customer/history')}
              style={{
                padding: '13px 28px',
                fontSize: '14px',
                fontWeight: '800',
                borderRadius: '50px',
                border: '2px solid rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                transition: 'all 0.25s ease',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
              }}
            >
              📜 View Bookings
            </button>
          </div>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', gap: '8px', position: 'absolute', bottom: '20px' }}>
            {slides.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setActiveSlide(idx)}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: idx === activeSlide ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT US SECTION ─── */}
      <section style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 48px auto',
        padding: '0 24px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'left' }}>
            <span 
              className="pulse-zoom-text"
              style={{
                fontSize: '15px',
                textTransform: 'uppercase',
                fontWeight: '900',
                letterSpacing: '2.5px',
                color: '#d97706',
                display: 'inline-block',
                marginBottom: '12px',
                textShadow: '0 1px 3px rgba(217, 119, 6, 0.25)'
              }}
            >
              TRAVEL BOOKING MANAGEMENT SYSTEM
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 16px 0', lineHeight: 1.25 }}>
              Enjoy Comfortable Hourly Cab Booking & Outstation Services
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.7', margin: '0 0 20px 0' }}>
              Travel Booking Management System offers premium intercity and local travel with safe transport across all major routes. Our platform connects you with professional drivers and well-maintained vehicles for all your travel needs, ensuring accurate fare estimates and verified dispatches.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.7', margin: '0 0 28px 0' }}>
              We provide sedans, SUVs, and corporate cars for local travels, one-way outstations, round trips, and airport transfers.
            </p>
            <button className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '13px' }} onClick={() => navigate('/customer/booking')}>
              Explore Services
            </button>
          </div>
          <div>
            <div className="glass-panel" style={{
              padding: '24px',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 45px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'center',
              background: 'var(--bg-card)'
            }}>
              <div style={{
                width: '100%',
                height: '320px',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.15)',
                padding: '12px',
                boxSizing: 'border-box'
              }}>
                <img
                  src={vehicleImages[activeImg].src}
                  alt={vehicleImages[activeImg].label}
                  className="pulse-zoom-image"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    display: 'block',
                    opacity: imgVisible ? 1 : 0,
                    transition: 'opacity 0.35s ease'
                  }}
                />
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                opacity: imgVisible ? 1 : 0,
                transition: 'opacity 0.35s ease'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  padding: '5px 14px',
                  borderRadius: '20px',
                  backgroundColor: vehicleImages[activeImg].type === 'driver'
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(197,168,92,0.15)',
                  color: vehicleImages[activeImg].type === 'driver'
                    ? '#2563eb'
                    : 'var(--color-primary)',
                  border: vehicleImages[activeImg].type === 'driver'
                    ? '1px solid rgba(59,130,246,0.3)'
                    : '1px solid rgba(197,168,92,0.3)'
                }}>
                  {vehicleImages[activeImg].type === 'driver' ? '👨‍✈️ Our Drivers' : '🚗 Vehicle Fleet'}
                </span>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '800',
                  color: 'var(--text-main)',
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                }}>
                  {vehicleImages[activeImg].label}
                </div>
              </div>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                {vehicleImages.map((_, idx) => (
                  <div key={idx} onClick={() => setActiveImg(idx)} style={{
                    width: idx === activeImg ? '22px' : '8px',
                    height: '8px',
                    borderRadius: '10px',
                    backgroundColor: idx === activeImg ? 'var(--color-primary)' : 'rgba(15,23,42,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SCROLL-TRIGGERED TRAVEL BOOKING BANNER ─── */}
      <section
        ref={bannerRef}
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto 60px auto',
          padding: '0 24px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          minHeight: '320px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid rgba(197,168,92,0.2)'
        }}>
          {/* Background Image */}
          <img
            src="/travel_cab_banner.png"
            alt="Travel Booking"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: bannerVisible ? 1 : 0,
              transform: bannerVisible ? 'scale(1)' : 'scale(1.08)',
              transition: 'opacity 0.9s ease, transform 1.1s ease',
            }}
          />
          {/* Dark gradient overlay for ultra crisp text readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(10,15,28,0.88) 0%, rgba(10,15,28,0.65) 55%, rgba(10,15,28,0.3) 100%)'
          }} />

          {/* Text content — slides in from left */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            padding: '50px 48px',
            maxWidth: '560px',
            opacity: bannerVisible ? 1 : 0,
            transform: bannerVisible ? 'translateX(0)' : 'translateX(-60px)',
            transition: 'all 0.5s ease'
          }}>
            <span 
              className="pulse-zoom-text"
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: '800',
                letterSpacing: '2px',
                color: 'var(--color-primary)',
                display: 'inline-block',
                marginBottom: '12px'
              }}
            >
              {bannerFeatures[selectedBannerItem].tag}
            </span>
            <h2 
              className="pulse-zoom-text"
              style={{
                fontSize: '34px',
                fontWeight: '900',
                lineHeight: 1.2,
                margin: '0 0 16px 0',
                color: '#ffffff',
                transition: 'all 0.3s ease',
                display: 'block'
              }}
            >
              {bannerFeatures[selectedBannerItem].title}
            </h2>
            <p 
              className="pulse-zoom-text"
              style={{
                fontSize: '14.5px',
                color: '#f1f5f9',
                lineHeight: 1.7,
                fontWeight: '500',
                margin: '0 0 28px 0',
                transition: 'all 0.3s ease',
                display: 'block'
              }}
            >
              {bannerFeatures[selectedBannerItem].description}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/customer/login')}
                style={{
                  padding: '13px 30px',
                  fontWeight: '800',
                  fontSize: '14px',
                  borderRadius: '50px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  color: '#0a0a0a',
                  cursor: 'pointer',
                  animation: 'heroButtonPulse 2.5s ease-in-out infinite',
                  transition: 'transform 0.2s ease',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
              >
                🚖 Book Now
              </button>
              <button
                onClick={() => navigate('/customer/register')}
                style={{
                  padding: '13px 26px',
                  fontWeight: '800',
                  fontSize: '14px',
                  borderRadius: '50px',
                  border: '2px solid rgba(255,255,255,0.6)',
                  background: 'rgba(15,23,42,0.4)',
                  color: '#fff',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.25s ease',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(15,23,42,0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ✨ Register Free
              </button>
            </div>
          </div>

          {/* Icon tiles — slide in from right */}
          <div style={{
            position: 'absolute',
            right: '40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            opacity: bannerVisible ? 1 : 0,
            transform: bannerVisible ? 'translateX(0)' : 'translateX(60px)',
            transition: 'opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s',
            zIndex: 3
          }}>
            {bannerFeatures.map((item, i) => {
              const isActive = i === selectedBannerItem;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedBannerItem(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: isActive ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(12px)',
                    border: isActive ? '1.5px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    fontSize: '13.5px',
                    fontWeight: isActive ? '900' : '700',
                    color: isActive ? '#0a0a0d' : '#ffffff',
                    minWidth: '170px',
                    cursor: 'pointer',
                    transform: isActive ? 'translateX(-12px) scale(1.08)' : 'translateX(0) scale(1)',
                    boxShadow: isActive ? '0 0 25px rgba(197, 168, 92, 0.45)' : '0 4px 15px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                    zIndex: isActive ? 10 : 1
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
                      e.currentTarget.style.transform = 'translateX(-4px) scale(1.02)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                      e.currentTarget.style.transform = 'translateX(0) scale(1)';
                    }
                  }}
                >
                  <span style={{ fontSize: '20px', transform: isActive ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US SECTION ─── */}
      <section style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 75px auto',
        padding: '0 24px',
        boxSizing: 'border-box',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <span style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            fontWeight: '800',
            letterSpacing: '2px',
            color: '#ef4444',
            display: 'block',
            marginBottom: '8px'
          }}>
            TOUR TAXI
          </span>
          <h2 style={{
            fontSize: '36px',
            fontWeight: '900',
            color: 'var(--text-main)',
            margin: '0 0 16px 0',
            letterSpacing: '-0.5px'
          }}>
            Why Choose Us?
          </h2>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '15px',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Choose Tour Taxi for an unforgettable exploration of seamless, reliable travels. With verified fleet standards, we offer pocket-friendly packages, knowledgeable drivers, and comfortable transportation.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {[
            {
              icon: '👍',
              title: '100% Customer Satisfaction',
              desc: 'The main priority of our company is to achieve 100% client satisfaction on every trip.',
              hoverBg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderColor: '#22c55e',
              glowColor: 'rgba(34, 197, 94, 0.3)',
              iconBg: 'rgba(34, 197, 94, 0.12)',
              iconColor: '#16a34a'
            },
            {
              icon: '🧳',
              title: 'Customize Tour Packages',
              desc: 'Flexible travel itineraries customized to meet travelers\' unique needs and demands.',
              hoverBg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
              borderColor: '#a855f7',
              glowColor: 'rgba(168, 85, 247, 0.3)',
              iconBg: 'rgba(168, 85, 247, 0.12)',
              iconColor: '#9333ea'
            },
            {
              icon: '🚘',
              title: 'Reliable Rental Service',
              desc: 'AC/Non-AC taxis, hatchbacks, sedans, SUVs, tempo travellers, verified drivers, 24/7 active dispatch.',
              hoverBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              borderColor: '#3b82f6',
              glowColor: 'rgba(59, 130, 246, 0.3)',
              iconBg: 'rgba(59, 130, 246, 0.12)',
              iconColor: '#2563eb'
            },
            {
              icon: '✔️',
              title: 'Professional Drivers',
              desc: 'Licensed, courteous drivers ensure smooth, multi-language supported travel experience.',
              hoverBg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
              borderColor: '#06b6d4',
              glowColor: 'rgba(6, 182, 212, 0.3)',
              iconBg: 'rgba(6, 182, 212, 0.12)',
              iconColor: '#0891b2'
            },
            {
              icon: '₹',
              title: 'Affordable Cost Guarantee',
              desc: 'All our outstation and local cab services are available at transparent, pocket-friendly prices.',
              hoverBg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              borderColor: '#f59e0b',
              glowColor: 'rgba(245, 158, 11, 0.3)',
              iconBg: 'rgba(245, 158, 11, 0.12)',
              iconColor: '#d97706'
            },
            {
              icon: '🔧',
              title: 'High Quality Service',
              desc: 'Focusing on high quality vehicle maintenance and customer safety is what matters to us the most.',
              hoverBg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
              borderColor: '#f43f5e',
              glowColor: 'rgba(244, 63, 94, 0.3)',
              iconBg: 'rgba(244, 63, 94, 0.12)',
              iconColor: '#e11d48'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-panel feature-dancing-card"
              style={{
                background: '#ffffff',
                padding: '36px 28px',
                borderRadius: '20px',
                border: '1px solid rgba(15,23,42,0.06)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                animationDelay: `${idx * 0.45}s`,
                transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = item.hoverBg;
                e.currentTarget.style.borderColor = item.borderColor;
                e.currentTarget.style.boxShadow = `0 20px 45px ${item.glowColor}, 0 0 25px ${item.glowColor}`;
                
                const iconElem = e.currentTarget.querySelector('.dance-icon');
                if (iconElem) {
                  iconElem.style.backgroundColor = item.iconBg;
                  iconElem.style.color = item.iconColor;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = 'rgba(15,23,42,0.06)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.04)';
                
                const iconElem = e.currentTarget.querySelector('.dance-icon');
                if (iconElem) {
                  iconElem.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                  iconElem.style.color = '#ef4444';
                }
              }}
            >
              {/* Red Circle Icon Container */}
              <div className="dance-icon" style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                color: '#ef4444',
                marginBottom: '20px',
                fontWeight: '900',
                transition: 'all 0.3s ease'
              }}>
                {item.icon}
              </div>

              <h3 style={{
                fontSize: '18px',
                fontWeight: '800',
                color: '#0f172a',
                margin: '0 0 10px 0'
              }}>
                {item.title}
              </h3>

              <p style={{
                fontSize: '13.5px',
                color: '#64748b',
                margin: 0,
                lineHeight: 1.6
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SYSTEM PORTAL SELECTION PANEL ─── */}
      <section
        ref={portalsRef}
        style={{
          background: 'rgba(255,255,255,0.01)',
          borderTop: '1px solid var(--border-color)',
          padding: '75px 24px',
          boxSizing: 'border-box',
          opacity: portalsVisible ? 1 : 0,
          transform: portalsVisible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 0.9s ease, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
            opacity: portalsVisible ? 1 : 0,
            transform: portalsVisible ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s'
          }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
              System Access Portals
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: 0 }}>
              Access administrative consoles, driver grids, and customer booking tools.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px'
          }}>
            {[
              {
                title: "👤 Customer Rider Portal",
                badge: "Rider App",
                desc: "Book premium cabs, search pick-up locations, select vehicles, get instant Start OTP, and view live trip tracking.",
                route: "/customer/home",
                icon: "🚕",
                color: "#10b981", // Emerald Green
                glowColor: "rgba(16, 185, 129, 0.45)",
                cardBgHover: "linear-gradient(145deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)",
                btnColor: "#10b981",
                btnTextColor: "#ffffff",
                badgeBg: "rgba(16, 185, 129, 0.15)",
                badgeBorder: "rgba(16, 185, 129, 0.4)",
                action: "Enter Rider Portal",
                delay: "0s"
              },
              {
                title: "👨‍✈️ Driver Control Console",
                badge: "Driver App",
                desc: "Manage trip dispatches, verify customer Start OTP, update live ride status (Ongoing / Complete), and set availability.",
                route: "/driver/dashboard",
                icon: "🚘",
                color: "#3b82f6", // Electric Royal Blue
                glowColor: "rgba(59, 130, 246, 0.45)",
                cardBgHover: "linear-gradient(145deg, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)",
                btnColor: "#3b82f6",
                btnTextColor: "#ffffff",
                badgeBg: "rgba(59, 130, 246, 0.15)",
                badgeBorder: "rgba(59, 130, 246, 0.4)",
                action: "Open Driver Console",
                delay: "0.2s"
              },
              {
                title: "👑 Admin Control Center",
                badge: "Admin Dashboard",
                desc: "Supervise all trip dispatches, manage vehicle categories, register drivers, and analyze real-time financial reports.",
                route: "/admin/overview",
                icon: "⚡",
                color: "#f59e0b", // Imperial Amber Gold
                glowColor: "rgba(245, 158, 11, 0.45)",
                cardBgHover: "linear-gradient(145deg, rgba(245, 158, 11, 0.14) 0%, rgba(239, 68, 68, 0.08) 100%)",
                btnColor: "#f59e0b",
                btnTextColor: "#0f172a",
                badgeBg: "rgba(245, 158, 11, 0.15)",
                badgeBorder: "rgba(245, 158, 11, 0.4)",
                action: "Log in as Admin",
                delay: "0.4s"
              }
            ].map((portal, idx) => (
              <div
                key={portal.title}
                className="glass-panel animated-portal-card dancing-card"
                style={{
                  padding: '32px 28px',
                  borderRadius: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  borderTop: `4px solid ${portal.color}`,
                  borderLeft: '1px solid var(--border-color)',
                  borderRight: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  minHeight: '260px',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(20px)',
                  opacity: portalsVisible ? 1 : 0,
                  animationDelay: `${idx * 0.5}s`,
                  boxShadow: '0 12px 35px rgba(0,0,0,0.1)'
                }}
                onClick={() => navigate(portal.route)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-14px) scale(1.04)';
                  e.currentTarget.style.boxShadow = `0 25px 50px ${portal.glowColor}, 0 0 30px ${portal.glowColor}`;
                  e.currentTarget.style.borderColor = portal.color;
                  e.currentTarget.style.background = portal.cardBgHover;

                  const btn = e.currentTarget.querySelector('.portal-card-btn');
                  if (btn) {
                    btn.style.backgroundColor = portal.btnColor;
                    btn.style.color = portal.btnTextColor;
                    btn.style.transform = 'translateX(6px) scale(1.05)';
                    btn.style.boxShadow = `0 6px 20px ${portal.glowColor}`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-card)';

                  const btn = e.currentTarget.querySelector('.portal-card-btn');
                  if (btn) {
                    btn.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    btn.style.color = 'var(--text-main)';
                    btn.style.transform = 'translateX(0) scale(1)';
                    btn.style.boxShadow = 'none';
                  }
                }}
              >
                {/* Background ambient glow effect */}
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: portal.glowColor,
                  filter: 'blur(40px)',
                  opacity: 0.6,
                  pointerEvents: 'none'
                }} />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: portal.badgeBg,
                      color: portal.color,
                      border: `1px solid ${portal.badgeBorder}`
                    }}>
                      {portal.badge}
                    </span>
                    <span style={{ fontSize: '28px' }}>{portal.icon}</span>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0', color: 'var(--text-main)' }}>
                    {portal.title}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.6' }}>
                    {portal.desc}
                  </p>
                </div>

                <button
                  className="btn portal-card-btn"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${portal.badgeBorder}`,
                    color: 'var(--text-main)',
                    padding: '11px 22px',
                    fontSize: '12px',
                    fontWeight: '800',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    marginTop: '28px',
                    alignSelf: 'flex-start',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{portal.action}</span>
                  <span style={{ fontSize: '14px' }}>→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT US & HAVE ANY QUESTIONS SECTION ─── */}
      <section style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 80px auto',
        padding: '0 24px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '30px',
          alignItems: 'start'
        }}>
          {/* Have Any Questions Card */}
          <div className="glass-panel" style={{
            background: '#ffffff',
            padding: '40px 36px',
            borderRadius: '24px',
            border: '1px solid rgba(15,23,42,0.08)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '900',
              color: '#0f172a',
              margin: 0,
              lineHeight: 1.2
            }}>
              Have Any <span style={{ color: '#d97706' }}>Questions?</span>
            </h2>
            <p style={{
              fontSize: '14.5px',
              color: '#64748b',
              lineHeight: '1.7',
              margin: 0
            }}>
              Efficient and Safe Transportation Solutions to Make Your Travel Memorable. Book Your Ride with Us for a Stress-Free and Enjoyable Journey!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>✉️</span>
                <a href="mailto:ashwanth2567@gmail.com" style={{ color: '#475569', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
                  ashwanth2567@gmail.com
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>📞</span>
                <a href="tel:+919345271959" style={{ color: '#475569', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
                  +91-9345271959
                </a>
              </div>
            </div>
          </div>

          {/* Contact With Us Form Card */}
          <div className="glass-panel" style={{
            background: '#ffffff',
            padding: '40px 36px',
            borderRadius: '24px',
            border: '1px solid rgba(15,23,42,0.08)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '900',
              color: '#0f172a',
              margin: '0 0 20px 0'
            }}>
              Contact With Us!
            </h3>

            <form onSubmit={handleQuerySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {querySuccess && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#047857',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: '700'
                }}>
                  ✅ {querySuccess}
                </div>
              )}

              <input
                type="text"
                placeholder="Name"
                value={queryForm.name}
                onChange={e => setQueryForm({ ...queryForm, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15,23,42,0.12)',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
              <input
                type="email"
                placeholder="Email"
                value={queryForm.email}
                onChange={e => setQueryForm({ ...queryForm, email: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15,23,42,0.12)',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={queryForm.phone}
                onChange={e => setQueryForm({ ...queryForm, phone: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15,23,42,0.12)',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
              <textarea
                placeholder="Message"
                rows="4"
                value={queryForm.message}
                onChange={e => setQueryForm({ ...queryForm, message: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15,23,42,0.12)',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#f8fafc',
                  resize: 'vertical'
                }}
              />

              <button
                type="submit"
                disabled={querySending}
                style={{
                  padding: '14px 28px',
                  fontSize: '14px',
                  fontWeight: '800',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                  color: '#000000',
                  cursor: querySending ? 'not-allowed' : 'pointer',
                  opacity: querySending ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(234, 179, 8, 0.4)',
                  alignSelf: 'flex-start',
                  marginTop: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => !querySending && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => !querySending && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {querySending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── HERITAGE PALACE FOOTER WITH FLOATING ACTION BUTTONS ─── */}
      <footer style={{
        position: 'relative',
        background: "linear-gradient(to bottom, rgba(30, 20, 10, 0.75), rgba(15, 10, 5, 0.92)), url('/footer_palace_bg.png') center/cover no-repeat",
        color: '#ffffff',
        padding: '60px 24px 30px 24px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          marginBottom: '50px'
        }}>
          {/* Quick Links Column */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '800',
              color: '#ffffff',
              margin: '0 0 12px 0',
              display: 'inline-block',
              borderBottom: '3px solid #d97706',
              paddingBottom: '4px'
            }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</li>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/customer/booking')}>Book Taxi</li>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/customer/login')}>Rider Login</li>
            </ul>
          </div>

          {/* Visit Us Column */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '800',
              color: '#ffffff',
              margin: '0 0 12px 0',
              display: 'inline-block',
              borderBottom: '3px solid #d97706',
              paddingBottom: '4px'
            }}>
              Visit Us
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', fontSize: '13.5px', color: '#cbd5e1' }}>
              <div><strong>Phone:</strong> <a href="tel:+919345271959" style={{ color: '#cbd5e1', textDecoration: 'none' }}>+91-9345271959</a></div>
              <div><strong>Email:</strong> <a href="mailto:ashwanth2567@gmail.com" style={{ color: '#cbd5e1', textDecoration: 'none' }}>ashwanth2567@gmail.com</a></div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          paddingTop: '20px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#94a3b8'
        }}>
          © 2026 Travel Booking Management System. All Rights Reserved.
        </div>

        {/* Floating Quick Action Buttons (Call, WhatsApp, Scroll-To-Top) */}
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 9999
        }}>
          {/* Phone Hotline Button */}
          <a
            href="tel:+919345271959"
            title="Call Hotline (+91 9345271959)"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '20px',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            📞
          </a>

          {/* WhatsApp Chat Button */}
          <a
            href="https://wa.me/919345271959?text=Hello!%20I%20have%20a%20query%20regarding%20travel%20booking."
            target="_blank"
            rel="noreferrer"
            title="Chat on WhatsApp (+91 9345271959)"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#22c55e',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '20px',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            💬
          </a>

          {/* Scroll To Top Button */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Scroll to top"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#eab308',
              color: '#000000',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(234, 179, 8, 0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            ↑
          </button>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
