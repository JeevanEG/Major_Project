import React from 'react';
import '../styles/components.css';

const StarRating = ({ value = 0, max = 5 }) => (
  <div className="stars">
    {Array.from({ length: max }).map((_, i) => (
      <span key={i} className={`star ${i < value ? 'filled' : ''}`}>★</span>
    ))}
  </div>
);

export default StarRating;
