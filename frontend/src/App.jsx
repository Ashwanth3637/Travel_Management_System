import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";

// Admin Components & Layout
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";

function AdminLayout({ handleLogout, children }) {
  return (
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
          <Link 
            to="/admin/profile" 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none', 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#fff',
              fontSize: '11px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}>
              A
            </div>
            <span className="badge badge-confirmed" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Admin
            </span>
          </Link>
        </div>
      </nav>
      <main style={{ padding: '20px' }} className="animate-fade-in">
        {children}
      </main>
    </>
  );
}

function AdminRoute() {
  const [token, setToken] = useState(() => sessionStorage.getItem("travel_token") || "");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("travel_user")) || null; } catch { return null; }
  });

  const handleLogin = (t, u) => {
    sessionStorage.setItem("travel_token", t);
    sessionStorage.setItem("travel_user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    sessionStorage.removeItem("travel_token");
    sessionStorage.removeItem("travel_user");
    setToken("");
    setUser(null);
  };

  if (!token) {
    return <AdminLogin onLogin={handleLogin} />;
  }
  return (
    <AdminLayout handleLogout={handleLogout}>
      <AdminDashboard token={token} handleLogout={handleLogout} />
    </AdminLayout>
  );
}

// Customer Components & Layout
import CustomerNavbar from "./components/customer/CustomerNavbar";
import CustomerLogin from "./components/customer/CustomerLogin";
import CustomerRegister from "./components/customer/CustomerRegister";
import CustomerDashboard from "./components/customer/CustomerDashboard";

function CustomerLayout({ customer, customers, onSelectCustomer, handleLogout, children }) {
  return (
    <>
      <CustomerNavbar 
        customer={customer} 
        customers={customers} 
        onSelectCustomer={onSelectCustomer} 
        handleLogout={handleLogout} 
      />
      <main style={{ padding: '0 20px 20px' }} className="animate-fade-in">
        {children}
      </main>
    </>
  );
}

// Driver Components
import DriverLogin from "./components/driver/pages/driver/DriverLogin";
import DriverDashboard from "./components/driver/pages/driver/DriverDashboard";
import DriverProfile from "./components/driver/pages/driver/DriverProfile";
import AssignedTrips from "./components/driver/pages/driver/AssignedTrips";
import TripHistory from "./components/driver/pages/driver/TripHistory";
import Availability from "./components/driver/pages/driver/Availability";

import DriverLayout from "./components/driver/layouts/DriverLayout";
import ProtectedRoute from "./components/driver/driver/ProtectedRoute";

function App() {
  // Customer Authentication States
  const [customerToken, setCustomerToken] = useState(() => {
    return sessionStorage.getItem('customerToken') || null;
  });
  const [customer, setCustomer] = useState(() => {
    const saved = sessionStorage.getItem('customer');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState("home");
  const [activeTrackBooking, setActiveTrackBooking] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    if (customerToken) {
      const fetchCustomersList = async () => {
        try {
          const res = await fetch('http://localhost:5001/api/customers', {
            headers: {
              'Authorization': `Bearer ${customerToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setCustomers(data);
          }
        } catch (err) {
          console.error("Failed to load customer list", err);
        }
      };
      fetchCustomersList();
    } else {
      setCustomers([]);
    }
  }, [customerToken]);

  const handleSelectCustomer = (selectedCust) => {
    setCustomer(selectedCust);
    sessionStorage.setItem('customer', JSON.stringify(selectedCust));
  };

  const handleCustomerLogin = (cToken, cUser) => {
    sessionStorage.setItem('customerToken', cToken);
    sessionStorage.setItem('customer', JSON.stringify(cUser));
    setCustomerToken(cToken);
    setCustomer(cUser);
    setActiveTab("home");
  };

  const handleCustomerLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    sessionStorage.removeItem('customerToken');
    sessionStorage.removeItem('customer');
    setCustomerToken(null);
    setCustomer(null);
    setActiveTrackBooking(null);
  };

  const handleUpdateProfile = (updatedUser) => {
    sessionStorage.setItem('customer', JSON.stringify(updatedUser));
    setCustomer(updatedUser);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminRoute />} />
          <Route path="/admin/login" element={<AdminRoute />} />

          {/* Driver Routes */}
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route
            path="/driver"
            element={
              <ProtectedRoute>
                <DriverLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DriverDashboard />} />
            <Route path="profile" element={<DriverProfile />} />
            <Route path="trips" element={<AssignedTrips />} />
            <Route path="history" element={<TripHistory />} />
            <Route path="availability" element={<Availability />} />
          </Route>

          {/* Customer Routes (Rider Module) */}
          <Route 
            path="/login" 
            element={
              customerToken ? (
                <Navigate to="/" replace />
              ) : (
                <CustomerLogin onLogin={handleCustomerLogin} />
              )
            } 
          />
          
          <Route 
            path="/register" 
            element={
              customerToken ? (
                <Navigate to="/" replace />
              ) : (
                <CustomerRegister />
              )
            } 
          />

          {/* Secure Rider Dashboard routes */}
          <Route 
            path="/*" 
            element={
              customerToken ? (
                <CustomerLayout 
                  customer={customer} 
                  customers={customers} 
                  onSelectCustomer={handleSelectCustomer} 
                  handleLogout={handleCustomerLogout}
                >
                  <CustomerDashboard 
                    token={customerToken} 
                    customer={customer} 
                    onUpdateProfile={handleUpdateProfile}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    activeTrackBooking={activeTrackBooking}
                    setActiveTrackBooking={setActiveTrackBooking}
                    handleLogout={handleCustomerLogout}
                  />
                </CustomerLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;