import React, { useState, useEffect } from 'react';

function CustomerFeedback({ token, customer }) {
  const API_URL = "http://localhost:5001/api";
  const [name, setName] = useState(customer ? customer.name : "");
  const [email, setEmail] = useState(customer ? customer.email : "");
  const [phone, setPhone] = useState(customer ? customer.phone : "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (customer) { setName(customer.name || ""); setEmail(customer.email || ""); setPhone(customer.phone || ""); }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setSuccess(""); setError("");
    try {
      const res = await fetch(`${API_URL}/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, email, phone, message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback.");
      setSuccess("Your feedback has been submitted successfully! Thank you for helping us improve.");
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[750px] mx-auto flex flex-col gap-6">
      {/* Hero Card */}
      <div className="glass-panel flex justify-between items-center px-8 py-6 rounded-[20px] overflow-hidden text-left"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(59,130,246,0.03) 100%)', border: '1px solid rgba(37,99,235,0.2)', boxShadow: '0 10px 25px rgba(37,99,235,0.08)' }}>
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2.5">
            💬 24/7 Member Helpdesk
          </div>
          <h2 className="text-[26px] font-extrabold mb-2 text-slate-900 tracking-tight">We're Here to Help!</h2>
          <p className="text-slate-500 text-sm m-0 max-w-[420px] leading-relaxed">
            Have a question, feedback, or need trip assistance? Submit your request below and our dedicated support team will assist you right away.
          </p>
        </div>
        <div className="shrink-0 ml-5">
          <img src="/illustrations/support_agent.png" alt="Customer Support Agent"
            className="h-[140px] object-contain" style={{ filter: 'drop-shadow(0 10px 20px rgba(37,99,235,0.18))', mixBlendMode: 'multiply' }} />
        </div>
      </div>

      {/* Form Card */}
      <div className="glass-panel animate-fade-in p-8 rounded-2xl border border-slate-200 text-left">
        {success && (
          <div className="px-4 py-3 rounded-lg text-sm font-semibold mb-5 text-emerald-600 bg-emerald-50 border border-emerald-500">
            {success}
          </div>
        )}
        {error && (
          <div className="px-4 py-3 rounded-lg text-sm font-semibold mb-5 text-red-600 bg-red-50 border border-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label text-[11px] uppercase tracking-wide">Full Name</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label text-[11px] uppercase tracking-wide">Phone Number</label>
              <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label text-[11px] uppercase tracking-wide">Email Address</label>
            <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label text-[11px] uppercase tracking-wide">Your Feedback</label>
            <textarea className="form-input font-inherit resize-y" rows="5"
              placeholder="Type your feedback here..." value={message}
              onChange={(e) => setMessage(e.target.value)} required />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 font-bold mt-2.5 bg-blue-500 text-white border-none rounded-[10px] text-[15px] cursor-pointer hover:bg-blue-600 hover:-translate-y-0.5 transition-all disabled:cursor-not-allowed disabled:opacity-70"
            style={{ boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }}>
            {loading ? "Submitting Feedback..." : "🚀 Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CustomerFeedback;
