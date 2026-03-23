import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LandingPage   from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import RoadmapPage   from './pages/RoadmapPage';
import CoursesPage   from './pages/CoursesPage';
import SkillGapPage  from './pages/SkillGapPage';
import ProfilePage   from './pages/ProfilePage';

const Router = () => {
  const { user, roadmapData, currentPage } = useApp();

  // Show landing if not logged in
  if (!user || !roadmapData) return <LandingPage />;

  switch (currentPage) {
    case 'dashboard': return <DashboardPage />;
    case 'roadmap':   return <RoadmapPage />;
    case 'courses':   return <CoursesPage />;
    case 'skillgap':  return <SkillGapPage />;
    case 'profile':   return <ProfilePage />;
    default:          return <DashboardPage />;
  }
};

const App = () => (
  <AppProvider>
    <Router />
  </AppProvider>
);

export default App;
