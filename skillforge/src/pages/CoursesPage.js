import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import AppLayout from '../components/AppLayout';
import CourseCard from '../components/CourseCard';
import '../styles/pages.css';
import '../styles/components.css';

const TABS = ['All', 'In Progress', 'Completed'];

const CoursesPage = () => {
  const { roadmapData, courseProgress, updateCourseProgress } = useApp();
  const [activeTab, setActiveTab] = useState('All');

  if (!roadmapData) return null;
  const { courses = [] } = roadmapData;

  // Merge server progress with local overrides
  const enriched = courses.map((c) => ({
    ...c,
    progress: courseProgress[c.id] ?? c.progress ?? 0,
  }));

  const filtered = enriched.filter((c) => {
    if (activeTab === 'In Progress') return c.progress > 0 && c.progress < 100;
    if (activeTab === 'Completed')  return c.progress >= 100;
    return true;
  });

  const handleContinue = (course) => {
    // Simulate advancing progress by 10% for demo purposes
    const current = courseProgress[course.id] ?? course.progress ?? 0;
    const next = Math.min(100, current + 10);
    updateCourseProgress(course.id, next);
  };

  const totalPhases = new Set(courses.map((c) => c.phase)).size;

  return (
    <AppLayout>
      <div className="page-header fade-up">
        <div className="page-title">📚 My Courses</div>
        <div className="page-subtitle">
          {courses.length} courses across {totalPhases} phases
        </div>
      </div>

      <div className="tabs fade-up">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-muted)',
          fontSize: '15px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          No {activeTab.toLowerCase()} courses yet.
        </div>
      ) : (
        <div className="courses-grid">
          {filtered.map((course, idx) => (
            <div key={course.id} style={{ animationDelay: `${idx * 0.06}s` }}>
              <CourseCard course={course} onContinue={handleContinue} />
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default CoursesPage;
