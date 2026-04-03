import React, { useState } from 'react';
import { 
  Briefcase, 
  FileText, 
  Plus, 
  X, 
  ArrowRight, 
  Sparkles,
  Zap,
  ShieldCheck,
  BarChart3,
  Loader2,
  ChevronRight
} from 'lucide-react';

const OnboardingForm = ({ onSubmit, loading }) => {
  const [activeTab, setActiveTab] = useState('role');
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [currentSkill, setCurrentSkill] = useState('');
  const [skills, setSkills] = useState([]);

  const quickPicks = [
    'Full Stack Developer',
    'Data Scientist',
    'ML Engineer',
    'Cloud Architect',
    'DevOps Engineer',
    'Product Manager'
  ];

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && currentSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(currentSkill.trim())) {
        setSkills([...skills, currentSkill.trim()]);
      }
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      current_role: currentRole,
      experience_years: experienceLevel === 'Beginner' ? 0.5 : experienceLevel === 'Intermediate' ? 3 : 7,
      target_role: targetRole,
      learning_goal: `Master ${targetRole} with focus on ${skills.join(', ')}`
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/30">
        <button
          onClick={() => setActiveTab('role')}
          className={`py-6 text-sm font-black flex items-center justify-center gap-3 transition-all ${
            activeTab === 'role' 
              ? 'bg-white text-primary-600 border-b-2 border-primary-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          Enter Job Role
        </button>
        <button
          onClick={() => setActiveTab('jd')}
          className={`py-6 text-sm font-black flex items-center justify-center gap-3 transition-all ${
            activeTab === 'jd' 
              ? 'bg-white text-primary-600 border-b-2 border-primary-600' 
              : 'text-slate-400 hover:text-slate-600 cursor-not-allowed opacity-50'
          }`}
        >
          <FileText className="w-5 h-5" />
          Paste Job Description
        </button>
      </div>

      <div className="p-8 md:p-12">
        <div className="mb-10 text-center md:text-left">
           <h3 className="text-2xl font-black text-slate-900 mb-2">Build your curriculum</h3>
           <p className="text-slate-500 font-medium text-sm">Fill in your professional details to generate a customized AI roadmap.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Current Position</label>
              <input
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="e.g. Student or Junior Dev"
                className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-600 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300"
                required
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Target Role</label>
              <div className="relative">
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Data Scientist"
                  className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-600 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  required
                />
                <Sparkles className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Quick Picks */}
          <div className="flex flex-wrap gap-2.5">
            {quickPicks.map(pick => (
              <button
                key={pick}
                type="button"
                onClick={() => setTargetRole(pick)}
                className={`px-5 py-2.5 border text-[0.65rem] font-black uppercase tracking-wider rounded-xl transition-all ${
                  targetRole === pick 
                  ? 'bg-[#1e1b4b] border-[#1e1b4b] text-white shadow-lg' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-primary-400 hover:text-primary-600'
                }`}
              >
                {pick}
              </button>
            ))}
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Level</label>
              <div className="relative">
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-600 focus:bg-white transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Skill Arsenal</label>
              <div className="relative">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="Type and press Enter"
                  className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-600 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300"
                />
                <Plus className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Skills Tags */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2.5 p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
              {skills.map(skill => (
                <span key={skill} className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl shadow-sm">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="text-slate-400 hover:text-rose-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed text-lg group active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Orchestrating AI Agents...
                </>
              ) : (
                <>
                  Generate My Roadmap
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Trust Badges */}
      <div className="bg-slate-50/50 p-8 border-t border-slate-100 flex flex-wrap justify-center gap-10">
          <div className="flex items-center gap-3 text-slate-400">
             <Zap className="w-5 h-5" />
             <span className="text-[0.65rem] font-black uppercase tracking-widest">5 Specialized Agents</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
             <ShieldCheck className="w-5 h-5" />
             <span className="text-[0.65rem] font-black uppercase tracking-widest">Instant Analysis</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
             <BarChart3 className="w-5 h-5" />
             <span className="text-[0.65rem] font-black uppercase tracking-widest">Custom Roadmap</span>
          </div>
      </div>
    </div>
  );
};

export default OnboardingForm;
