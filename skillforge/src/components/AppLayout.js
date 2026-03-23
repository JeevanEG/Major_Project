import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../styles/layout.css';

const AppLayout = ({ children }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Navbar />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
