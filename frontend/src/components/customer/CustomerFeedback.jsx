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
    <div className="glass-panel animate-fade-in" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 10px 0', color: 'var(--text-main)' }}>
        💬 Customer Feedback
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 24px 0', lineHeight: '1.5' }}>
        We value your thoughts and experience. Share your suggestions, queries, or comments below to help us improve the Travel Booking Management System.
      </p>

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
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%', padding: '12px', fontWeight: '700', marginTop: '10px' }}
        >
          {loading ? "Submitting Feedback..." : "🚀 Submit Feedback"}
        </button>
      </form>
    </div>
  );
}

export default CustomerFeedback;
