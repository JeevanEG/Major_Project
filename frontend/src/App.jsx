import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoadmapProvider, useRoadmap } from './context/RoadmapContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import Courses from './pages/Courses';
import LearningViewer from './pages/LearningViewer';
import DashboardLayout from './layouts/DashboardLayout';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useRoadmap();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        } 
      >
        <Route index element={<Dashboard />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="courses" element={<Courses />} />
        <Route path="learning/:skillId" element={<LearningViewer />} />
        <Route path="skill-gap" element={
          <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Skill Gap Analysis</h2>
            <p className="text-slate-500 font-medium">Coming soon in Phase 2.</p>
          </div>
        } />
        <Route path="profile" element={
          <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-4">My Profile</h2>
            <p className="text-slate-500 font-medium">Coming soon in Phase 2.</p>
          </div>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <RoadmapProvider>
        <AppRoutes />
      </RoadmapProvider>
    </Router>
  );
}

export default App;
