import React from 'react';
import { Sparkles, LogOut, Bell, Search } from 'lucide-react';
import { useRoadmap } from '../context/RoadmapContext';

const Header = () => {
  const { logout, roadmapData } = useRoadmap();
  const targetRole = roadmapData?.learner_profile?.target_role || "Aspiring Specialist";

  return (
    <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tighter">SkillForge AI</span>
        </div>
        
        <div className="h-8 w-px bg-slate-100" />
        
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hi, Learner</h2>
          <div className="px-4 py-1.5 bg-primary-50 text-primary-600 text-[0.7rem] font-black uppercase tracking-wider rounded-full border border-primary-100">
            Training for: {targetRole}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search modules..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary-500/10 transition-all w-64"
          />
        </div>
        
        <button className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
        </button>

        <div className="h-8 w-px bg-slate-100" />

        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
