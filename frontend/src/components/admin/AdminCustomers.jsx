import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function AdminCustomers({ token, toast }) {
  const API_URL = 'http://localhost:5001/api';
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingCustomer, setViewingCustomer] = useState(null);

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
                  <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
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
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-indigo" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} onClick={() => setViewingCustomer(c)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: View Customer Details */}
      {viewingCustomer && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ textAlign: 'left' }}>
            <div className="modal-header">
              <h3 className="modal-title">Customer Details</h3>
              <button className="modal-close" onClick={() => setViewingCustomer(null)}>×</button>
            </div>
            <div className="details-list">
              <div className="details-row">
                <span className="details-label">Customer ID</span>
                <span className="details-value">{viewingCustomer.id}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Full Name</span>
                <span className="details-value">{viewingCustomer.name}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Email Address</span>
                <span className="details-value">{viewingCustomer.email}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Phone Number</span>
                <span className="details-value">{viewingCustomer.phone || '—'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Account Role</span>
                <span className="details-value">{viewingCustomer.role ? viewingCustomer.role.toUpperCase() : 'CUSTOMER'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setViewingCustomer(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default AdminCustomers;
