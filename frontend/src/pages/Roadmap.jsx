import React from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { useRoadmap } from '../context/RoadmapContext';
import { 
  Clock, 
  Map as MapIcon, 
  ChevronRight, 
  Sparkles,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Circle
} from 'lucide-react';

const Roadmap = () => {
  const { roadmapData } = useRoadmap();

  if (!roadmapData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 max-w-md">
          <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MapIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No Roadmap Found</h2>
          <p className="text-slate-500 mb-8">
            It looks like you haven't generated a roadmap yet. Head back to the dashboard to start your journey.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { curriculum_plan, learner_profile, completed_topics = [] } = roadmapData;
  const stages = curriculum_plan?.learning_stages || [];

  // Calculate Progress Stats
  const allSkills = stages.flatMap(stage => stage.skills);
  const totalSkills = allSkills.length;
  const masteredSkillsCount = allSkills.filter(skill => completed_topics.includes(skill.skill)).length;
  const progressPercentage = totalSkills > 0 ? (masteredSkillsCount / totalSkills) * 100 : 0;

  // Calculate Time Remaining (sum duration of incomplete phases)
  const incompleteStages = stages.filter(stage => 
    stage.skills.some(skill => !completed_topics.includes(skill.skill))
  );
  
  const timeRemaining = incompleteStages.reduce((acc, stage) => {
    return acc + stage.skills.reduce((sAcc, s) => sAcc + s.estimated_weeks, 0);
  }, 0);

  // Next Milestone
  const nextMilestoneStage = incompleteStages[0];
  const nextMilestone = nextMilestoneStage 
    ? (nextMilestoneStage.focus_priority === 'high' ? 'Core Foundations' : nextMilestoneStage.focus_priority === 'medium' ? 'Advanced Specialization' : 'Career Polish & Mastery')
    : "Roadmap Completed";

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-primary-600 font-bold text-sm uppercase tracking-widest mb-4">
          <Sparkles className="w-5 h-5" />
          Personalized Curriculum
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
          My Learning Roadmap
        </h1>
        <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-slate-500 font-medium">
          <p className="flex items-center gap-2">
            Target: <span className="text-slate-900 font-bold">{learner_profile.target_role}</span>
          </p>
          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full hidden md:block" />
          <p className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" />
            Total Program: <span className="text-slate-900 font-bold">{curriculum_plan.total_estimated_duration_weeks} Weeks</span>
          </p>
        </div>
      </div>

      {/* Summary Overview Card */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 mb-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Progress Column */}
        <div className="space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Progress</p>
          <div className="flex items-end justify-between mb-1">
            <span className="text-3xl font-black text-slate-900">{masteredSkillsCount} / {totalSkills}</span>
            <span className="text-primary-600 font-bold text-xs uppercase tracking-tighter">Skills Mastered</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Time Remaining Column */}
        <div className="space-y-3 md:border-x md:border-slate-100 md:px-8">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Time Remaining</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">{timeRemaining}</div>
              <div className="text-slate-500 font-bold text-sm">Weeks to Go</div>
            </div>
          </div>
        </div>

        {/* Next Milestone Column */}
        <div className="space-y-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Next Milestone</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-slate-900 leading-tight">{nextMilestone}</div>
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Upcoming Goal</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Layout */}
      <div className="relative space-y-12 pb-12">
        {/* The Vertical Line */}
        <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-slate-200 hidden md:block" />

        {stages.map((stage, index) => {
          const isPhaseCompleted = stage.skills.every(skill => completed_topics.includes(skill.skill));
          const isCurrent = index === 0 && !isPhaseCompleted; // Simple logic for current phase

          return (
            <div key={index} className="relative flex flex-col md:flex-row gap-8 md:gap-16 items-start">
              
              {/* Phase Badge (The Left Indicator) */}
              <div className="flex-shrink-0 relative z-10 hidden md:flex">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl shadow-xl transition-all border-4 border-slate-50 ${
                  isPhaseCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent 
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100 animate-pulse' 
                      : 'bg-white text-slate-300 border-slate-100'
                }`}>
                  {isPhaseCompleted ? <CheckCircle className="w-8 h-8" /> : index + 1}
                </div>
              </div>

              {/* Mobile Phase Indicator */}
              <div className="md:hidden flex items-center gap-3">
                 <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                   isPhaseCompleted ? 'bg-green-500 text-white' : 'bg-primary-600 text-white'
                 }`}>
                   {isPhaseCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                 </span>
                 <span className="text-sm font-black text-primary-600 uppercase tracking-widest">Phase {index + 1}</span>
              </div>

              {/* Phase Card */}
              <div className="flex-1 bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-primary-200 transition-all hover:shadow-2xl hover:shadow-primary-100/20 group relative overflow-hidden">
                {/* Subtle Phase Label */}
                <div className="text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Phase {stage.stage} • {stage.focus_priority} Priority
                </div>

                {/* Status Badge */}
                <div className="absolute top-8 right-8">
                  <span className={`px-4 py-1.5 rounded-full text-[0.7rem] font-black uppercase tracking-wider shadow-sm border ${
                    isPhaseCompleted
                      ? 'bg-green-50 text-green-600 border-green-100'
                      : isCurrent 
                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {isPhaseCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Not Started'}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-primary-600 transition-colors">
                  {stage.focus_priority === 'high' ? 'Core Foundations' : stage.focus_priority === 'medium' ? 'Advanced Specialization' : 'Career Polish & Mastery'}
                </h3>

                <div className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-8">
                  <Clock className="w-4 h-4 text-primary-500" />
                  {stage.skills.reduce((acc, s) => acc + s.estimated_weeks, 0)} Weeks Estimated
                </div>

                {/* Topics Covered Section */}
                <div className="space-y-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Topics Covered</p>
                  <div className="flex flex-wrap gap-2">
                    {stage.skills.map((skill, skIdx) => {
                      const isSkillCompleted = completed_topics.includes(skill.skill);
                      return (
                        <div 
                          key={skIdx}
                          className={`px-4 py-2 border text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
                            isSkillCompleted 
                              ? 'bg-green-50 border-green-100 text-green-700' 
                              : 'bg-slate-50 border-slate-100 text-slate-700 group-hover:bg-primary-50 group-hover:border-primary-100 group-hover:text-primary-700'
                          }`}
                        >
                          {isSkillCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle className={`w-4 h-4 ${isCurrent ? 'text-primary-400' : 'text-slate-300'}`} />
                          )}
                          {skill.skill}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Start/Continue Button */}
                <div className="mt-8 flex justify-end">
                  <Link 
                    to="/courses"
                    state={{ stage, roadmap: roadmapData }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                      isCurrent || isPhaseCompleted
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 hover:bg-primary-700' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    {isPhaseCompleted ? 'Review Phase' : isCurrent ? 'Continue Learning' : 'Locked'}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Decorative background element */}
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-3xl" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Encouragement Footer */}
      <div className="mt-12 bg-slate-900 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-2xl font-bold mb-2">Ready to transform your career?</h4>
          <p className="text-slate-400 max-w-sm">Complete your foundations to unlock the next level of specialized training.</p>
        </div>
        <div className="bg-primary-600 p-5 rounded-3xl relative z-10 shadow-2xl shadow-primary-500/20">
          <Sparkles className="w-10 h-10" />
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
      </div>
    </div>
  );
};

export default Roadmap;
