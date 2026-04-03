import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useRoadmap } from '../context/RoadmapContext';
import { authApi } from '../api/client';
import { LogIn, UserPlus, Loader2, Sparkles, User, Lock } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useRoadmap();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await authApi.signup(username, password);
        const autoLogin = await login(username, password);
      }
    } catch (err) {
      console.error('Auth error:', err);
      const message = err.response?.data?.detail;
      setError(typeof message === 'string' ? message : 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Branding */}
        <div className="hidden md:flex md:w-1/2 bg-[#1e1b4b] p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <Sparkles className="w-8 h-8 text-primary-400" />
              <span className="text-2xl font-black tracking-tighter">SkillForge AI</span>
            </div>
            <h2 className="text-4xl font-black leading-tight mb-6">
              Empower Your <br />
              <span className="text-primary-400">Career Evolution.</span>
            </h2>
            <p className="text-primary-100/80 text-lg font-medium">
              Unlock personalized learning paths powered by autonomous agents and real-world skill ontologies.
            </p>
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="bg-primary-600 p-2.5 rounded-xl shadow-lg shadow-primary-900/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold tracking-tight">AI-Driven Skill Gap Analysis</p>
            </div>
          </div>

          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-900/20 rounded-full blur-3xl -ml-32 -mb-32" />
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Join SkillForge'}
            </h3>
            <p className="text-slate-500 font-medium">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Create an account to start your journey.'}
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl mb-8 text-sm font-bold bg-rose-50 text-rose-600 border border-rose-100 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  type="text"
                  required
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-300"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password"
                  required
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-200 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" /> Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-slate-400 text-sm font-bold hover:text-primary-600 transition-colors"
            >
              {isLogin ? (
                <>Don't have an account? <span className="text-primary-600 ml-1">Sign up for free</span></>
              ) : (
                <>Already have an account? <span className="text-primary-600 ml-1">Sign in here</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
