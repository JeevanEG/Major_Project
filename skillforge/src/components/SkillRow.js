import React from 'react';
import StarRating from './StarRating';
import Badge from './Badge';
import '../styles/pages.css';

const SkillRow = ({ skill }) => (
  <div className="skill-row">
    <div className="skill-row-name">{skill.skill}</div>
    <StarRating value={skill.yourLevel} max={5} />
    <StarRating value={skill.required} max={5} />
    <Badge type={skill.gap}>{skill.gap}</Badge>
  </div>
);

export default SkillRow;
