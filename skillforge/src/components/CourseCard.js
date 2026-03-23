import React from 'react';
import ProgressBar from './ProgressBar';
import Badge from './Badge';
import '../styles/pages.css';
import '../styles/components.css';

const phaseColorMap = {
  1: 'phase-1',
  2: 'phase-2',
  3: 'phase-3',
  4: 'phase-4',
};

const CourseCard = ({ course, onContinue }) => {
  const progress = course.progress || 0;
  const phaseClass = phaseColorMap[course.phase] || 'phase-1';
  const diffLower = (course.difficulty || 'Beginner').toLowerCase();

  return (
    <div className="course-card fade-up">
      <div className={`course-card-top ${phaseClass}`} />
      <div className="course-card-body">
        <div className="course-card-phase">{course.phaseLabel || `Phase ${course.phase}`}</div>
        <div className="course-card-title">{course.title}</div>

        <div className="course-card-progress-row">
          <span className="course-progress-label">Progress</span>
          <span className={`course-progress-value ${progress === 0 ? 'zero' : ''}`}>
            {progress}%
          </span>
        </div>

        <ProgressBar value={progress} height={7} />

        <div className="course-card-meta">
          <Badge type={course.difficulty}>{course.difficulty}</Badge>
          <span className="course-duration">🕐 {course.hours}h</span>
        </div>
      </div>

      <div className="course-card-footer">
        <button
          className="btn-primary block"
          onClick={() => onContinue && onContinue(course)}
          style={{ padding: '10px 16px', fontSize: '13px' }}
        >
          {progress > 0 ? '▶ Continue →' : 'Start Lesson →'}
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
