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
    setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_URL}/customers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration Failed");
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5 bg-slate-50">
      <div className="glass-panel animate-fade-in w-full max-w-[450px] p-10">
        <div className="text-center mb-8">
          <h2 className="text-[28px] font-extrabold mb-2"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Create Rider Account
          </h2>
          <p className="text-slate-500 text-sm m-0">
            Join Travel Booking Management System to book rides instantly
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg text-[14px] font-medium mb-5 text-red-600 bg-red-50 border border-red-400 text-left">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 rounded-lg text-[14px] font-medium mb-5 text-emerald-600 bg-emerald-50 border border-emerald-500 text-left">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" placeholder="John Doe"
              value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="rider@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="tel" className="form-input" placeholder="9876543210"
              value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="form-group mb-2">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-full text-[15px] py-3.5 mt-2">
            Create Rider Account
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-600">
          Already have a rider account?
          <Link to="/login" className="text-blue-600 ml-1.5 no-underline font-semibold hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default CustomerRegister;
