
function CustomerNavbar({ customer, handleLogout }) {
  return (
    <nav className="navbar" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
      <div className="nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        TravelGo <span style={{ fontSize: '12px', opacity: 0.8, fontWeight: '600', marginLeft: '6px', color: '#3b82f6' }}>AI Fleet</span>
      </div>

      <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="badge badge-inprogress" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          RIDER
        </span>
        <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.3px' }}>
          {customer ? customer.name : 'Rider'}
        </span>
      </div>
    </nav>
  );
}

export default CustomerNavbar;
