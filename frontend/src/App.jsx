import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

// Admin
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";

// Driver
import DriverLogin from "./components/driver/pages/driver/DriverLogin";
import DriverDashboard from "./components/driver/pages/driver/DriverDashboard";
import DriverProfile from "./components/driver/pages/driver/DriverProfile";
import AssignedTrips from "./components/driver/pages/driver/AssignedTrips";
import TripHistory from "./components/driver/pages/driver/TripHistory";
import Availability from "./components/driver/pages/driver/Availability";

import DriverLayout from "./components/driver/layouts/DriverLayout";
import ProtectedRoute from "./components/driver/driver/ProtectedRoute";

function AdminRoute() {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("adminUser")) || null; } catch { return null; }
  });

  const handleLogin = (t, u) => {
    localStorage.setItem("adminToken", t);
    localStorage.setItem("adminUser", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  if (!token) {
    return <AdminLogin onLogin={handleLogin} />;
  }
  return <AdminDashboard token={token} />;
}

function App() {
  return (
    <BrowserRouter>
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

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;