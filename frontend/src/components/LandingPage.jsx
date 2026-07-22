import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

function LandingPage() {
  const navigate = useNavigate();

  // Slider Slides for general Travel Booking
  const slides = [
    {
      title: "Premium Outstation & Intercity Rides",
      subtitle: "Book comfortable intercity rides and long-distance travels with professional chauffeurs.",
      bg: "radial-gradient(rgba(5,5,8,0.45), rgba(5,5,8,0.55)), url('/travel_hero.png') center/cover no-repeat"
    },
    {
      title: "Hourly Cab Rentals & Local Travel",
      subtitle: "Hire a premium vehicle by the hour for business meetings or flexible city travels.",
      bg: "linear-gradient(135deg, rgba(10,10,18,0.5) 0%, rgba(15,15,28,0.55) 100%), url('/travel_hero.png') center/cover no-repeat"
    },
    {
      title: "Outstation & Airport Taxi Booking",
      subtitle: "Seamless long-distance travel connecting major cities with verified, reliable drivers.",
      bg: "linear-gradient(135deg, rgba(15,15,28,0.5) 0%, rgba(5,5,10,0.55) 100%), url('/travel_hero.png') center/cover no-repeat"
    }
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  // Live vehicle image slideshow — changes every 2 seconds
  const vehicleImages = [
    { src: '/cars/luxury/audi.png',              label: 'Audi A8 — Luxury Class',             type: 'car' },
    { src: '/cars/luxury/benz.png',              label: 'Mercedes Benz — Business Class',      type: 'car' },
    { src: '/cars/luxury/bmw.png',               label: 'BMW 7 Series — Executive Class',      type: 'car' },
    { src: '/cars/sedan/swift_dzire.png',        label: 'Swift Dzire — Economy Sedan',         type: 'car' },
    { src: '/cars/sedan/suzuki_baleno.png',      label: 'Baleno — Premium Hatchback',          type: 'car' },
    { src: '/cars/suv/toyota_fortuner.png',      label: 'Fortuner — Full-Size SUV',            type: 'car' },
    { src: '/cars/suv/mahindra_xuv700.png',      label: 'XUV700 — Premium SUV',                type: 'car' },
    { src: '/cars/suv/mahindra_thar.png',        label: 'Thar — Off-Road Adventure',           type: 'car' },
    { src: '/cars/minivan/innova_crysta.png',    label: 'Innova Crysta — Family MPV',          type: 'car' },
    { src: '/cars/minivan/tempo_traveller.png',  label: 'Tempo Traveller — Group Travel',      type: 'car' },
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
    }, 2000);
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
            <a href="tel:+917339888611" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '800' }}>
              +91-7339888611
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
          <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '700' }} onClick={() => navigate('/customer/booking')}>
            Book a Ride
          </button>
          <ThemeToggle />
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
            color: 'var(--text-main)',
            textShadow: '0 4px 15px rgba(0,0,0,0.6)'
          }}>
            {slides[activeSlide].title}
          </h1>

          <p style={{
            fontSize: '17px',
            color: 'var(--text-muted)',
            maxWidth: '600px',
            margin: '0 0 32px 0',
            lineHeight: '1.6',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)'
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
                e.currentTarget.style.boxShadow = '0 0 35px rgba(197,168,92,0.75), 0 8px 25px rgba(0,0,0,0.4)';
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
            <span style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              fontWeight: '800',
              letterSpacing: '1.5px',
              color: 'var(--color-primary)',
              display: 'block',
              marginBottom: '10px'
            }}>
              Travel Booking Management System
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 16px 0', lineHeight: 1.25 }}>
              Enjoy Comfortable Travel & Outstation Cab Booking Services
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
              padding: '16px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 15px 30px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              alignItems: 'center'
            }}>
              <img
                src={vehicleImages[activeImg].src}
                alt={vehicleImages[activeImg].label}
                style={{
                  width: '100%',
                  height: '220px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  display: 'block',
                  opacity: imgVisible ? 1 : 0,
                  transition: 'opacity 0.35s ease'
                }}
              />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                opacity: imgVisible ? 1 : 0,
                transition: 'opacity 0.35s ease'
              }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  backgroundColor: vehicleImages[activeImg].type === 'driver'
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(197,168,92,0.12)',
                  color: vehicleImages[activeImg].type === 'driver'
                    ? '#60a5fa'
                    : 'var(--color-primary)',
                  border: vehicleImages[activeImg].type === 'driver'
                    ? '1px solid rgba(59,130,246,0.3)'
                    : '1px solid rgba(197,168,92,0.25)'
                }}>
                  {vehicleImages[activeImg].type === 'driver' ? '👨‍✈️ Our Drivers' : '🚗 Vehicle Fleet'}
                </span>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: vehicleImages[activeImg].type === 'driver' ? '#60a5fa' : 'var(--color-primary)',
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                }}>
                  {vehicleImages[activeImg].label}
                </div>
              </div>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {vehicleImages.map((_, idx) => (
                  <div key={idx} onClick={() => setActiveImg(idx)} style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    backgroundColor: idx === activeImg ? 'var(--color-primary)' : 'rgba(255,255,255,0.18)',
                    cursor: 'pointer', transition: 'all 0.3s ease'
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
            src="/travel_banner_bg.png"
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
          {/* Dark gradient overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(5,5,10,0.85) 0%, rgba(5,5,10,0.4) 60%, rgba(5,5,10,0.1) 100%)'
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
            <span style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              fontWeight: '800',
              letterSpacing: '2px',
              color: 'var(--color-primary)',
              display: 'block',
              marginBottom: '12px'
            }}>
              {bannerFeatures[selectedBannerItem].tag}
            </span>
            <h2 style={{
              fontSize: '34px',
              fontWeight: '900',
              lineHeight: 1.2,
              margin: '0 0 16px 0',
              color: '#fff',
              textShadow: '0 4px 15px rgba(0,0,0,0.6)',
              transition: 'all 0.3s ease'
            }}>
              {bannerFeatures[selectedBannerItem].title}
            </h2>
            <p style={{
              fontSize: '14.5px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.7,
              margin: '0 0 28px 0',
              transition: 'all 0.3s ease'
            }}>
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
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.25s ease',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
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
                    background: isActive ? 'rgba(197, 168, 92, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: isActive ? '1.5px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    fontSize: '13.5px',
                    fontWeight: isActive ? '900' : '700',
                    color: isActive ? 'var(--color-primary)' : '#fff',
                    minWidth: '170px',
                    cursor: 'pointer',
                    transform: isActive ? 'translateX(-12px) scale(1.08)' : 'translateX(0) scale(1)',
                    boxShadow: isActive ? '0 0 25px rgba(197, 168, 92, 0.45)' : '0 4px 15px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                    zIndex: isActive ? 10 : 1
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.transform = 'translateX(-4px) scale(1.02)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {[
              {
                title: "👤 Customer Rider Portal",
                desc: "Request on-demand rides, search pick-up locations, select vehicles, and view ride logs.",
                route: "/customer/home",
                color: "var(--color-primary)",
                glowColor: "rgba(197, 168, 92, 0.22)",
                btnColor: "var(--color-primary)",
                action: "Enter Portal"
              },
              {
                title: "👨‍✈️ Driver Control Console",
                desc: "Manage telemetry trip dispatches, update ride status (Ongoing / Complete), and set availability.",
                route: "/driver/dashboard",
                color: "var(--color-secondary)",
                glowColor: "rgba(255, 255, 255, 0.18)",
                btnColor: "#ffffff",
                action: "Open Console"
              },
              {
                title: "👑 Admin Control Center",
                desc: "Supervise all logs, manage vehicle classes, register drivers, and download CSV financial analytics.",
                route: "/admin/overview",
                color: "#3b82f6",
                glowColor: "rgba(59, 130, 246, 0.25)",
                btnColor: "#3b82f6",
                action: "Log in as Admin"
              }
            ].map((portal, idx) => (
              <div
                key={portal.title}
                className="glass-panel"
                style={{
                  padding: '28px',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  borderLeft: `4px solid ${portal.color}`,
                  cursor: 'pointer',
                  minHeight: '200px',
                  opacity: portalsVisible ? 1 : 0,
                  transform: portalsVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s, box-shadow 0.25s',
                  transitionDelay: portalsVisible ? `${idx * 150}ms` : '0ms',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                }}
                onClick={() => navigate(portal.route)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)';
                  e.currentTarget.style.boxShadow = `0 15px 30px ${portal.glowColor}`;
                  e.currentTarget.style.borderColor = portal.color;
                  
                  const btn = e.currentTarget.querySelector('.portal-card-btn');
                  if (btn) {
                    btn.style.backgroundColor = portal.btnColor;
                    btn.style.color = '#000000';
                    btn.style.transform = 'translateX(6px)';
                    btn.style.boxShadow = `0 4px 12px ${portal.glowColor}`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  
                  const btn = e.currentTarget.querySelector('.portal-card-btn');
                  if (btn) {
                    btn.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    btn.style.color = 'var(--text-main)';
                    btn.style.transform = 'translateX(0)';
                    btn.style.boxShadow = 'none';
                  }
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 10px 0', color: 'var(--text-main)' }}>
                    {portal.title}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                    {portal.desc}
                  </p>
                </div>
                <button
                  className="btn portal-card-btn"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '9px 18px',
                    fontSize: '11px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    pointerEvents: 'none',
                    marginTop: '24px',
                    alignSelf: 'flex-start',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {portal.action} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        padding: '24px 24px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        width: '100%',
        boxSizing: 'border-box',
        background: '#070709'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <span>© 2026 Travel Booking Management System. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>📞 Support: +91-7339888611</span>
            <span>📍 Outstation & Local Booking</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
