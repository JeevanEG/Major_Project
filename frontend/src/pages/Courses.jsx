import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  ArrowLeft,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import { useRoadmap } from '../context/RoadmapContext';

const Courses = () => {
  const navigate = useNavigate();
  const { roadmapData } = useRoadmap();

  if (!roadmapData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 max-w-lg">
          <div className="w-24 h-24 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <BookOpen className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Your Catalog is Empty</h2>
          <p className="text-slate-500 mb-10 text-lg">It looks like you haven't generated a personalized roadmap yet.</p>
          <Link to="/" className="inline-flex items-center gap-3 px-10 py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 hover:-translate-y-1">
            <ArrowLeft className="w-6 h-6" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const curriculumPlan = roadmapData?.curriculum_plan || {};
  const completedTopics = roadmapData?.completed_topics || [];
  const stages = curriculumPlan?.learning_stages || [];
  
  // Flatten all skills with defensive mapping and extensive optional chaining
  const allSkills = (stages || []).flatMap(stage => 
    (stage?.skills || []).map(skill => ({
      ...skill,
      stageNumber: stage?.stage || 0,
      stagePriority: stage?.focus_priority || ""
    }))
  );

  const { user, startSkill } = useRoadmap();
  const progressData = user?.progress_data ? (typeof user.progress_data === 'string' ? JSON.parse(user.progress_data) : user.progress_data) : { completed_modules: [] };
  const completedModules = progressData?.completed_modules || [];

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-[0.2em] mb-4">
            <Sparkles className="w-4 h-4" />
            Learning Catalog
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">My Study Modules</h1>
          <p className="text-slate-500 font-medium max-w-xl text-lg">Explore and master the skills tailored specifically for your career transition.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-right">
            <p className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">Total Modules</p>
            <p className="text-xl font-black text-slate-900">{allSkills?.length || 0}</p>
          </div>
          <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600"><BookOpen className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(allSkills || []).map((skill, index) => {
          const isCompleted = (completedModules || []).includes(skill?.skill);
          
          // Lock logic: first module (index 0) is always unlocked. 
          // Subsequent modules (index > 0) are unlocked only if the previous module is completed.
          const isPreviousCompleted = index === 0 || (completedModules || []).includes(allSkills[index - 1]?.skill);
          const isLocked = !isPreviousCompleted;
          
          return (
            <div 
              key={index} 
              className={`group bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 transition-all relative overflow-hidden flex flex-col h-full ${
                isLocked ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : 'hover:shadow-2xl hover:shadow-primary-100/30 hover:-translate-y-2'
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <span className={`px-4 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-widest border ${
                  skill?.stageNumber === 1 ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                  skill?.stageNumber === 2 ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  Phase {skill?.stageNumber || "?"}
                </span>
                {isCompleted ? (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle className="w-5 h-5" /><span className="text-[0.65rem] font-black uppercase tracking-widest">Mastered</span>
                  </div>
                ) : isLocked ? (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-[0.65rem] font-black uppercase tracking-widest">Locked</span>
                  </div>
                ) : null}
              </div>
              <div className="mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${isCompleted ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600 group-hover:bg-primary-50 group-hover:text-primary-600'}`}><BookOpen className="w-7 h-7" /></div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors mb-2 line-clamp-2">{skill?.skill || "Untitled Module"}</h3>
              </div>
              <div className="space-y-3 mb-8 flex-1">
                <p className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2">Core Focus</p>
                <div className="flex flex-wrap gap-2">
                  {(skill?.topics || []).slice(0, 3).map((topic, tIdx) => (
                    <span key={tIdx} className="px-3 py-1 bg-slate-50 text-slate-500 text-[0.7rem] font-bold rounded-lg border border-slate-100">{topic}</span>
                  ))}
                  {(skill?.topics?.length || 0) > 3 && <span className="text-[0.7rem] font-bold text-slate-400">+{skill.topics.length - 3} more</span>}
                </div>
              </div>
              <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold"><Clock className="w-4 h-4" />{skill?.estimated_weeks || 0} {skill?.estimated_weeks === 1 ? 'Week' : 'Weeks'}</div>
                <button 
                  onClick={() => {
                    if (isLocked) return;
                    if (skill?.skill) startSkill(skill.skill);
                    navigate(`/learning/${(skill?.skill || "module").toLowerCase().replace(/ /g, '-')}`, { state: { skill } });
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isLocked ? 'bg-slate-100 text-slate-400' :
                    isCompleted ? 'bg-green-50 text-green-600 hover:bg-green-100' : 
                    'bg-slate-900 text-white hover:bg-primary-600 shadow-lg shadow-slate-200 group-hover:shadow-primary-200'
                  }`}
                  disabled={isLocked}
                >
                  {isCompleted ? 'Review' : isLocked ? 'Locked' : 'Start Module'}<PlayCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Courses;
