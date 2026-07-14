import React, { useState, useEffect } from 'react';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // load auth state from local storage
  useEffect(() => {
    const savedToken = localStorage.getItem('travel_token');
    const savedUser = localStorage.getItem('travel_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (loginToken, loginUser) => {
    localStorage.setItem('travel_token', loginToken);
    localStorage.setItem('travel_user', JSON.stringify(loginUser));
    setToken(loginToken);
    setUser(loginUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('travel_token');
    localStorage.removeItem('travel_user');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#10b981'
      }}>
        Loading Admin System...
      </div>
    );
  }

  return (
    <div className="app-container">
      {token && user ? (
        <>
          <nav className="navbar">
            <div className="nav-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z"></path>
                <path d="M18 18h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4"></path>
                <circle cx="7" cy="17" r="2"></circle>
                <circle cx="17" cy="17" r="2"></circle>
              </svg>
              Travels Cab Admin
            </div>
            <div className="nav-user">
              <span className="badge badge-confirmed">
                Admin
              </span>
              <span style={{ fontWeight: '600', fontSize: '15px' }}>{user.name}</span>
              <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px' }}>
                Logout
              </button>
            </div>
          </nav>
          <main style={{ padding: '40px' }} className="animate-fade-in">
            <AdminDashboard token={token} />
          </main>
        </>
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
