import React from 'react';
import { useApp } from '../context/AppContext';
import ProgressBar from './ProgressBar';
import '../styles/layout.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',   icon: '🏠' },
  { id: 'roadmap',   label: 'My Roadmap',  icon: '🗺️' },
  { id: 'courses',   label: 'Courses',     icon: '📚' },
  { id: 'skillgap',  label: 'Skill Gap',   icon: '📊' },
  { id: 'profile',   label: 'Profile',     icon: '👤' },
];

const Sidebar = () => {
  const { user, roadmapData, currentPage, setCurrentPage } = useApp();

  const initial = user?.name ? user.name[0].toUpperCase() : 'L';
  const progress = roadmapData?.stats?.completionPercent || 0;
  const totalWeeks = roadmapData?.stats?.estimatedWeeks || 0;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🔨</div>
        <span className="sidebar-logo-text">SkillForge AI</span>
      </div>

      {/* Profile mini card */}
      <div className="sidebar-profile">
        <div className="avatar-circle">{initial}</div>
        <div className="sidebar-profile-name">{user?.name || 'Learner'}</div>
        <div className="sidebar-profile-role">{roadmapData?.targetRole || user?.targetRole || 'Getting Started'}</div>
      </div>

      {/* Nav label */}
      <div className="sidebar-nav-label">Navigation</div>

      {/* Nav items */}
      <ul className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <button
              className={`sidebar-nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Progress card */}
      <div className="sidebar-progress-card">
        <div className="sidebar-progress-title">Overall Progress</div>
        <ProgressBar value={progress} height={6} />
        <div className="sidebar-progress-meta">
          {progress}% complete · {totalWeeks} weeks
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
