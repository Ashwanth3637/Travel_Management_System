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
    if (customer) {
      setName(customer.name || "");
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
    }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const res = await fetch(`${API_URL}/queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
    <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Support Hero Card */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)',
        border: '1px solid rgba(37, 99, 235, 0.2)',
        borderRadius: '20px',
        padding: '24px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        textAlign: 'left',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(37, 99, 235, 0.08)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
            💬 24/7 Member Helpdesk
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
            We're Here to Help!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, maxWidth: '420px', lineHeight: '1.5' }}>
            Have a question, feedback, or need trip assistance? Submit your request below and our dedicated support team will assist you right away.
          </p>
        </div>
        <div style={{ flexShrink: 0, marginLeft: '20px' }}>
          <img 
            src="/illustrations/support_agent.png" 
            alt="Customer Support Agent" 
            style={{ 
              height: '140px', 
              objectFit: 'contain', 
              filter: 'drop-shadow(0 10px 20px rgba(37, 99, 235, 0.18))',
              mixBlendMode: 'multiply'
            }} 
          />
        </div>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'left' }}>

      {success && (
        <div className="live-pulse-dot" style={{ padding: '12px 16px', backgroundColor: 'var(--status-completed-bg)', color: 'var(--status-completed)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', marginBottom: '20px', border: '1px solid var(--status-completed)' }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', marginBottom: '20px', border: '1px solid var(--status-cancelled)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Feedback</label>
          <textarea
            className="form-input"
            rows="5"
            placeholder="Type your feedback here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            style={{ fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            fontWeight: '700',
            marginTop: '10px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.55)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {loading ? "Submitting Feedback..." : "🚀 Submit Feedback"}
        </button>
      </form>
    </div>
  </div>
  );
}

export default CustomerFeedback;
