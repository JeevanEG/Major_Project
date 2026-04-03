import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useRoadmap } from '../context/RoadmapContext';
import { 
  LayoutDashboard, 
  Map, 
  BookOpen, 
  BarChart3, 
  User, 
  LogOut,
  Sparkles,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const DashboardLayout = () => {
  const { logout, user } = useRoadmap();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'My Roadmap', icon: Map, path: '/roadmap' },
    { name: 'Courses', icon: BookOpen, path: '/courses' },
    { name: 'Skill Gap', icon: BarChart3, path: '/skill-gap' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Top Header - Inspired by index.html */}
      <header className="bg-[#1e1b4b] text-white py-8 md:py-12 shadow-lg z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
              <Sparkles className="w-8 h-8 text-primary-400" />
              SkillForge AI
            </h1>
            <p className="text-primary-200/80 font-medium text-sm md:text-base">Your Autonomous Career Growth Partner</p>
          </div>

          {/* Desktop Nav in Header */}
          <nav className="hidden md:flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl backdrop-blur-sm border border-white/10">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `
                  px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2
                  ${isActive 
                    ? 'bg-primary-600 text-white shadow-lg' 
                    : 'text-primary-100 hover:text-white hover:bg-white/10'}
                `}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            ))}
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button 
              onClick={logout}
              className="px-4 py-2 rounded-xl text-sm font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button onClick={toggleMobileMenu} className="md:hidden p-3 bg-white/10 rounded-xl">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[140px] left-0 right-0 bg-[#1e1b4b] border-t border-white/10 p-6 z-30 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all
                    ${isActive ? 'bg-primary-600 text-white' : 'text-primary-100 hover:bg-white/5'}
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              ))}
              <button 
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-rose-300 hover:bg-rose-500/10"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 relative">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <Outlet />
      </main>

      {/* Footer - From index.html */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-500">
             <Sparkles className="w-6 h-6 text-primary-600" />
             <span className="font-black text-slate-900 tracking-tighter text-xl">SkillForge AI</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            &copy; 2026 SkillForge AI. Powered by <span className="text-slate-900 font-bold">LangGraph & FastAPI</span>.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="hover:text-primary-600 cursor-pointer transition-colors">Documentation</span>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            <span className="hover:text-primary-600 cursor-pointer transition-colors">Privacy Policy</span>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            <span className="hover:text-primary-600 cursor-pointer transition-colors">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
