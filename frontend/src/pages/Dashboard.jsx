import React, { useState } from 'react';
import { useRoadmap } from '../context/RoadmapContext';
import { roadmapApi } from '../api/client';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ActiveDashboardContent from '../components/ActiveDashboardContent';
import OnboardingForm from '../components/OnboardingForm';
import { AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { roadmapData, updateRoadmap } = useRoadmap();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateRoadmap = async (formData) => {
    setLoading(true);
    setError('');

    try {
      const result = await roadmapApi.generate(formData);
      updateRoadmap(result);
    } catch (err) {
      console.error('Generation Error:', err);
      setError(err.response?.data?.detail || 'Failed to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 ml-72 flex flex-col">
        {/* Sticky Header */}
        <Header />

        {/* Dynamic Content Space */}
        <main className="p-10 max-w-6xl w-full mx-auto">
          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {roadmapData ? (
            <ActiveDashboardContent />
          ) : (
            <div className="space-y-10">
              <div className="text-center md:text-left">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Initialize your path</h2>
                <p className="text-slate-500 font-medium">Tell us about your goals and our AI agents will build your curriculum.</p>
              </div>
              <OnboardingForm onSubmit={handleGenerateRoadmap} loading={loading} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
