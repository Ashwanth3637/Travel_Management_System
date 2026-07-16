import React, { useState, useEffect } from 'react';

function AdminCustomers({ token, toast }) {
  const API_URL = 'http://localhost:5001/api';
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/customers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      if (toast) toast(null, err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Customer Profiles</h3>
          <button className="btn btn-secondary" onClick={fetchCustomers} style={{ padding: '8px 16px' }}>
            🔄 Refresh List
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading profiles...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Phone Number</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Account Role</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No customers registered.</td>
                  </tr>
                ) : (
                  customers.map(c => (
                    <tr key={c.id}>
                      <td style={{ whiteSpace: 'nowrap' }}><strong>{c.id}</strong></td>
                      <td>{c.name}</td>
                      <td>{c.email}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{c.phone || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="badge badge-confirmed" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }}>
                          {c.role || 'Customer'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCustomers;
