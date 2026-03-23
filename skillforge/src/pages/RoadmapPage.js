import React from 'react';
import { useApp } from '../context/AppContext';
import AppLayout from '../components/AppLayout';
import TimelinePhase from '../components/TimelinePhase';
import '../styles/pages.css';

const RoadmapPage = () => {
  const { roadmapData } = useApp();

  if (!roadmapData) return null;
  const { phases = [], targetRole, stats } = roadmapData;

  return (
    <AppLayout>
      <div className="page-header fade-up">
        <div className="page-title">🗺️ My Learning Roadmap</div>
        <div className="page-subtitle">
          Your personalized path to becoming a <strong>{targetRole}</strong> —{' '}
          {stats?.estimatedWeeks} weeks total
        </div>
      </div>

      <div className="roadmap-timeline">
        <div className="roadmap-timeline-line" />
        {phases.map((phase, idx) => (
          <TimelinePhase key={phase.id} phase={phase} index={idx} />
        ))}
      </div>
    </AppLayout>
  );
};

export default RoadmapPage;
