import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  BookOpen,
  Trophy,
  XCircle,
  Code,
  MessageSquare,
  X
} from 'lucide-react';
import client, { tutorApi } from '../api/client';

const Assessment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const hasState = (location.state === null || location.state === undefined) === false;
  const hasSkill = (hasState && location.state.skill) ? true : false;

  if (hasSkill === false) {
    return <Navigate to="/" replace />;
  }

  const { skill, topics } = location.state;
  const moduleName = skill.skill || "Module";
  const moduleId = skill.id || moduleName.replace(/\s+/g, '_').toLowerCase();
  const storageKey = "saved_assessment_" + moduleId;

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isFetchingBatch2, setIsFetchingBatch2] = useState(false);
  const [userFeedback, setUserFeedback] = useState("");
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  const fetchBatch = async (batchNumber) => {
    if (batchNumber === 2) setIsFetchingBatch2(true);
    else setIsGenerating(true);
    
    setError(null);
    try {
      console.log("Sending payload:", { skill_name: skill.skill, topics: topics, batch_number: batchNumber });
      
      const response = await client.post('/api/generate-assessment', {
        skill_name: skill.skill || "Unknown",
        topics: topics || [],
        batch_number: Number(batchNumber) || 1
      });
      
      const data = response.data;
      
      if (Array.isArray(data) === false) {
        throw new Error("Invalid assessment format received from server");
      }
      
      if (batchNumber === 1) {
        setQuestions(data);
      } else {
        setQuestions(prev => [...prev, ...data]);
      }
      setError(null);
    } catch (err) {
      setError("Failed to generate assessment batch. Please try again.");
    } finally {
      setIsGenerating(false);
      setIsFetchingBatch2(false);
    }
  };

  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setQuestions(parsed.questions || []);
        setUserAnswers(parsed.userAnswers || {});
        setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
        setIsGenerating(false);
        return;
      } catch (e) {
        console.error("Failed to parse saved assessment data", e);
      }
    }
    fetchBatch(1);
  }, []);

  useEffect(() => {
    const canSave = (questions.length > 0 && result === null && !isReviewMode);
    if (canSave) {
      const dataToSave = {
        questions,
        userAnswers,
        currentQuestionIndex
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [questions, userAnswers, currentQuestionIndex, result, isReviewMode]);

  const handleAnswerChange = (answer) => {
    if (isReviewMode) return;
    
    const currentQ = questions[currentQuestionIndex];
    if (currentQ.type === 'multiple_choice') {
      const currentAnswers = userAnswers[currentQuestionIndex] || [];
      const alreadyIncluded = currentAnswers.includes(answer);
      const newAnswers = alreadyIncluded 
        ? currentAnswers.filter(a => a !== answer)
        : [...currentAnswers, answer];
      setUserAnswers({ ...userAnswers, [currentQuestionIndex]: newAnswers });
    } else {
      setUserAnswers({ ...userAnswers, [currentQuestionIndex]: answer });
    }
  };

  const handleNext = () => {
    const isEndOfFirstBatch = (currentQuestionIndex === questions.length - 1 && questions.length < 16);
    if (isEndOfFirstBatch && questions.length < 16) {
       if (questions.length > 0 && questions.length < 10) { 
           fetchBatch(2);
       }
    }
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const userAnswer = String(userAnswers[idx] || "").trim();
      const correctAnswer = String(q.correct_answer || "").trim();

      if (q.type === 'multiple_choice') {
        const correctAnswers = q.correct_answer.split(',').map(s => s.trim());
        const userAnswersList = Array.isArray(userAnswers[idx]) ? userAnswers[idx] : [];
        const hasCorrectLength = (correctAnswers.length === userAnswersList.length);
        const allCorrect = hasCorrectLength && correctAnswers.every(val => userAnswersList.includes(val));
        if (allCorrect) correctCount++;
      } else {
        if (userAnswer === correctAnswer) correctCount++;
      }
    });
    return Math.round((correctCount / (questions.length || 1)) * 100);
  };

  const handleFinishAssessment = () => {
    const score = calculateScore();
    setResult({
        score,
        passed: score >= 70
    });
    setIsReviewMode(true);
    setShowCanvas(true);
  };

  const handleProceed = async () => {
    setIsSubmitting(true);
    try {
        const payload = {
            skill_name: moduleName,
            topics: topics,
            score: result.score,
            feedback: userFeedback
        };
        await client.post('/api/assessment/submit', payload);
        localStorage.removeItem(storageKey);
        navigate('/');
    } catch (err) {
        console.error("Submission failed", err);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isGenerating && error === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
          <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-slate-900" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Preparing your assessment...</h2>
        <p className="text-slate-400 font-medium text-center">Analyzing your progress to create a tailored experience.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="bg-rose-50 p-10 rounded-[2.5rem] border border-rose-100 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-rose-900 mb-4">Generation Error</h2>
          <p className="text-rose-700 font-medium mb-8">{error}</p>
          <button 
            onClick={() => fetchBatch(1)}
            className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-white flex flex-col relative font-sans text-slate-900 overflow-x-hidden">
      {/* Review Canvas */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out ${showCanvas ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 space-y-12">
          <div className="flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md py-4 z-10 border-b border-slate-100 mb-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary-500" /> Detailed Performance Analysis
            </h3>
            <button 
              onClick={() => setShowCanvas(false)}
              className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-slate-900"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-8">
            {questions.map((q, idx) => {
              const userAnswer = userAnswers[idx];
              const isCorrect = q.type === 'multiple_choice' 
                ? (Array.isArray(userAnswer) && q.correct_answer.split(',').map(s => s.trim()).length === userAnswer.length && q.correct_answer.split(',').map(s => s.trim()).every(val => userAnswer.includes(val)))
                : (String(userAnswer || "").trim() === String(q.correct_answer || "").trim());

              return (
                <div key={idx} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-white text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-black flex-shrink-0 mt-1 shadow-sm border border-slate-100">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-slate-900 mb-4">{q.question}</h4>
                      {q.code_snippet && (
                        <div style={{ 
                          display: 'block', 
                          visibility: 'visible', 
                          background: '#1e293b', 
                          color: '#4ade80', 
                          padding: '20px', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          margin: '10px 0',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          borderRadius: '1rem'
                        }}>
                          <pre>{q.code_snippet}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-2xl border ${isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                      <span className={`text-[0.65rem] font-black uppercase tracking-widest block mb-2 ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>Your Choice</span>
                      <p className={`font-bold ${isCorrect ? 'text-emerald-900' : 'text-rose-900'}`}>{Array.isArray(userAnswer) ? userAnswer.join(', ') : (userAnswer || "No answer provided")}</p>
                    </div>
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="text-[0.65rem] font-black text-emerald-400 uppercase tracking-widest block mb-2">Correct Answer</span>
                      <p className="font-bold text-emerald-900">{q.correct_answer}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-200/60">
                    {q.wrong_explanation && !isCorrect && (
                      <div className="p-6 bg-rose-100/50 text-rose-900 rounded-2xl border border-rose-100/50">
                        <div className="flex items-center gap-2 mb-2 font-black text-xs uppercase tracking-widest opacity-60">
                          <XCircle className="w-4 h-4" /> Why this was incorrect
                        </div>
                        <p className="font-medium text-sm leading-relaxed">{q.wrong_explanation}</p>
                      </div>
                    )}
                    {q.correct_explanation && (
                      <div className="p-6 bg-emerald-100/50 text-emerald-900 rounded-2xl border border-emerald-100/50">
                        <div className="flex items-center gap-2 mb-2 font-black text-xs uppercase tracking-widest opacity-60">
                          <CheckCircle className="w-4 h-4" /> Professional Insight
                        </div>
                        <p className="font-medium text-sm leading-relaxed">{q.correct_explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {result && (
            <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-8">
              <div>
                <h4 className="text-xl font-black mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-400" />
                  How was this module (Optional)
                </h4>
                <p className="text-slate-400 text-sm font-medium">Your feedback helps the AI adapt the teaching style for your next module.</p>
              </div>
              <textarea 
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                placeholder="Share your thoughts on pacing, clarity, or complexity..."
                className="w-full p-6 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/20 transition-all outline-none min-h-[150px] text-white font-medium"
              />
              
              <button 
                onClick={handleProceed}
                disabled={isSubmitting}
                className={`w-full py-5 font-black rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] disabled:opacity-50 ${result.passed ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-700 text-slate-300'}`}
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                {result.passed ? "Proceed to Next Module" : "Return to Dashboard"}
              </button>
            </div>
          )}
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-bold text-sm group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Leave Assessment</span>
          </button>
          <div className="h-6 w-px bg-slate-100" />
          <h1 className="text-sm font-black text-slate-400 uppercase tracking-widest">{moduleName} Certification</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">Progress</span>
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-900 transition-all duration-500" 
              style={{ width: (currentQuestionIndex + 1) / (questions.length || 1) * 100 + "%" }}
            />
          </div>
          <span className="text-xs font-black text-slate-900">{currentQuestionIndex + 1}/{questions.length}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-3xl mx-auto py-20 px-6">
          {isReviewMode && result ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
              <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100">
                <div className={result.passed ? "p-12 text-center bg-emerald-600 text-white" : "p-12 text-center bg-rose-600 text-white"}>
                  {result.passed ? (
                    <Trophy className="w-20 h-20 mx-auto mb-6 text-emerald-300" />
                  ) : (
                    <XCircle className="w-20 h-20 mx-auto mb-6 text-white" />
                  )}
                  <h2 className="text-4xl font-black mb-2">{result.passed ? "Module Mastered" : "Requires Retake"}</h2>
                  <p className="text-white/70 font-medium text-lg">Final Proficiency Score</p>
                  <div className="mt-8 text-7xl font-black">{result.score}%</div>
                </div>
                
                <div className="p-12 text-center space-y-6">
                  <p className="text-slate-500 font-medium text-lg leading-relaxed">
                    {result.passed 
                      ? "Congratulations. You have demonstrated a solid understanding of these concepts." 
                      : "A minimum of 70 percent is required to unlock the next module. Please review the material and try again."}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => setShowCanvas(true)}
                      className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-105"
                    >
                      <BookOpen className="w-5 h-5 text-primary-400" />
                      Show Review Analysis
                    </button>
                    {!result.passed && (
                      <button 
                        onClick={() => navigate('/learning/' + moduleId)}
                        className="px-10 py-4 bg-slate-100 text-slate-900 font-black rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-105"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Return to Module
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-[0.65rem] font-black text-white uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-lg">
                  Question {currentQuestionIndex + 1}
                </span>
                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">
                  {currentQ?.type?.replace('_', ' ')}
                </span>
              </div>

              {isFetchingBatch2 ? (
                <div className="py-20 text-center space-y-6">
                  <Loader2 className="w-12 h-12 text-slate-900 animate-spin mx-auto" />
                  <h2 className="text-2xl font-black text-slate-900">Fetching Batch 2</h2>
                  <p className="text-slate-500">Preparing expert level architectural scenarios.</p>
                </div>
              ) : (
                <>
                  <div className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 leading-snug">
                      {currentQ?.question}
                    </h2>
                    {currentQ?.code_snippet && (
                      <div style={{ 
                        display: 'block', 
                        visibility: 'visible', 
                        background: '#1e293b', 
                        color: '#4ade80', 
                        padding: '20px', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        margin: '10px 0',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        borderRadius: '1rem'
                      }}>
                        <pre>{currentQ.code_snippet}</pre>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 mb-12">
                    {currentQ?.type === 'single_choice' && (
                      <div className="space-y-3">
                        {(currentQ.options || []).map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAnswerChange(opt)}
                            className={userAnswers[currentQuestionIndex] === opt ? "w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-5 border-slate-900 bg-slate-50 shadow-lg shadow-slate-100" : "w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-5 border-slate-50 hover:border-slate-200 bg-slate-50/50"}
                          >
                            <div className={userAnswers[currentQuestionIndex] === opt ? "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-all bg-slate-900 text-white" : "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-all bg-white text-slate-400 border border-slate-100"}>
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <span className="font-bold text-slate-700">{opt}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {currentQ?.type === 'multiple_choice' && (
                      <div className="space-y-3">
                        {(currentQ.options || []).map((opt, idx) => {
                          const isSelected = (userAnswers[currentQuestionIndex] || []).includes(opt);
                          return (
                            <button
                              key={idx}
                              onClick={() => handleAnswerChange(opt)}
                              className={isSelected ? "w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-5 border-slate-900 bg-slate-50" : "w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-5 border-slate-50 hover:border-slate-200 bg-slate-50/50"}
                            >
                              <div className={isSelected ? "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center bg-slate-900 border-slate-900" : "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center bg-white border-slate-200"}>
                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                              <span className="font-bold text-slate-700">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {currentQ?.type === 'fill_blank' && (
                      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <input
                          type="text"
                          value={userAnswers[currentQuestionIndex] || ""}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full bg-transparent border-b-2 border-slate-200 py-3 text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:border-slate-900 transition-colors outline-none"
                        />
                      </div>
                    )}

                    {currentQ?.type === 'code_fix' && (
                      <div className="space-y-6">
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                          <p className="text-slate-500 font-bold mb-4 text-sm uppercase tracking-widest">Identify the Error</p>
                          <input
                            type="number"
                            value={userAnswers[currentQuestionIndex] || ""}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            placeholder="Enter the line number with the error"
                            className="w-full bg-transparent border-b-2 border-slate-200 py-3 text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:border-slate-900 transition-colors outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-10 border-t border-slate-100">
                    <button 
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black disabled:opacity-0 transition-all"
                    >
                      Previous
                    </button>

                    {currentQuestionIndex < questions.length - 1 ? (
                      <button 
                        onClick={handleNext}
                        disabled={userAnswers[currentQuestionIndex] === undefined || userAnswers[currentQuestionIndex] === ""}
                        className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 disabled:opacity-30 transition-all hover:translate-x-1"
                      >
                        Next Question <ChevronRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={handleFinishAssessment}
                        disabled={userAnswers[currentQuestionIndex] === undefined || userAnswers[currentQuestionIndex] === ""}
                        className="px-12 py-4 bg-emerald-600 text-white font-black rounded-2xl flex items-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100"
                      >
                        Finish Assessment
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Assessment;
