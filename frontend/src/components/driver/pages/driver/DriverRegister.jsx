import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const DriverRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", licenseNumber: "", gender: "Male", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!formData.name || !formData.email || !formData.phone || !formData.licenseNumber || !formData.password) { setError("Please fill out all required fields."); return; }
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return; }
    if (formData.password.length < 6) { setError("Password must be at least 6 characters long."); return; }
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5001/api/auth/driver/register", {
        name: formData.name, email: formData.email, phone: formData.phone,
        licenseNumber: formData.licenseNumber, gender: formData.gender, password: formData.password
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("driver", JSON.stringify(res.data.user));
      setSuccess("Account created successfully! Redirecting to dashboard...");
      setTimeout(() => navigate("/driver/dashboard"), 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-10 px-5 bg-slate-50">
      <div className="glass-panel animate-fade-in w-full max-w-[480px] px-10 py-9 text-left">
        <div className="text-center mb-7">
          <div className="text-[28px] font-extrabold mb-2"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Driver Signup
          </div>
          <p className="text-slate-500 text-[13.5px] m-0">Register as a driver with Travel Booking Management System</p>
        </div>

        {error && <div className="px-4 py-3 rounded-lg text-[13.5px] font-medium mb-5 text-red-600 bg-red-50 border border-red-400">{error}</div>}
        {success && <div className="px-4 py-3 rounded-lg text-[13.5px] font-medium mb-5 text-emerald-600 bg-emerald-50 border border-emerald-500">{success}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-input" placeholder="e.g. Rajesh Kumar" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" className="form-input" placeholder="e.g. rajesh@travels.com" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="tel" name="phone" className="form-input" placeholder="e.g. +91 98765 43210" value={formData.phone} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Driving License Number</label>
            <input type="text" name="licenseNumber" className="form-input" placeholder="e.g. DL-12345TN" value={formData.licenseNumber} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" placeholder="At least 6 characters" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="form-group mb-5">
            <label className="form-label">Confirm Password</label>
            <input type="password" name="confirmPassword" className="form-input" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full text-[15px] py-3.5 font-bold">
            {loading ? "Registering Account..." : "Create Driver Account"}
          </button>
        </form>

        <div className="text-center mt-6 text-[13.5px] text-slate-500">
          Already registered?{" "}
          <Link to="/driver/login" className="text-blue-600 font-bold no-underline hover:underline">Log in to Driver Portal</Link>
        </div>
      </div>
    </div>
  );
};

export default DriverRegister;
