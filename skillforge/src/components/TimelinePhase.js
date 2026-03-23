import React from 'react';
import Badge from './Badge';
import Tag from './Tag';
import '../styles/pages.css';

const TimelinePhase = ({ phase, index }) => {
  const isCurrent = phase.status === 'in_progress';

  return (
    <div className="timeline-phase fade-up" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className={`timeline-phase-number ${isCurrent ? 'active' : 'inactive'}`}>
        {phase.id}
      </div>
      <div className={`timeline-phase-card ${isCurrent ? 'current' : ''}`}>
        <div className="timeline-phase-header">
          <div>
            <div className="timeline-phase-label">PHASE {phase.id}</div>
            <div className="timeline-phase-title">{phase.title}</div>
          </div>
          <div className="timeline-phase-meta">
            <Badge type={phase.status} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🕐 {phase.weeks} {phase.weeks === 1 ? 'week' : 'weeks'}
            </span>
          </div>
        </div>

        {phase.topics && phase.topics.length > 0 && (
          <>
            <div className="timeline-topics-label">TOPICS COVERED</div>
            <div className="skills-tag-list">
              {phase.topics.map((topic) => (
                <Tag key={topic} gray={!isCurrent}>{topic}</Tag>
              ))}
            </div>
          </>
        )}

        {isCurrent && (
          <div className="current-phase-banner">
            📍 You are currently here! Keep going.
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePhase;
