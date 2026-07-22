import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";

const DriverLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Login
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5001/api/auth/driver/login",
        formData
      );

      // Save JWT Token
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("driver", JSON.stringify(res.data.user));

      setSuccess("Access granted. Redirecting...");
      
      setTimeout(() => {
        // Redirect
        navigate("/driver/dashboard");
      }, 500);

    } catch (err) {
      setError(
        err.response?.data?.error || "Login Failed. Please try again."
      );
    } finally {
      setLoading(false);
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
            Driver Login
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Travel Booking Management System
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
            border: '1px solid var(--status-cancelled)'
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
            border: '1px solid var(--status-completed)'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email, Phone, or Driver ID</label>
            <input
              type="text"
              name="email"
              className="form-input"
              placeholder="rajesh@travels.com or d1"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', fontSize: '15px', padding: '14px' }}>
            {loading ? "Logging In..." : "Login to Driver Portal"}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Don't have a driver account?{" "}
          <Link to="/driver/register" style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'none' }}>
            Register as Driver
          </Link>
        </div>

        <div style={{
          marginTop: '24px',
          padding: '12px 14px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: '1px dashed var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          textAlign: 'left'
        }}>
          <strong style={{ color: 'var(--color-primary)' }}>💡 Valid Driver Credentials:</strong>
          <ul style={{ margin: '6px 0 0 16px', padding: 0, lineHeight: '1.6' }}>
            <li><strong>Driver ID:</strong> <code>d1</code> or <code>d2</code> or <code>d3</code></li>
            <li><strong>Email:</strong> <code>rajesh@travels.com</code></li>
            <li><strong>Password:</strong> <code>driver123</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DriverLogin;