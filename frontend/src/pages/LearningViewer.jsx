import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Zap, 
  BookOpen, 
  CheckCircle,
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Circle,
  HelpCircle
} from 'lucide-react';
import { useRoadmap } from '../context/RoadmapContext';
import { tutorApi } from '../api/client';

const LearningViewer = () => {
  const { skillId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { roadmapData, updateRoadmap } = useRoadmap();
  
  // Topic Pagination State
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI Tutor. Feel free to ask me any questions about this module as you read through it." }
  ]);
  const [inputText, setInputText] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState(null);
  
  const chatEndRef = useRef(null);
  const streamingRef = useRef(null);

  // Find the current skill from roadmapData
  const skill = roadmapData?.curriculum_plan?.learning_stages
    ?.flatMap(stage => stage.skills.map(s => ({ ...s, stageNumber: stage.stage })))
    ?.find(s => s.skill.toLowerCase().replace(/ /g, '-') === skillId) || location.state?.skill;

  const topics = skill?.topics || ["Introduction to the Module", "Core Concepts", "Advanced Implementation"];
  const currentTopic = topics[currentTopicIndex];
  const skillName = skill?.skill || "Untitled Module";

  // Topic-specific dummy content
  const generateContent = (topic) => {
    return `Let's dive into ${topic}. This segment is critical for mastering ${skillName}. 

In professional engineering, understanding ${topic} allows for more scalable and maintainable architectures. We will look at how this integrates with industry standards and your specific career goal as a ${roadmapData?.learner_profile?.target_role || 'specialist'}.

Key takeaways for ${topic}:
1. Theoretical foundations and mental models.
2. Real-world application patterns.
3. Common pitfalls and how to avoid them.
4. Optimization strategies for enterprise scale.

By mastering this topic, you are one step closer to full competency in ${skillName}. Take your time to digest the concepts, and use the AI Tutor if any part of this explanation remains unclear.`;
  };

  useEffect(() => {
    if (!skill && roadmapData) {
      navigate('/courses', { replace: true });
    }
  }, [skill, navigate, roadmapData]);

  // Streaming Effect - Resets on topic change
  useEffect(() => {
    if (!skill || showQuiz) return;
    
    setDisplayedText('');
    setIsStreaming(true);
    
    const content = generateContent(currentTopic);
    const words = content.split(' ');
    let i = 0;
    
    if (streamingRef.current) clearInterval(streamingRef.current);
    
    streamingRef.current = setInterval(() => {
      if (i < words.length) {
        setDisplayedText((prev) => prev + (prev ? ' ' : '') + words[i]);
        i++;
      } else {
        clearInterval(streamingRef.current);
        setIsStreaming(false);
      }
    }, 30);

    return () => clearInterval(streamingRef.current);
  }, [currentTopicIndex, skill, showQuiz]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  if (!skill) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
    </div>
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isChatLoading) return;

    const userMsg = inputText.trim();
    setInputText('');
    
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      // Wire to backend /api/chat endpoint
      const response = await tutorApi.contextualChat(userMsg, `${skillName} - ${currentTopic}`, chatMessages);
      
      // Sync UI messages
      setChatMessages(prev => [
        ...prev, 
        { role: 'assistant', content: response.reply }
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleTakeAssessment = async () => {
    setIsQuizLoading(true);
    setShowQuiz(true);
    setQuizFeedback(null);
    setSelectedAnswer('');
    
    try {
      const updatedState = await tutorApi.generateQuiz(roadmapData);
      updateRoadmap(updatedState);
      setQuizData(updatedState.active_quiz);
    } catch (err) {
      console.error('Quiz generation error:', err);
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || isQuizLoading) return;
    
    setIsQuizLoading(true);
    try {
      const result = await tutorApi.submitAnswer(roadmapData, selectedAnswer);
      updateRoadmap(result.state);
      setQuizFeedback({
        isCorrect: result.is_correct,
        message: result.state.chat_history[result.state.chat_history.length - 1].content
      });
    } catch (err) {
      console.error('Submit answer error:', err);
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleNextTopic = async () => {
    setIsQuizLoading(true);
    try {
      const updatedState = await tutorApi.nextTopic(roadmapData);
      updateRoadmap(updatedState);
      setShowQuiz(false);
      setQuizData(null);
      setQuizFeedback(null);
      // If we finished the module via assessment, we might want to navigate back
      navigate('/courses');
    } catch (err) {
      console.error('Next topic error:', err);
    } finally {
      setIsQuizLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative font-sans">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/courses" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-bold text-sm group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Catalog</span>
          </Link>
          <div className="h-6 w-px bg-slate-100" />
          <h1 className="text-sm font-black text-slate-900 tracking-tight">{skillName}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Fast-Track</span>
            <span className="text-[0.6rem] font-bold text-primary-600">Already know this? Skip to the test.</span>
          </div>
          <button 
            onClick={handleTakeAssessment}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-black text-sm rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-95 flex items-center gap-2"
          >
            Take Assessment
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-20 px-6">
          {!showQuiz ? (
            <div className="animate-in fade-in duration-1000">
              <div className="flex items-center gap-3 mb-8">
                <div className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-[0.65rem] font-black uppercase tracking-widest border border-primary-100">
                  Topic {currentTopicIndex + 1} of {topics.length}
                </div>
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{skillName}</span>
              </div>
              
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-12 tracking-tighter leading-tight">
                {currentTopic}
              </h2>

              <div className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed font-medium min-h-[400px]">
                <div className="whitespace-pre-wrap">
                  {displayedText}
                  {isStreaming && <span className="inline-block w-1.5 h-5 bg-primary-500 ml-1 animate-pulse align-middle" />}
                </div>
              </div>

              {/* Topic Navigation */}
              <div className="mt-20 pt-10 border-t border-slate-100 flex items-center justify-between">
                {currentTopicIndex > 0 ? (
                  <button 
                    onClick={() => setCurrentTopicIndex(prev => prev - 1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" /> Previous Topic
                  </button>
                ) : <div />}

                {currentTopicIndex < topics.length - 1 ? (
                  <button 
                    onClick={() => setCurrentTopicIndex(prev => prev + 1)}
                    disabled={isStreaming}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-black transition-all disabled:opacity-50"
                  >
                    Next Topic <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={handleTakeAssessment}
                    disabled={isStreaming}
                    className="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center gap-3 disabled:opacity-50 group"
                  >
                    Complete & Take Assessment
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
               <button onClick={() => setShowQuiz(false)} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm mb-12 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Lessons
                </button>
                
                {isQuizLoading && !quizData ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                    <p className="text-slate-500 font-bold">Generating your assessment...</p>
                  </div>
                ) : quizData ? (
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <div className="bg-[#1e1b4b] p-10 text-white">
                      <div className="flex items-center gap-2 text-primary-400 text-[0.65rem] font-black uppercase tracking-[0.2em] mb-4">
                        <Sparkles className="w-4 h-4" /> Knowledge Check
                      </div>
                      <h3 className="text-2xl font-bold leading-tight">{quizData.question}</h3>
                    </div>
                    
                    <div className="p-10 space-y-4">
                      {Object.entries(quizData.options).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => !quizFeedback && setSelectedAnswer(key)}
                          disabled={!!quizFeedback}
                          className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-5 ${
                            selectedAnswer === key 
                              ? 'border-primary-600 bg-primary-50' 
                              : 'border-slate-50 hover:border-primary-200 bg-slate-50/50 hover:bg-white'
                          } ${
                            quizFeedback && key === quizData.correct_option ? 'border-green-500 bg-green-50' : ''
                          } ${
                            quizFeedback && selectedAnswer === key && !quizFeedback.isCorrect ? 'border-rose-500 bg-rose-50' : ''
                          }`}
                        >
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${
                            selectedAnswer === key ? 'bg-primary-600 text-white' : 'bg-white text-slate-400 border border-slate-100'
                          }`}>
                            {key.toUpperCase()}
                          </span>
                          <span className="font-bold text-slate-700">{value}</span>
                          {quizFeedback && key === quizData.correct_option && <CheckCircle className="ml-auto w-6 h-6 text-green-500" />}
                        </button>
                      ))}
                    </div>

                    {quizFeedback && (
                      <div className={`mx-10 mb-10 p-8 rounded-3xl flex items-start gap-5 ${quizFeedback.isCorrect ? 'bg-green-50 border border-green-100' : 'bg-rose-50 border border-rose-100'}`}>
                        {quizFeedback.isCorrect ? (
                          <div className="bg-green-500 text-white p-1.5 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
                        ) : (
                          <div className="bg-rose-500 text-white p-1.5 rounded-lg"><AlertCircle className="w-5 h-5" /></div>
                        )}
                        <div>
                          <p className={`font-black uppercase text-[0.65rem] tracking-widest mb-1 ${quizFeedback.isCorrect ? 'text-green-600' : 'text-rose-600'}`}>
                            {quizFeedback.isCorrect ? 'Excellence Achieved' : 'Learning Opportunity'}
                          </p>
                          <p className="text-slate-700 font-medium leading-relaxed">{quizFeedback.message}</p>
                        </div>
                      </div>
                    )}

                    <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                      {!quizFeedback ? (
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={!selectedAnswer || isQuizLoading}
                          className="px-12 py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl shadow-primary-200"
                        >
                          {isQuizLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Submit Verification'}
                        </button>
                      ) : (
                        <button
                          onClick={quizFeedback.isCorrect ? handleNextTopic : () => { setQuizFeedback(null); setSelectedAnswer(''); }}
                          className={`px-12 py-5 font-black rounded-2xl transition-all flex items-center gap-3 shadow-xl ${
                            quizFeedback.isCorrect 
                              ? 'bg-slate-900 text-white hover:bg-primary-600 shadow-slate-200' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {quizFeedback.isCorrect ? 'Next Concept' : 'Try Again'} <ChevronRight className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom-Left AI Chatbot */}
      <div className="fixed bottom-6 left-6 z-50 font-sans">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="group flex items-center gap-3 px-6 py-4 bg-white text-primary-600 font-black rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 hover:-translate-y-1 transition-all active:scale-95"
          >
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-200 group-hover:rotate-12 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span>Ask me if any doubts</span>
          </button>
        ) : (
          <div className="w-[380px] h-[520px] bg-white rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.15)] flex flex-col border border-slate-100 animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-5 bg-[#1e1b4b] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm">AI Tutor</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-[0.6rem] font-bold text-primary-200 uppercase tracking-widest">Always Active</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white shadow-sm ${msg.role === 'user' ? 'bg-slate-900' : 'bg-primary-600'}`}>
                    {msg.role === 'user' ? <Circle className="w-4 h-4 fill-white" /> : <Zap className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm border text-sm font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' 
                      : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-600 flex-shrink-0 flex items-center justify-center text-white animate-pulse">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Footer */}
            <form onSubmit={handleSendMessage} className="p-5 bg-white border-t border-slate-100">
              <div className="relative">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isChatLoading}
                  placeholder="Ask a question..." 
                  className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-sm font-bold placeholder:text-slate-300" 
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim() || isChatLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-4 h-4" />
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
