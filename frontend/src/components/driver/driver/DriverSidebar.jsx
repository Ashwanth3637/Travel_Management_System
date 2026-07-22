import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaCar,
  FaHistory,
  FaToggleOn,
  FaSignOutAlt,
} from "react-icons/fa";

const DriverSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("driver");
    navigate("/driver/login");
  };

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    color: isActive ? '#ffffff' : 'var(--text-main)',
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.2s',
    borderLeft: isActive ? '4px solid #ffffff' : '4px solid transparent',
    boxShadow: isActive ? '0 0 20px rgba(59, 130, 246, 0.45)' : 'none',
  });

  return (
    <div className="glass-panel" style={{ 
      width: '260px', 
      minHeight: '100vh', 
      borderRadius: '0', 
      borderTop: 'none', 
      borderBottom: 'none',
      borderLeft: 'none',
      padding: '0',
      display: 'flex',
      flexDirection: 'column'
    }}>

      <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{
          fontSize: '24px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Driver Panel
        </div>
      </div>

      <nav style={{ flex: 1, marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        <NavLink to="/driver/dashboard" style={linkStyle}>
          <FaHome /> Dashboard
        </NavLink>

        <NavLink to="/driver/profile" style={linkStyle}>
          <FaUser /> My Profile
        </NavLink>

        <NavLink to="/driver/trips" style={linkStyle}>
          <FaCar /> Assigned Trips
        </NavLink>

        <NavLink to="/driver/history" style={linkStyle}>
          <FaHistory /> Trip History
        </NavLink>

        <NavLink to="/driver/availability" style={linkStyle}>
          <FaToggleOn /> Availability
        </NavLink>

      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
        <button 
          onClick={handleLogout}
          className="btn btn-danger" 
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  );
};

export default DriverSidebar;