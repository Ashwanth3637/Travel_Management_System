import React, { useState, useEffect, useCallback } from 'react';

function AdminFeedbacks({ token, toast }) {
  const API_URL = "http://localhost:5001/api";

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/queries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      } else {
        toast("Failed to load customer feedbacks", false);
      }
    } catch (err) {
      console.error(err);
      toast("Connection error loading feedbacks", false);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleResolve = async (id) => {
    if (!window.confirm("Are you sure you want to mark this feedback as resolved?")) return;

    try {
      const res = await fetch(`${API_URL}/queries/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast("Feedback marked as resolved!", true);
        fetchFeedbacks();
      } else {
        toast("Failed to update feedback status", false);
      }
    } catch (err) {
      console.error(err);
      toast("Error communicating with server", false);
    }
  };

  const filtered = feedbacks.filter(f => {
    const matchesStatus = statusFilter === "All" || f.status === statusFilter;
    const matchesSearch = 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
            📬 Customer Feedbacks & Suggestions
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Supervise, track, and resolve feedback forms submitted by logged-in riders.
          </p>
        </div>
        <button 
          onClick={fetchFeedbacks} 
          className="btn btn-secondary" 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search feedbacks by name, email, suggestion content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ width: '180px' }}>
          <select 
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Feedbacks Data Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="icon-spin" style={{ display: 'inline-block', fontSize: '28px', marginBottom: '10px' }}>🔄</div>
            <div>Syncing feedbacks list...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📬</div>
            <div>No customer feedbacks found matching the criteria.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feedback ID</th>
                  <th>Customer Info</th>
                  <th>Feedback / Suggestion Message</th>
                  <th>Date Logged</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.id}</strong></td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{f.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.email}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📞 {f.phone}</div>
                    </td>
                    <td>
                      <div style={{ 
                        fontSize: '13px', 
                        lineHeight: '1.45', 
                        whiteSpace: 'pre-wrap', 
                        maxWidth: '400px',
                        color: 'var(--text-main)'
                      }}>
                        {f.message}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px' }}>{f.createdAt}</td>
                    <td>
                      <span className={`badge badge-${f.status === 'Resolved' ? 'completed' : 'pending'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td>
                      {f.status === 'Pending' ? (
                        <button 
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                          onClick={() => handleResolve(f.id)}
                        >
                          Resolve
                        </button>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--status-completed)', fontWeight: '600' }}>
                          ✓ Handled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminFeedbacks;
