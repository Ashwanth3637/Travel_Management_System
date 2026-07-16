import { useState, useEffect } from "react";

function CustomerProfile({ customer, onUpdateProfile }) {
  const [name, setName] = useState(customer ? customer.name : "");
  const [phone, setPhone] = useState(customer ? customer.phone : "");
  const [email, setEmail] = useState(customer ? customer.email : ""); // Email cannot be changed (primary key)
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone || "");
      setEmail(customer.email || "");
    }
  }, [customer]);

  const handleUpdate = (e) => {
    e.preventDefault();
    setSuccess("");

    if (!name || !phone) {
      alert("Name and Phone are required.");
      return;
    }

    const updatedCustomer = { ...customer, name, phone };
    onUpdateProfile(updatedCustomer);
    setSuccess("Profile details updated successfully!");
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', textAlign: 'left' }}>
        Manage Your Profile
      </h2>

      <div className="glass-panel" style={{ padding: '30px' }}>
        {success && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--status-completed-bg)',
            color: 'var(--status-completed)',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '20px',
            border: '1px solid var(--status-completed)',
            textAlign: 'left'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Email Address (Read-only)</label>
            <input
              type="email"
              className="form-input"
              value={email}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '30px' }}>
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default CustomerProfile;
