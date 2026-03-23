import React from 'react';
import { useApp } from '../context/AppContext';
import AppLayout from '../components/AppLayout';
import ProgressBar from '../components/ProgressBar';
import '../styles/pages.css';
import '../styles/components.css';

const StatCard = ({ icon, value, label, colorClass, bgColor }) => (
  <div className="stat-card fade-up">
    <div className="stat-icon" style={bgColor ? { background: bgColor } : {}}>
      {icon}
    </div>
    <div className={`stat-value ${colorClass}`}>{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const DashboardPage = () => {
  const { user, roadmapData, courseProgress, setCurrentPage } = useApp();

  if (!roadmapData) return null;

  const { stats, courses = [], phases = [] } = roadmapData;
  const inProgressCourses = courses.filter(
    (c) => (courseProgress[c.id] ?? c.progress) > 0
  );

  return (
    <AppLayout>
      {/* Hero banner */}
      <div className="hero-banner fade-up">
        <div className="hero-content">
          <div className="hero-title">🎉 Your roadmap is ready!</div>
          <div className="hero-subtitle">
            Here's your learning overview for becoming a{' '}
            <strong>{roadmapData.targetRole}</strong>. You're on{' '}
            <strong>Phase 1</strong>. Keep it up! 🚀
          </div>
          <button
            className="btn-hero"
            onClick={() => setCurrentPage('roadmap')}
          >
            Start Learning →
          </button>
        </div>
        <div className="hero-emoji">📖</div>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        <StatCard
          icon="🧠"
          value={stats.skillsToMaster}
          label="Skills to Master"
          colorClass="blue"
          bgColor="#eff6ff"
        />
        <StatCard
          icon="📅"
          value={stats.estimatedWeeks}
          label="Estimated Weeks"
          colorClass="green"
          bgColor="#f0fdf4"
        />
        <StatCard
          icon="📚"
          value={stats.coursesAvailable}
          label="Courses Available"
          colorClass="orange"
          bgColor="#fffbeb"
        />
        <StatCard
          icon="🏆"
          value={`${stats.completionPercent}%`}
          label="Completion %"
          colorClass="purple"
          bgColor="var(--primary-light)"
        />
      </div>

      {/* Bottom grid */}
      <div className="dashboard-bottom-grid">
        {/* In Progress */}
        <div className="in-progress-section fade-up fade-up-2">
          <div className="section-title">
            ▶ In Progress ({inProgressCourses.length || courses.slice(0, 2).length})
          </div>
          {(inProgressCourses.length > 0 ? inProgressCourses : courses.slice(0, 2)).map((course) => {
            const prog = courseProgress[course.id] ?? course.progress ?? 0;
            return (
              <div key={course.id} className="course-progress-item">
                <div className="course-progress-header">
                  <span className="course-progress-name">{course.title}</span>
                  <span className="course-progress-pct">{prog}%</span>
                </div>
                <ProgressBar value={prog} height={8} />
              </div>
            );
          })}
          {courses.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              No courses in progress yet. Start your first lesson!
            </p>
          )}
        </div>

        {/* Roadmap phases panel */}
        <div className="roadmap-phases-panel fade-up fade-up-3">
          <div className="section-title">🗺️ Roadmap Phases</div>
          {phases.map((phase, idx) => (
            <div key={phase.id} className="phase-list-item">
              <div className={`phase-number-badge ${idx === 0 ? 'active' : 'inactive'}`}>
                {phase.id}
              </div>
              <div>
                <div className="phase-info-title">{phase.title}</div>
                <div className="phase-info-meta">
                  {phase.weeks}w · {phase.topics?.length || 0} topics
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
