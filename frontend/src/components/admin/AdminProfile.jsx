import React, { useState, useEffect } from 'react';

function AdminProfile({ token, toast }) {
  const [adminUser, setAdminUser] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('travel_user');
      if (savedUser) {
        setAdminUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to parse admin user profile", e);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess('Admin settings updated successfully!');
    if (toast) toast('Profile updated!', null);
  };

  if (!adminUser) {
    return <div style={{ padding: '30px', color: 'var(--text-muted)' }}>Loading Admin Profile...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', textAlign: 'left' }}>
        Admin Settings & Profile
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

        <form onSubmit={handleSave}>
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label className="form-label">Admin User ID</label>
            <input
              type="text"
              className="form-input"
              value={adminUser.id || '—'}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={adminUser.name || 'Admin'}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={adminUser.email || 'admin@travels.com'}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left', marginBottom: '30px' }}>
            <label className="form-label">Account Role</label>
            <input
              type="text"
              className="form-input"
              value={adminUser.role ? adminUser.role.toUpperCase() : 'ADMINISTRATOR'}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed', color: 'var(--color-primary)', fontWeight: 'bold' }}
            />
          </div>

          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: '14px', 
              fontWeight: '700',
              fontSize: '15px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.55)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Save Profile Settings
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminProfile;
