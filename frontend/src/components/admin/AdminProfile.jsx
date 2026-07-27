import React, { useState, useEffect } from 'react';

function AdminProfile({ token, toast }) {
  const [adminUser, setAdminUser] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('travel_user');
      if (savedUser) setAdminUser(JSON.parse(savedUser));
    } catch (e) { console.error("Failed to parse admin user profile", e); }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess('Admin settings updated successfully!');
    if (toast) toast('Profile updated!', null);
  };

  if (!adminUser) return <div className="p-8 text-slate-400">Loading Admin Profile...</div>;

  const readonlyFields = [
    { label: 'Admin User ID', value: adminUser.id || '—', type: 'text' },
    { label: 'Full Name', value: adminUser.name || 'Admin', type: 'text' },
    { label: 'Email Address', value: adminUser.email || 'admin@travels.com', type: 'email' },
    { label: 'Account Role', value: adminUser.role ? adminUser.role.toUpperCase() : 'ADMINISTRATOR', type: 'text', highlight: true },
  ];

  return (
    <div className="animate-fade-in max-w-[600px] mx-auto">
      <h2 className="text-2xl font-bold mb-5 text-left">Admin Settings & Profile</h2>
      <div className="glass-panel p-8">
        {success && (
          <div className="px-4 py-3 rounded-lg text-sm mb-5 text-emerald-600 bg-emerald-50 border border-emerald-500 text-left">{success}</div>
        )}
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {readonlyFields.map(f => (
            <div key={f.label} className="form-group text-left mb-0">
              <label className="form-label">{f.label}</label>
              <input type={f.type} className={`form-input opacity-60 cursor-not-allowed ${f.highlight ? 'text-blue-600 font-bold' : ''}`}
                value={f.value} disabled />
            </div>
          ))}
          <button type="submit"
            className="w-full py-3.5 font-bold text-[15px] bg-blue-500 text-white border-none rounded-[10px] cursor-pointer hover:bg-blue-600 hover:-translate-y-0.5 transition-all mt-2"
            style={{ boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }}>
            Save Profile Settings
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminProfile;
