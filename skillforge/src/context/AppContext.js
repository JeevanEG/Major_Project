import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [courseProgress, setCourseProgress] = useState({});

  const login = (userData, roadmap) => {
    setUser(userData);
    setRoadmapData(roadmap);
    setCurrentPage('dashboard');
  };

  const logout = () => {
    setUser(null);
    setRoadmapData(null);
    setCurrentPage('dashboard');
    setCourseProgress({});
  };

  const updateProfile = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const updateCourseProgress = (courseId, progress) => {
    setCourseProgress((prev) => ({ ...prev, [courseId]: progress }));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        roadmapData,
        currentPage,
        courseProgress,
        setCurrentPage,
        login,
        logout,
        updateProfile,
        updateCourseProgress,
        setRoadmapData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
