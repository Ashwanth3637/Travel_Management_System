import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [displayText, setDisplayText] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const greetingText = "Welcome Back Admin!";

  useEffect(() => {
    let index = 0;
    setDisplayText("");
    const interval = setInterval(() => {
      if (index < greetingText.length) {
        const nextChar = greetingText[index];
        setDisplayText((prev) => prev + nextChar);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const handleRefreshGreeting = () => {
    setIsSpinning(true);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => {
      setIsSpinning(false);
    }, 800);
  };

  const API_URL = 'http://localhost:5001/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid admin credentials');
      }

      setSuccess('Access granted. Redirecting...');
      setTimeout(() => {
        onLogin(data.token, data.user);
      }, 500);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '24px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ─── ULTRA-PREMIUM AMBIENT BACKGROUND GLOW ORBS ─── */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, rgba(37, 99, 235, 0) 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '550px',
        height: '550px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, rgba(139, 92, 246, 0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '25%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(6, 182, 212, 0) 70%)',
        filter: 'blur(45px)',
        pointerEvents: 'none'
      }}></div>

      {/* Outer Card Container (Split 2 Columns with Glass Depth) */}
      <div className="animate-fade-in" style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: '1050px',
        minHeight: '620px',
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 30px 60px -12px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(37, 99, 235, 0.08), 0 0 40px rgba(37, 99, 235, 0.1)'
      }}>

        {/* LEFT SIDE: Futuristic Fleet Operations Command Center */}
        <div style={{
          position: 'relative',
          backgroundImage: "url('/admin_login_hero.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff'
        }}>
          {/* Dark Overlay Gradient */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.88) 100%)',
            zIndex: 1
          }}></div>

          {/* Top Pill Badges */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '30px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}>
              <span>🛡️</span>
              <span>Fleet Operations Command Center</span>
            </div>
            
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontSize: '11px',
              fontWeight: '700',
              color: '#34d399'
            }}>
              <span className="icon-pulse" style={{ fontSize: '10px' }}>🟢</span>
              <span>System Operational | 99.9% Uptime</span>
            </div>
          </div>

          {/* Middle Headline & Subtitle */}
          <div style={{ position: 'relative', zIndex: 2, margin: '40px 0' }}>
            <h1 style={{
              fontSize: '38px',
              fontWeight: '800',
              lineHeight: '1.2',
              marginBottom: '16px',
              color: '#ffffff',
              letterSpacing: '-0.5px',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)'
            }}>
              Take Control.<br />Drive Excellence.
            </h1>
            <p style={{
              fontSize: '14.5px',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.6',
              maxWidth: '360px',
              margin: 0
            }}>
              Enterprise dispatch management, real-time driver tracking, and fleet telemetry analytics.
            </p>
          </div>

          {/* Bottom Glass Feature Cards Container */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>🚙</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff' }}>30+ Fleet Vehicles</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Real-time telemetry</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>👨‍✈️</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff' }}>Verified Drivers</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Professional & active</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>📊</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff' }}>Live Analytics</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Dispatch intelligence</div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Clean Modern Form */}
        <div style={{
          padding: '48px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#ffffff'
        }}>
          {/* Header Branding */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                    Travel<span style={{ color: '#2563eb' }}>Booker</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                    Cab & Travel Booking System
                  </div>
                </div>
              </div>

              {/* Portal Badge */}
              <span className="badge badge-inprogress" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🛡️ Executive Portal
              </span>
            </div>

            {/* Typewriter Animated Title */}
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '4px', minHeight: '38px' }}>
              <span>{displayText}</span>
              <span style={{
                display: 'inline-block',
                width: '3px',
                height: '24px',
                backgroundColor: '#2563eb',
                marginLeft: '2px',
                borderRadius: '2px',
                animation: 'pulse-dot 1s infinite'
              }}></span>
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Sign in with your executive credentials to open command console
            </p>
          </div>

          {/* Quick Auto-Fill Demo Chip */}
          <div style={{ marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@travels.com');
                setPassword('admin123');
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px dashed #2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                color: '#2563eb',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)'; }}
            >
              <span>⚡ Click to Auto-Fill Admin Credentials</span>
              <span style={{ fontWeight: '500', opacity: 0.8 }}>(admin@travels.com / admin123)</span>
            </button>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '20px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '20px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                    height: '46px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    height: '46px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                height: '46px',
                fontSize: '15px',
                fontWeight: '700',
                borderRadius: '10px',
                backgroundColor: '#2563eb',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
              }}
            >
              Login to Dashboard
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748b'
          }}>
            Demo credentials: <strong style={{ color: '#0f172a' }}>admin@travels.com</strong> / <strong style={{ color: '#0f172a' }}>admin123</strong>
          </div>

          {/* Switch Role Link */}
          <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '13.5px' }}>
            <span style={{ color: '#64748b' }}>Are you a rider? </span>
            <Link to="/customer/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '700' }}>
              Go to Customer Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminLogin;
