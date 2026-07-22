import React, { useState, useEffect } from 'react';

function AdminQueries({ token, toast }) {
  const API_URL = 'http://localhost:5001/api';
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueries = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/queries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueries(data);
      }
    } catch (err) {
      console.error('Failed to fetch queries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 3000);
    return () => clearInterval(interval);
  }, [token]);

  const handleResolve = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/queries/${id}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (toast) toast('Customer query marked as resolved!');
        fetchQueries();
      }
    } catch (err) {
      console.error('Failed to resolve query:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
            Customer Queries & Feedbacks 💬
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            View and manage all contact form inquiries, feedback messages, and customer requests.
          </p>
        </div>
        <span className="badge badge-confirmed" style={{ fontSize: '12px' }}>
          {queries.filter(q => q.status === 'Pending').length} Pending Items
        </span>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading queries...
        </div>
      ) : queries.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No customer query messages received yet.
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Query ID</th>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Customer Name</th>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Phone</th>
                <th style={{ padding: '12px' }}>Query Message</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q, idx) => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)' }}>
                    {q.id && q.id.startsWith('q') && !q.id.startsWith('q178') && !q.id.startsWith('q_') ? q.id : `q${idx + 1}`}
                  </td>
                  <td style={{ padding: '12px', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                    {q.createdAt || (q.updatedAt ? new Date(q.updatedAt).toLocaleString() : new Date().toLocaleString())}
                  </td>
                  <td style={{ padding: '12px', fontWeight: '700', color: 'var(--text-main)' }}>{q.name}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-primary)' }}>{q.email}</td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{q.phone || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '13px', maxWidth: '300px', lineHeight: '1.4' }}>{q.message}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${q.status === 'Resolved' ? 'badge-completed' : 'badge-pending'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {q.status !== 'Resolved' ? (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700' }}
                        onClick={() => handleResolve(q.id)}
                      >
                        Mark Resolved ✓
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminQueries;
