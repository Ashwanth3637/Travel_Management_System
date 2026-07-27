import React, { useState, useEffect } from 'react';

function AdminQueries({ token, toast }) {
  const API_URL = 'http://localhost:5001/api';
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueries = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/queries`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setQueries(await res.json());
    } catch (err) { console.error('Failed to fetch queries:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 3000);
    return () => clearInterval(interval);
  }, [token]);

  const handleResolve = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/queries/${id}/resolve`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { if (toast) toast('Customer query marked as resolved!'); fetchQueries(); }
    } catch (err) { console.error('Failed to resolve query:', err); }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold m-0">Customer Queries & Feedbacks 💬</h2>
          <p className="text-[13px] text-slate-500 mt-1 mb-0">View and manage all contact form inquiries, feedback messages, and customer requests.</p>
        </div>
        <span className="badge badge-confirmed text-xs">
          {queries.filter(q => q.status === 'Pending').length} Pending Items
        </span>
      </div>

      {loading ? (
        <div className="glass-panel py-10 text-center text-slate-400">Loading queries...</div>
      ) : queries.length === 0 ? (
        <div className="glass-panel py-10 text-center text-slate-400">No customer query messages received yet.</div>
      ) : (
        <div className="glass-panel p-5 rounded-2xl overflow-x-auto">
          <table className="data-table w-full border-collapse">
            <thead>
              <tr className="text-left">
                {['Query ID','Date','Customer Name','Email','Phone','Query Message','Status','Action'].map(h => (
                  <th key={h} className="p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queries.map((q, idx) => (
                <tr key={q.id} className="border-b border-slate-200">
                  <td className="p-3 text-[13px] font-bold text-blue-600">
                    {q.id && q.id.startsWith('q') && !q.id.startsWith('q178') && !q.id.startsWith('q_') ? q.id : `q${idx + 1}`}
                  </td>
                  <td className="p-3 text-[12.5px] whitespace-nowrap">
                    {q.createdAt || (q.updatedAt ? new Date(q.updatedAt).toLocaleString() : new Date().toLocaleString())}
                  </td>
                  <td className="p-3 font-bold">{q.name}</td>
                  <td className="p-3 text-[13px] text-blue-600">{q.email}</td>
                  <td className="p-3 text-[13px]">{q.phone || 'N/A'}</td>
                  <td className="p-3 text-[13px] max-w-[300px] leading-relaxed">{q.message}</td>
                  <td className="p-3">
                    <span className={`badge ${q.status === 'Resolved' ? 'badge-completed' : 'badge-pending'}`}>{q.status}</span>
                  </td>
                  <td className="p-3">
                    {q.status !== 'Resolved' ? (
                      <button className="btn btn-secondary px-3.5 py-1.5 text-xs font-bold" onClick={() => handleResolve(q.id)}>
                        Mark Resolved ✓
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Resolved</span>
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
