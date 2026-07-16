import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function CustomerRegister() {
  const navigate = useNavigate();
  const API_URL = "http://localhost:5001/api";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/customers/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration Failed");
      }

      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 8px 0'
          }}>
            Create Rider Account
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Join Travels Cab to book rides instantly
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

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '30px' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
            Create Rider Account
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px" }}>
          Already have a rider account?
          <Link
            to="/login"
            style={{
              color: "var(--color-primary)",
              marginLeft: "6px",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CustomerRegister;
