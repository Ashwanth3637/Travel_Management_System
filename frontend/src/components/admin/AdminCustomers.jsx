import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function AdminCustomers({ token, toast }) {
  const API_URL = 'http://localhost:5001/api';
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingCustomer, setViewingCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/customers`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch customers');
      setCustomers(await res.json());
    } catch (err) {
      if (toast) toast(null, err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="glass-panel">
        <div className="flex justify-between items-center mb-5">
          <h3 className="m-0">Customer Profiles</h3>
          <button className="btn btn-secondary px-4 py-2" onClick={fetchCustomers}>🔄 Refresh List</button>
        </div>

        {loading ? (
          <div className="py-10 text-slate-400">Loading profiles...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th className="whitespace-nowrap">Phone Number</th>
                  <th className="whitespace-nowrap">Account Role</th>
                  <th className="whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-slate-400">No customers registered.</td></tr>
                ) : (
                  customers.map(c => (
                    <tr key={c.id}>
                      <td className="whitespace-nowrap"><strong>{c.id}</strong></td>
                      <td>{c.name}</td>
                      <td>{c.email}</td>
                      <td className="whitespace-nowrap">{c.phone || '—'}</td>
                      <td className="whitespace-nowrap">
                        <span className="badge badge-confirmed bg-blue-100 text-blue-600 border-none">{c.role || 'Customer'}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        <button 
                          onClick={() => setViewingCustomer(c)}
                          className="px-2.5 h-7 text-[11px] font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-white border-none cursor-pointer transition inline-flex items-center justify-center"
                        >
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

      {viewingCustomer && createPortal(
        <div className="modal-overlay">
          <div className="glass-panel modal-content text-left">
            <div className="modal-header">
              <h3 className="modal-title">Customer Details</h3>
              <button className="modal-close" onClick={() => setViewingCustomer(null)}>×</button>
            </div>
            <div className="details-list">
              {[
                { label: 'Customer ID', value: viewingCustomer.id },
                { label: 'Full Name', value: viewingCustomer.name },
                { label: 'Email Address', value: viewingCustomer.email },
                { label: 'Phone Number', value: viewingCustomer.phone || '—' },
                { label: 'Account Role', value: viewingCustomer.role ? viewingCustomer.role.toUpperCase() : 'CUSTOMER' },
              ].map(row => (
                <div key={row.label} className="details-row">
                  <span className="details-label">{row.label}</span>
                  <span className="details-value">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-5">
              <button className="btn btn-secondary px-3 py-1.5 text-xs" onClick={() => setViewingCustomer(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminCustomers;
