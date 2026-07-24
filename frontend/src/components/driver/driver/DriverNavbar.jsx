import { FaUserCircle } from "react-icons/fa";
import { useState, useEffect } from "react";
import ThemeToggle from "../../ThemeToggle";

const DriverNavbar = () => {
  const [driverName, setDriverName] = useState("Driver");

  useEffect(() => {
    const driver = JSON.parse(localStorage.getItem("driver"));
    if (driver && driver.name) {
      setDriverName(driver.name);
    }
  }, []);

  return (
    <div className="glass-panel" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 24px', 
      height: '70px',
      borderRadius: '0',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
    }}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
        Dashboard Overview
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <FaUserCircle size={28} color="var(--color-primary)" />
        <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{driverName}</span>
      </div>
    </div>
  );
};

export default DriverNavbar;