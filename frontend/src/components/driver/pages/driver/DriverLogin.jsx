import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const DriverLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!formData.email || !formData.password) { setError("Please enter both email and password."); return; }
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5001/api/auth/driver/login", formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("driver", JSON.stringify(res.data.user));
      setSuccess("Access granted. Redirecting...");
      setTimeout(() => navigate("/driver/dashboard"), 500);
    } catch (err) {
      setError(err.response?.data?.error || "Login Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5 bg-slate-50">
      <div className="glass-panel animate-fade-in w-full max-w-[420px] p-10">
        <div className="text-center mb-8">
          <div className="text-[30px] font-extrabold mb-2"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Driver Login
          </div>
          <p className="text-slate-500 text-sm m-0">Travel Booking Management System</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm font-medium mb-5 text-red-600 bg-red-50 border border-red-400">{error}</div>
        )}
        {success && (
          <div className="px-4 py-3 rounded-lg text-sm font-medium mb-5 text-emerald-600 bg-emerald-50 border border-emerald-500">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Email, Phone, or Driver ID</label>
            <input type="text" name="email" className="form-input" placeholder="rajesh@travels.com or d1"
              value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group mb-2">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" placeholder="••••••••"
              value={formData.password} onChange={handleChange} required />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full text-[15px] py-3.5">
            {loading ? "Logging In..." : "Login to Driver Portal"}
          </button>
        </form>

        <div className="text-center mt-4 text-[13.5px] text-slate-500">
          Don't have a driver account?{" "}
          <Link to="/driver/register" className="text-blue-600 font-bold no-underline hover:underline">Register as Driver</Link>
        </div>

        <div className="mt-6 px-3.5 py-3 rounded-lg text-[12px] text-slate-500 text-left"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed #cbd5e1' }}>
          <strong className="text-blue-600">💡 Valid Driver Credentials:</strong>
          <ul className="mt-1.5 ml-4 p-0 leading-relaxed">
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
