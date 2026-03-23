import React from 'react';
import '../styles/components.css';

const Tag = ({ children, gray = false }) => (
  <span className={`tag ${gray ? 'tag-gray' : ''}`}>{children}</span>
);

export default Tag;
