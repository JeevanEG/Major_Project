import React from 'react';
import { useApp } from '../context/AppContext';
import '../styles/layout.css';

const Navbar = () => {
  const { user, roadmapData, logout } = useApp();

  return (
    <header className="navbar">
      <span className="navbar-greeting">
        Hi, {user?.name || 'Learner'} 👋
      </span>
      {roadmapData?.targetRole && (
        <span className="navbar-badge">
          Training for: {roadmapData.targetRole}
        </span>
      )}
      <button className="btn-logout" onClick={logout}>
        ↩ Logout
      </button>
    </header>
  );
};

export default Navbar;
