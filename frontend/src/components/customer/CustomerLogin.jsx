import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function CustomerLogin({ onLogin }) {
  const navigate = useNavigate();
  const API_URL = "http://localhost:5001/api";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [displayText, setDisplayText] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const greetingText = "hello customer, welcome to our website";

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/customers/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login Failed");
      }

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        onLogin(data.token, data.customer);
        navigate("/");
      }, 800);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      {/* Live Heading - Outside the Login Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '28px',
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        textShadow: '0 0 15px rgba(197, 168, 92, 0.6)',
        padding: '8px 16px',
        borderRadius: '30px',
        background: 'rgba(197, 168, 92, 0.08)',
        border: '1px solid rgba(197, 168, 92, 0.22)',
        backdropFilter: 'blur(8px)'
      }}>
        <span style={{ minWidth: '320px', textAlign: 'center', display: 'inline-block' }}>
          {displayText}
          <span style={{
            display: 'inline-block',
            width: '2px',
            height: '14px',
            backgroundColor: 'var(--color-primary)',
            marginLeft: '4px',
            animation: 'pulse-dot 1s infinite'
          }}></span>
        </span>

        <button
          type="button"
          onClick={handleRefreshGreeting}
          title="Refresh greeting"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            backgroundColor: 'rgba(197, 168, 92, 0.06)',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(197, 168, 92, 0.16)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(197, 168, 92, 0.06)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg
            className={isSpinning ? "icon-spin" : ""}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 4v6h-6"></path>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
      </div>

      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            fontSize: '30px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Customer Login
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>

          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--status-cancelled-bg)',
            color: 'var(--status-cancelled)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
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
            fontWeight: '500',
            marginBottom: '20px',
            border: '1px solid var(--status-completed)',
            textAlign: 'left'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="rider@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '30px', position: 'relative' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', paddingRight: '45px', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              width: "100%",
              fontSize: '15px',
              padding: '14px'
            }}
          >
            Login to Account
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px" }}>
          Don't have a customer account?
          <Link
            to="/register"
            style={{
              color: "var(--color-primary)",
              marginLeft: "6px",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Register Now
          </Link>
        </div>


      </div>
    </div>
  );
}

export default CustomerLogin;
