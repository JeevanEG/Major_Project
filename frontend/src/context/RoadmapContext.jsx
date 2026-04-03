import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, roadmapApi } from '../api/client';

const RoadmapContext = createContext(null);

export const RoadmapProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoadmap = async () => {
    try {
      const data = await roadmapApi.get();
      setRoadmapData(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch roadmap:', err);
      setRoadmapData(null);
      return null;
    }
  };

  const login = async (username, password) => {
    try {
      const data = await authApi.login(username, password);
      localStorage.setItem('token', data.access_token);
      
      const userProfile = await authApi.getMe();
      setUser(userProfile);
      
      await fetchRoadmap();
      return userProfile;
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRoadmapData(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userProfile = await authApi.getMe();
          setUser(userProfile);
          await fetchRoadmap();
        } catch (err) {
          console.error('Auth initialization failed:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const updateRoadmap = (data) => {
    setRoadmapData(data);
  };

  const startSkill = (skillName) => {
    if (!roadmapData) return;
    
    const stages = roadmapData.curriculum_plan?.learning_stages || [];
    let foundModIdx = -1;
    let foundSkillIdx = -1;

    for (let i = 0; i < stages.length; i++) {
      const skills = stages[i].skills;
      for (let j = 0; j < skills.length; j++) {
        if (skills[j].skill === skillName) {
          foundModIdx = i;
          foundSkillIdx = j;
          break;
        }
      }
      if (foundModIdx !== -1) break;
    }

    if (foundModIdx !== -1) {
      const newData = {
        ...roadmapData,
        current_module_index: foundModIdx,
        current_skill_index: foundSkillIdx,
        current_topic_index: 0
      };
      updateRoadmap(newData);
    }
  };

  const updateTopic = (index) => {
    if (!roadmapData) return;
    const newData = {
      ...roadmapData,
      current_topic_index: index
    };
    updateRoadmap(newData);
  };

  const clearRoadmapState = () => {
    setRoadmapData(null);
  };

  return (
    <RoadmapContext.Provider value={{ 
      user, 
      roadmapData, 
      isLoading, 
      login, 
      logout, 
      fetchRoadmap,
      updateRoadmap,
      startSkill,
      updateTopic,
      clearRoadmap: clearRoadmapState
    }}>
      {children}
    </RoadmapContext.Provider>
  );
};

export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};
