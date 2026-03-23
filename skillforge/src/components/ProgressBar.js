import React from 'react';
import '../styles/components.css';

const ProgressBar = ({ value = 0, height = 8, variant = 'green', style = {} }) => {
  return (
    <div
      className="progress-bar-wrap"
      style={{ height: `${height}px`, ...style }}
    >
      <div
        className={`progress-bar-fill ${variant === 'purple' ? 'purple' : ''}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};

export default ProgressBar;
