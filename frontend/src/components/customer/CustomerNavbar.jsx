
function CustomerNavbar({ customer, customers = [], onSelectCustomer, handleLogout }) {
  return (
    <nav className="navbar" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
      <div className="nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        Travels Cab Rider Portal
      </div>

      {/* Acting As Customer Selector */}
      {customers.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acting As:</span>
          <select
            value={customer ? customer.name : ''}
            onChange={(e) => {
              const selected = customers.find(c => c.name === e.target.value);
              if (selected) {
                onSelectCustomer(selected);
              }
            }}
            className="form-input"
            style={{
              padding: '4px 10px',
              fontSize: '13.5px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'var(--color-primary)',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '150px'
            }}
          >
            {customers.map((c) => (
              <option key={c.id || c.name} value={c.name} style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span className="badge badge-inprogress">
          Rider
        </span>
        <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)' }}>
          {customer ? customer.name : 'Rider'}
        </span>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default CustomerNavbar;
