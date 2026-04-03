import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Zap, 
  ChevronRight,
  TrendingUp,
  Circle
} from 'lucide-react';
import { useRoadmap } from '../context/RoadmapContext';

const ActiveDashboardContent = () => {
  const navigate = useNavigate();
  const { roadmapData } = useRoadmap();
  
  const stages = roadmapData?.curriculum_plan?.learning_stages || [];
  const allSkills = stages.flatMap(stage => stage.skills || []);
  const totalWeeks = stages.reduce((acc, stage) => {
    return acc + (stage.skills || []).reduce((skAcc, sk) => skAcc + (sk.estimated_weeks || 0), 0);
  }, 0);

  // Completion calculation (if we had completed_topics in GraphState)
  const completedTopics = roadmapData?.completed_topics || [];
  const completionPercentage = allSkills.length > 0 
    ? Math.round((completedTopics.length / allSkills.length) * 100) 
    : 0;

  const kpis = [
    { label: 'Skills Path', value: `${allSkills.length} Skills`, icon: BookOpen, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Est. Duration', value: `${totalWeeks} Weeks`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Modules', value: `${stages.length} Phases`, icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Completion', value: `${completionPercentage}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  // Get first 2 skills for "In Progress" section
  const inProgressSkills = allSkills.slice(0, 2);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Hero Banner */}
      <div className="bg-[#1e1b4b] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-300">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-2 text-primary-400 font-black text-xs uppercase tracking-[0.3em]">
              <Sparkles className="w-5 h-5" />
              Intelligence Ready
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
              Your roadmap is <span className="text-primary-400">ready.</span>
            </h2>
            <p className="text-primary-100/60 font-medium text-lg max-w-md">
              Our agents have calculated your skill gap. Start your first session now.
            </p>
            <div className="pt-4">
               <button 
                onClick={() => navigate('/courses')}
                className="px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-900/40 transition-all flex items-center gap-3 active:scale-95 group"
               >
                 Start Learning 
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
          
          <div className="hidden lg:block relative">
            <div className="w-64 h-64 bg-primary-600/20 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-3xl animate-pulse">
               <TrendingUp className="w-24 h-24 text-primary-400" />
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-900/20 rounded-full blur-[100px] -ml-32 -mb-32" />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center group hover:-translate-y-1 transition-all">
            <div className={`w-14 h-14 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform`}>
              <kpi.icon className="w-7 h-7" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none mb-1">{kpi.value}</p>
            <p className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-12">
        {/* In Progress Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900">In Progress ({inProgressSkills.length})</h3>
              <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                 <TrendingUp className="w-5 h-5" />
              </div>
           </div>
           
           <div className="space-y-8">
              {inProgressSkills.length > 0 ? inProgressSkills.map((skill, idx) => (
                <div key={idx} className="space-y-4">
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-1">Current Skill</p>
                         <p className="text-sm font-bold text-slate-900">{skill.skill || 'Untitled Module'}</p>
                      </div>
                      <span className="text-xs font-black text-primary-600">0%</span>
                   </div>
                   <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600 w-[0%] rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-1000" />
                   </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <p className="text-slate-400 font-medium italic">No modules started yet.</p>
                </div>
              )}
           </div>

           <button 
            onClick={() => navigate('/courses')}
            className="w-full mt-10 py-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
           >
             Go to Course Catalog <ChevronRight className="w-4 h-4" />
           </button>
        </div>

        {/* Roadmap Phases Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
           <h3 className="text-xl font-black text-slate-900 mb-8">Roadmap Phases</h3>
           
           <div className="space-y-6">
              {stages.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-5 group cursor-pointer" onClick={() => navigate('/roadmap')}>
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${
                     idx === 0 
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-lg' 
                      : 'bg-slate-50 text-slate-300'
                   }`}>
                      {stage.stage || idx + 1}
                   </div>
                   <div className="flex-1 border-b border-slate-50 pb-4">
                      <p className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phase {stage.stage || idx + 1}</p>
                      <h4 className="font-bold text-slate-900 leading-none group-hover:text-primary-600 transition-colors">
                        {stage.focus_priority || 'Curriculum Focus'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">{(stage.skills || []).length} Skills • {(stage.skills || []).reduce((a, s) => a + (s.estimated_weeks || 0), 0)} Weeks</p>
                   </div>
                   <Circle className={`w-5 h-5 ${idx === 0 ? 'text-primary-600' : 'text-slate-100'}`} />
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveDashboardContent;
