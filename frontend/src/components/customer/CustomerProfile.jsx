import { useState, useEffect } from "react";

function CustomerProfile({ customer, onUpdateProfile }) {
  const [name, setName] = useState(customer ? customer.name : "");
  const [phone, setPhone] = useState(customer ? customer.phone : "");
  const [email, setEmail] = useState(customer ? customer.email : "");
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
    if (!name || !phone) { alert("Name and Phone are required."); return; }
    onUpdateProfile({ ...customer, name, phone });
    setSuccess("Profile details updated successfully!");
  };

  return (
    <div className="animate-fade-in max-w-[600px] mx-auto">
      <h2 className="text-2xl font-bold mb-5 text-left">Manage Your Profile</h2>
      <div className="glass-panel p-8">
        {success && (
          <div className="px-4 py-3 rounded-lg text-sm mb-5 text-emerald-600 bg-emerald-50 border border-emerald-500 text-left">
            {success}
          </div>
        )}
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Email Address (Read-only)</label>
            <input type="email" className="form-input opacity-60 cursor-not-allowed" value={email} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group mb-4">
            <label className="form-label">Phone Number</label>
            <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-full py-3.5">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default CustomerProfile;
