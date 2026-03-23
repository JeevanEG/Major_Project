import React from 'react';
import '../styles/components.css';

const gapToClass = {
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
  'in_progress': 'badge-in-progress',
  'not_started': 'badge-not-started',
  'completed': 'badge-completed',
  Beginner: 'badge-beginner',
  Intermediate: 'badge-intermediate',
  Advanced: 'badge-advanced',
};

const gapToLabel = {
  in_progress: '🔵 In Progress',
  not_started: '⏳ Not Started',
  completed: '✅ Completed',
};

const Badge = ({ type, children }) => {
  const cls = gapToClass[type] || 'badge-not-started';
  const label = gapToLabel[type] || children || type;
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default Badge;
