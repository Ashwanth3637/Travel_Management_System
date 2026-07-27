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

  const greetingText = "Welcome Back Customer!";

  useEffect(() => {
    let index = 0;
    setDisplayText("");
    const interval = setInterval(() => {
      if (index < greetingText.length) {
        setDisplayText((prev) => prev + greetingText[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/customers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login Failed");
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => { onLogin(data.token, data.customer); navigate("/"); }, 800);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute -top-[10%] -left-[5%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0) 70%)', filter: 'blur(50px)' }} />
      <div className="absolute -bottom-[10%] -right-[5%] w-[550px] h-[550px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.16) 0%, rgba(139,92,246,0) 70%)', filter: 'blur(60px)' }} />

      {/* Main Card */}
      <div className="animate-fade-in relative z-10 w-full max-w-[1050px] min-h-[620px] grid grid-cols-[1.05fr_1fr] bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 30px 60px -12px rgba(15,23,42,0.16), 0 0 0 1px rgba(37,99,235,0.08)' }}>

        {/* LEFT Hero */}
        <div className="relative flex flex-col justify-between p-10 text-white"
          style={{ backgroundImage: "url('/travel_login_hero.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 z-[1]"
            style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.82) 100%)' }} />
          <div className="relative z-[2] self-start">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <span>✈️</span><span>Your Journey Begins Here</span>
            </div>
          </div>
          <div className="relative z-[2] my-10">
            <h1 className="text-[38px] font-extrabold leading-tight mb-4 tracking-tight"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              Travel More.<br />Worry Less.
            </h1>
            <p className="text-[14.5px] text-white/90 leading-relaxed max-w-[360px] m-0">
              Book cabs and manage your trips seamlessly and securely.
            </p>
          </div>
          <div className="relative z-[2] grid grid-cols-3 gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            {[
              { icon: '🛡️', title: 'Safe & Secure', desc: 'Your data is protected' },
              { icon: '📍', title: 'Reliable Rides', desc: 'Verified drivers' },
              { icon: '⏰', title: 'On Time Always', desc: 'Punctual pickup' },
            ].map((f) => (
              <div key={f.title}>
                <div className="text-lg mb-1">{f.icon}</div>
                <div className="text-xs font-bold text-white">{f.title}</div>
                <div className="text-[10px] text-white/70 mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT Form */}
        <div className="flex flex-col justify-center px-11 py-12 bg-white">
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[42px] h-[42px] rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0"
                style={{ boxShadow: '0 8px 16px rgba(37,99,235,0.3)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 leading-tight">
                  Travel<span className="text-blue-600">Booker</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Cab & Travel Booking System</div>
              </div>
            </div>
            <h2 className="text-[28px] font-extrabold text-slate-900 mb-1.5 tracking-tight flex items-center gap-1 min-h-[38px]">
              <span>{displayText}</span>
              <span className="inline-block w-[3px] h-6 bg-blue-600 ml-0.5 rounded-sm animate-pulse" />
            </h2>
            <p className="text-sm text-slate-500 m-0">Login to continue your journey</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold mb-5 text-red-500 bg-red-50 border border-red-200">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold mb-5 text-emerald-600 bg-emerald-50 border border-emerald-200">
              <span>✅</span><span>{success}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-[18px]">
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative w-full">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <input type="email" className="form-input w-full pl-11 h-[46px] rounded-[10px] border border-slate-300 text-sm box-border focus:outline-none focus:border-blue-500 transition"
                  placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="mb-[22px]">
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative w-full">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input type={showPassword ? "text" : "password"} className="form-input w-full pl-11 pr-11 h-[46px] rounded-[10px] border border-slate-300 text-sm box-border focus:outline-none focus:border-blue-500 transition"
                  placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-400 flex items-center p-0">
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

            <button type="submit"
              className="btn btn-primary w-full h-[46px] text-[15px] font-bold rounded-[10px] bg-blue-600 text-white border-none cursor-pointer hover:bg-blue-700 transition"
              style={{ boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
              Login to Account
            </button>
          </form>

          <div className="mt-5 text-center text-[13.5px]">
            <span className="text-slate-500">Don't have a customer account? </span>
            <Link to="/register" className="text-blue-600 no-underline font-bold hover:underline">Register Now</Link>
          </div>
          <div className="mt-3 text-center text-[13px]">
            <span className="text-slate-500">Are you an admin? </span>
            <Link to="/admin/overview" className="text-blue-600 no-underline font-bold hover:underline">Go to Admin Login</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CustomerLogin;
