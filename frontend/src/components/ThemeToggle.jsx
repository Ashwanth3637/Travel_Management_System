import React, { useState, useEffect } from 'react';

function ThemeToggle() {
  const [isLight, setIsLight] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'light' : true;
  });

  const toggleTheme = () => {
    const newVal = !isLight;
    setIsLight(newVal);
    document.body.classList.toggle('light-theme', newVal);
    localStorage.setItem('theme', newVal ? 'light' : 'dark');
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isL = saved ? saved === 'light' : true;
    setIsLight(isL);
    document.body.classList.toggle('light-theme', isL);
  }, []);

  return (
    <button
      onClick={toggleTheme}
      title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
      className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-lg transition-all hover:scale-110 outline-none shrink-0"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
    >
      {isLight ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeToggle;
