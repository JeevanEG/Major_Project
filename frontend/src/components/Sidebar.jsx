import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  BookOpen, 
  BarChart3, 
  User, 
  ChevronRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { useRoadmap } from '../context/RoadmapContext';

const Sidebar = () => {
  const { roadmapData } = useRoadmap();
  const targetRole = roadmapData?.learner_profile?.target_role || "Aspiring Specialist";

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'My Roadmap', icon: Map, path: '/roadmap' },
    { name: 'Courses', icon: BookOpen, path: '/courses' },
    { name: 'Skill Gap', icon: BarChart3, path: '/skill-gap' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-100 flex flex-col h-screen fixed top-0 left-0 z-30">
      {/* Brand Profile Section */}
      <div className="p-8">
        <div className="bg-slate-50 rounded-[2.5rem] p-6 text-center border border-slate-100">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-primary-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary-200">
              L
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-sm" />
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-none">Learner</h3>
          <p className="text-[0.65rem] font-black text-primary-600 uppercase tracking-widest mt-2">{targetRole}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-8">
        <p className="px-5 text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group
              ${isActive 
                ? 'bg-[#1e1b4b] text-white shadow-xl shadow-slate-200' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-primary-600'}
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.name === 'Dashboard' ? 'animate-pulse' : ''}`} />
              <span className="font-bold text-sm">{item.name}</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Progress Card Section */}
      <div className="p-6 mt-auto">
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl shadow-slate-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
               <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                 <Sparkles className="w-5 h-5 text-primary-400" />
               </div>
               <span className="text-2xl font-black">12%</span>
            </div>
            <p className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Progress</p>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-[#10b981] w-[12%] rounded-full shadow-[0_0_10px_#10b981]" />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Clock className="w-3.5 h-3.5" />
              <span>12 Weeks Estimated</span>
            </div>
          </div>
          
          {/* Decorative background circle */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
