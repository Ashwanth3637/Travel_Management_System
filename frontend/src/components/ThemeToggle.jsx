import React, { useState, useEffect } from 'react';

function ThemeToggle() {
  const [isLight, setIsLight] = useState(() => {
    return document.body.classList.contains('light-theme');
  });

  const toggleTheme = () => {
    const newVal = !isLight;
    setIsLight(newVal);
    document.body.classList.toggle('light-theme', newVal);
    localStorage.setItem('theme', newVal ? 'light' : 'dark');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isL = savedTheme === 'light';
    setIsLight(isL);
    document.body.classList.toggle('light-theme', isL);
  }, []);

  return (
    <button
      onClick={toggleTheme}
      title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--border-color)',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '18px',
        color: 'var(--text-main)',
        transition: 'all 0.2s ease',
        outline: 'none',
        flexShrink: 0
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      }}
    >
      {isLight ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeToggle;
