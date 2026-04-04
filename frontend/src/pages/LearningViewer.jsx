import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Zap, 
  X, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Circle
} from 'lucide-react';
import { useRoadmap } from '../context/RoadmapContext';
import { tutorApi } from '../api/client';

const LearningViewer = () => {
  const { skillId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { roadmapData, user } = useRoadmap();
  
  // Extract skill and topics
  const skill = roadmapData?.curriculum_plan?.learning_stages
    ?.flatMap(stage => stage.skills.map(s => ({ ...s, stageNumber: stage.stage })))
    ?.find(s => s.skill.toLowerCase().replace(/ /g, '-') === skillId) || location.state?.skill;

  const topics = skill?.topics || ["Introduction", "Core Principles", "Advanced Techniques"];
  const skillName = skill?.skill || "Module";

  // 2. State Initialization (Resume functionality)
  const initialIndex = useMemo(() => {
    if (user?.progress_data?.bookmarks && user.progress_data.bookmarks[skillName]) {
      return user.progress_data.bookmarks[skillName];
    }
    return 0;
  }, [user, skillName]);

  // 1. State Management
  const [currentTopicIndex, setCurrentTopicIndex] = useState(initialIndex);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [fullContent, setFullContent] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI Tutor. Ask me anything about this topic." }
  ]);
  const [inputText, setInputText] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  // 2. Proactive Error Prevention (Routing Crash Fix)
  if (skill === undefined || skill === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md text-center">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Session Expired</h2>
          <p className="text-slate-500 font-medium mb-8">Please return to the Catalog to select a course.</p>
          <Link to="/courses" className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
            <ArrowLeft className="w-5 h-5" />
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const currentTopic = topics[currentTopicIndex];

  // Data Preparation (100 Lines Per Page)
  const slides = useMemo(() => {
    if (fullContent === null || fullContent === undefined || fullContent === "") return [];
    const lines = fullContent.split("\n");
    const chunks = [];
    for (let i = 0; i < lines.length; i += 100) {
      chunks.push(lines.slice(i, i + 100).join("\n"));
    }
    return chunks;
  }, [fullContent]);

  useEffect(() => {
    if (!skill && roadmapData) {
      navigate('/courses', { replace: true });
    }
  }, [skill, navigate, roadmapData]);

  // Fetch Logic
  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setFullContent(null);
      setDisplayedText('');
      setCurrentSlideIndex(0); // Reset slide on topic change

      try {
        const response = await tutorApi.generateLesson(skillName, currentTopic);
        setFullContent(response.content);
        setIsLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        const errorMsg = "The AI Teacher is taking a short break. Please click Previous and then Next to try again.";
        setFullContent(errorMsg);
        setDisplayedText(errorMsg);
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [currentTopicIndex, skillId]);

  // 1. The Ultimate Strict Mode Fix: Recursive setTimeout with cancellation flag
  useEffect(() => {
    if (slides.length === 0) return;
    
    let isCancelled = false;
    setDisplayedText("");
    const textToStream = slides[currentSlideIndex];
    let index = 0;
    
    const typeNextChar = () => {
      if (isCancelled) return;
      
      if (index < textToStream.length) {
        setDisplayedText(textToStream.substring(0, index + 1));
        index++;
        setTimeout(typeNextChar, 5);
      }
    };

    typeNextChar();

    return () => {
      isCancelled = true;
    };
  }, [slides, currentSlideIndex]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isChatLoading) return;

    const userMsg = inputText.trim();
    setInputText('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      const response = await tutorApi.contextualChat(userMsg, `${skillName}: ${currentTopic}`, chatMessages);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 3. State Syncing (Saving progress)
  const handleNextTopic = () => {
    const nextIndex = currentTopicIndex + 1;
    // Silent background sync
    tutorApi.syncTopicProgress(skillName, nextIndex).catch(console.error);
    
    setCurrentTopicIndex(nextIndex);
    setCurrentSlideIndex(0);
  };

  const handleTakeAssessment = () => {
    navigate('/assessment', { state: { skill, topics } });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative font-sans text-slate-900">
      
      {/* 3. Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/courses" className="flex items-center gap-2 text-slate-400 hover:text-primary-600 transition-all font-bold text-sm">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Catalog</span>
          </Link>
          <div className="h-6 w-px bg-slate-100" />
          <h1 className="text-sm font-black tracking-tight text-slate-400 uppercase">{currentTopic}</h1>
        </div>
        
        <button 
          onClick={handleTakeAssessment}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-black text-sm rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-95 flex items-center gap-2"
        >
          Take Assessment
          <ChevronRight className="w-4 h-4" />
        </button>
      </header>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-3xl mx-auto py-20 px-6">
          <div className="animate-in fade-in duration-1000">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[0.65rem] font-black text-primary-600 uppercase tracking-[0.2em] bg-primary-50 px-3 py-1 rounded-lg">
                Topic {currentTopicIndex + 1} of {topics.length}
              </span>
              {slides.length > 1 && (
                <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">
                  Page {currentSlideIndex + 1} of {slides.length}
                </span>
              )}
            </div>
            
            <h2 className="text-5xl font-black mb-12 tracking-tighter leading-tight">
              {currentTopic}
            </h2>

            {isLoading ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary-600 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-black text-slate-900 tracking-tight">AI Teacher is preparing your lesson...</p>
                  <p className="text-slate-400 font-medium text-sm">Orchestrating domain knowledge and professional insights.</p>
                </div>
              </div>
            ) : (
              <div className="prose prose-slate prose-xl max-w-none text-slate-700 leading-relaxed font-medium min-h-[400px]">
                <ReactMarkdown>{displayedText}</ReactMarkdown>
                {slides.length > 0 && displayedText.length < slides[currentSlideIndex].length && (
                  <span className="inline-block w-2 h-6 bg-primary-500 ml-1 animate-pulse align-middle" />
                )}
              </div>
            )}

            {/* Pagination UI and Navigation Logic */}
            <div className="mt-24 pt-10 border-t border-slate-100 flex items-center justify-between">
              {currentSlideIndex > 0 ? (
                <button 
                  onClick={() => setCurrentSlideIndex(prev => prev - 1)}
                  className="flex items-center gap-3 text-slate-400 hover:text-slate-900 font-black transition-all group"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /> 
                  Previous Page
                </button>
              ) : currentTopicIndex > 0 ? (
                <button 
                  onClick={() => setCurrentTopicIndex(prev => prev - 1)}
                  className="flex items-center gap-3 text-slate-400 hover:text-slate-900 font-black transition-all group"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /> 
                  Previous Topic
                </button>
              ) : <div />}

              {currentSlideIndex < slides.length - 1 ? (
                <button 
                  onClick={() => setCurrentSlideIndex(prev => prev + 1)}
                  disabled={isLoading || (slides.length > 0 && displayedText.length < slides[currentSlideIndex].length)}
                  className="flex items-center gap-3 text-primary-600 hover:text-primary-700 font-black transition-all disabled:opacity-30 group"
                >
                  Next Page 
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : currentTopicIndex < topics.length - 1 ? (
                <button 
                  onClick={handleNextTopic}
                  disabled={isLoading || (slides.length > 0 && displayedText.length < slides[currentSlideIndex].length)}
                  className="flex items-center gap-3 text-primary-600 hover:text-primary-700 font-black transition-all disabled:opacity-30 group"
                >
                  Next Topic 
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={handleTakeAssessment}
                  disabled={isLoading || (slides.length > 0 && displayedText.length < slides[currentSlideIndex].length)}
                  className="px-10 py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center gap-3 group disabled:opacity-50"
                >
                  Complete Module & Take Assessment
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Floating Bottom-Left AI Chatbot */}
      <div className="fixed bottom-8 left-8 z-50">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="group flex items-center gap-4 px-8 py-5 bg-white text-primary-600 font-black rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-slate-50 hover:-translate-y-1 transition-all active:scale-95"
          >
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-200 group-hover:rotate-12 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span>Ask me if any doubts</span>
          </button>
        ) : (
          <div className="w-[400px] h-[550px] bg-white rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.2)] flex flex-col border border-slate-100 animate-in slide-in-from-bottom-10 duration-300 overflow-hidden">
            {/* Chat Header */}
            <div className="px-8 py-6 bg-[#1e1b4b] text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-900/20">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-base leading-none mb-1">AI Tutor</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[0.7rem] font-bold text-primary-300 uppercase tracking-widest">Active Support</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-sm ${msg.role === 'user' ? 'bg-slate-900' : 'bg-primary-600'}`}>
                    {msg.role === 'user' ? <Circle className="w-5 h-5 fill-white" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <div className={`max-w-[85%] p-5 rounded-3xl shadow-sm border text-sm font-bold leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' 
                      : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-600 flex-shrink-0 flex items-center justify-center text-white animate-pulse">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="bg-white p-5 rounded-3xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Footer */}
            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100">
              <div className="relative">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isChatLoading}
                  placeholder="Ask a question..." 
                  className="w-full pl-6 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-sm font-bold" 
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim() || isChatLoading}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningViewer;
