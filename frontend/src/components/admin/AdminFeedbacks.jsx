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
      const res = await fetch(`${API_URL}/queries`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setFeedbacks(await res.json());
      else toast("Failed to load customer feedbacks", false);
    } catch (err) { console.error(err); toast("Connection error loading feedbacks", false); }
    finally { setLoading(false); }
  }, [token, toast]);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  const handleResolve = async (id) => {
    if (!window.confirm("Are you sure you want to mark this feedback as resolved?")) return;
    try {
      const res = await fetch(`${API_URL}/queries/${id}/resolve`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { toast("Feedback marked as resolved!", true); fetchFeedbacks(); }
      else toast("Failed to update feedback status", false);
    } catch (err) { console.error(err); toast("Error communicating with server", false); }
  };

  const filtered = feedbacks.filter(f => {
    const matchesStatus = statusFilter === "All" || f.status === statusFilter;
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="text-left">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[26px] font-extrabold mb-1.5">📬 Customer Feedbacks & Suggestions</h2>
          <p className="text-slate-500 text-sm m-0">Supervise, track, and resolve feedback forms submitted by logged-in riders.</p>
        </div>
        <button onClick={fetchFeedbacks} className="btn btn-secondary flex items-center gap-2 px-4 py-2">🔄 Refresh</button>
      </div>

      {/* Filter Row */}
      <div className="glass-panel p-5 rounded-2xl mb-6 flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <input type="text" className="form-input" placeholder="Search feedbacks by name, email, suggestion content..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="w-[180px]">
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="text-[28px] mb-2.5">🔄</div>
            <div>Syncing feedbacks list...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <div className="text-[32px] mb-2.5">📬</div>
            <div>No customer feedbacks found matching the criteria.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Feedback ID','Customer Info','Feedback / Suggestion Message','Date Logged','Status','Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.id}</strong></td>
                    <td>
                      <div className="font-semibold">{f.name}</div>
                      <div className="text-[11px] text-slate-400">{f.email}</div>
                      <div className="text-[11px] text-slate-400">📞 {f.phone}</div>
                    </td>
                    <td>
                      <div className="text-[13px] leading-relaxed whitespace-pre-wrap max-w-[400px]">{f.message}</div>
                    </td>
                    <td className="text-xs">{f.createdAt}</td>
                    <td>
                      <span className={`badge badge-${f.status === 'Resolved' ? 'completed' : 'pending'}`}>{f.status}</span>
                    </td>
                    <td>
                      {f.status === 'Pending' ? (
                        <button className="btn btn-primary px-2.5 py-1 text-[11px] rounded-md" onClick={() => handleResolve(f.id)}>Resolve</button>
                      ) : (
                        <span className="text-[11.5px] text-emerald-600 font-semibold">✓ Handled</span>
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
