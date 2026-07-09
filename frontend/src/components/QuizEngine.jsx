import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as wanakana from 'wanakana';

const LiquidBackground = () => (
  <div className="liquid-bg-container">
    <div className="liquid-blob blob-1"></div>
    <div className="liquid-blob blob-2"></div>
    <div className="liquid-blob blob-3"></div>
    <div className="liquid-blob blob-4"></div>
  </div>
);

const QuizEngine = ({ studySet, mode, onFinish, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [options, setOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(mode === 'GENIUS' ? 10 : null);
  const [results, setResults] = useState([]);
  const [startTime] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  // Show/hide hint: reset per question
  const [showHint, setShowHint] = useState(false);
  // Show/hide mnemonic: reset per question
  const [showMnemonic, setShowMnemonic] = useState(false);
  // Use a ref to track if answer has already been handled (prevents double-fire)
  const answeredRef = useRef(false);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setUserInput(wanakana.toHiragana(val, { IMEMode: true }));
  };

  // Shuffle the questions once at the beginning of the quiz session
  const questions = useMemo(() => {
    return [...studySet.questions].sort(() => Math.random() - 0.5);
  }, [studySet.questions]);

  // Pre-determine mode for each question in Genius mode (fixed at mount)
  const geniusModeMap = useMemo(() => {
    if (mode !== 'GENIUS') return [];
    return questions.map(() => (Math.random() > 0.5 ? 'TYPING' : 'MCQ'));
  }, [mode, questions]);

  const currentQuestion = questions[currentIndex];

  // Determine current question's input type
  const currentInputType = useMemo(() => {
    if (mode === 'TYPING') return 'TYPING';
    if (mode === 'MCQ') return 'MCQ';
    return geniusModeMap[currentIndex] || 'TYPING';
  }, [mode, currentIndex, geniusModeMap]);

  const generateOptions = useCallback(() => {
    if (!currentQuestion) return [];
    const distractors = questions
      .filter(q => q.id !== currentQuestion.id)
      .map(q => q.answer)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    return [currentQuestion.answer, ...distractors].sort(() => 0.5 - Math.random());
  }, [currentIndex, questions, currentQuestion]);

  // Reset state when moving to a new question
  useEffect(() => {
    if (currentInputType === 'MCQ') {
      setOptions(generateOptions());
    }
    if (mode === 'GENIUS') {
      setTimeLeft(10);
    }
    // Reset hint, mnemonic, and answered guard on every new question
    setShowHint(false);
    setShowMnemonic(false);
    answeredRef.current = false;
  }, [currentIndex, currentInputType, mode, generateOptions]);

  // Timer for Genius Mode - only runs when NOT transitioning and no feedback shown
  useEffect(() => {
    if (mode === 'GENIUS' && timeLeft !== null && !feedback && !isTransitioning) {
      if (timeLeft <= 0) {
        handleAnswer(null);
        return;
      }
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, mode, feedback, isTransitioning]);

  const handleAnswer = (answer) => {
    // Guard: prevent double-fire from timer AND feedback state
    if (answeredRef.current) return;
    answeredRef.current = true;

    const isCorrect = answer !== null && (
      currentInputType === 'TYPING'
        ? answer.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase()
        : answer === currentQuestion.answer
    );

    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    const detail = {
      questionId: currentQuestion.id,
      userAnswer: answer || "TIME_OUT",
      isCorrect: isCorrect
    };

    const newResults = [...results, detail];
    setResults(newResults);

    setTimeout(() => {
      setFeedback(null);
      setIsTransitioning(true);
      
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setUserInput('');
        } else {
          onFinish(newResults, startTime);
        }
        setIsTransitioning(false);
      }, 200);
    }, 1200); // 1.2s to review feedback
  };

  if (!currentQuestion) return null;

  const progressPercent = (currentIndex / questions.length) * 100;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-8 transition-all duration-200 relative overflow-hidden ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
      <LiquidBackground />

      {/* Confirm Exit Modal */}
      {showConfirmExit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-[#fafafa] border border-black/10 shadow-2xl rounded-[24px] p-10 max-w-sm w-full animate-scale-in text-center space-y-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-bold">⚠ Confirm Exit</p>
            <p className="text-sm font-semibold text-zen-black">Your progress ({currentIndex}/{questions.length}) will be lost.</p>
            <div className="flex space-x-4 pt-2">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="flex-1 py-3 glass-btn text-[10px] uppercase tracking-[0.2em] font-bold"
              >
                Continue
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 glass-btn-danger text-[10px] uppercase tracking-[0.2em] font-bold"
              >
                Exit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl space-y-12 animate-fade-in-up z-10">
        
        {/* Exit Button + Progress */}
        <div>
          <button
            onClick={() => setShowConfirmExit(true)}
            className="glass-link text-[10px] uppercase tracking-[0.2em] text-zen-black/60 hover:text-zen-black transition-colors duration-300 mb-4 inline-block font-bold cursor-pointer"
          >
            ← Exit
          </button>
          <div className="flex justify-between items-end">
            <div className="space-y-3 flex-1 mr-8">
              <div className="flex justify-between items-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-zen-black/60 font-bold">
                  {currentIndex + 1} / {questions.length}
                </p>
                {mode === 'GENIUS' && (
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zen-black/60 font-bold">
                    ⚡ {currentInputType === 'TYPING' ? '⌨ Type' : '◉ Pick'}
                  </p>
                )}
              </div>
              <div className="w-full h-3 bg-black/10 rounded-full overflow-hidden p-0.5 border border-white/40">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
            {mode === 'GENIUS' && (
              <div className={`text-5xl font-extralight tabular-nums transition-all duration-300 ${
                timeLeft <= 3 ? 'text-red-500 animate-pulse font-bold' : 'text-zen-black'
              }`}>
                {timeLeft}
              </div>
            )}
          </div>
        </div>

        {/* Prompt Card */}
        <div className={`glass-panel p-12 md:p-16 text-center shadow-xl transition-all duration-500 ${
          feedback === 'correct' ? 'border-emerald-300 bg-emerald-500/20 backdrop-blur-md' :
          feedback === 'wrong' ? 'border-red-300 bg-red-500/20 backdrop-blur-md' :
          ''
        }`}>
          <span className="text-[9px] uppercase tracking-[0.4em] text-zen-black/60 font-bold mb-3 block">
            {currentQuestion.type || 'QUESTION'}
          </span>

          {/* Mnemonic Toggle - shown between type label and prompt, only if mnemonic exists */}
          {currentQuestion.mnemonic && !feedback && (
            <div className="mb-5">
              {showMnemonic ? (
                <button
                  onClick={() => setShowMnemonic(false)}
                  className="inline-flex items-center gap-2 text-xs text-zen-black/70 font-medium italic bg-amber-50/80 border border-amber-200/60 rounded-2xl px-5 py-2.5 animate-fade-in cursor-pointer hover:bg-amber-50 transition-colors duration-200 max-w-sm mx-auto"
                >
                  <span>🧠</span>
                  <span>{currentQuestion.mnemonic}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowMnemonic(true)}
                  className="text-[9px] uppercase tracking-[0.25em] font-bold text-amber-600/60 hover:text-amber-600 transition-colors duration-200 border border-amber-200/40 hover:border-amber-300 rounded-full px-4 py-1.5 cursor-pointer"
                >
                  🧠 Show Mnemonic
                </button>
              )}
            </div>
          )}

          <h2 className="text-5xl md:text-7xl font-light text-zen-black tracking-tight leading-none">
            {currentQuestion.prompt}
          </h2>

          {/* Hint Toggle - hidden by default */}
          {currentQuestion.hint && !feedback && (
            <div className="mt-8">
              {showHint ? (
                <p className="text-xs text-zen-black/60 font-medium italic animate-fade-in">
                  💡 {currentQuestion.hint}
                </p>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-[9px] uppercase tracking-[0.25em] font-bold text-zen-black/40 hover:text-zen-black/70 transition-colors duration-200 border border-black/10 hover:border-black/20 rounded-full px-4 py-1.5 cursor-pointer"
                >
                  💡 Show Hint
                </button>
              )}
            </div>
          )}
          
          {/* Feedback indicator */}
          {feedback && (
            <div className={`mt-8 text-sm font-bold animate-fade-in ${feedback === 'correct' ? 'text-emerald-600' : 'text-red-600'}`}>
              {feedback === 'correct' ? '✓ Correct!' : `✕ Answer: ${currentQuestion.answer}`}
            </div>
          )}
        </div>

        {/* Answer Area */}
        {!feedback && (
          <div className="space-y-4 animate-fade-in">
            {currentInputType === 'TYPING' ? (
              <div className="relative group">
                <input
                  autoFocus
                  value={userInput}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && userInput.trim() && handleAnswer(userInput)}
                  placeholder="Type Romaji (e.g. nihongo -> にほんご)..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="w-full glass-input px-6 py-4 text-2xl font-light focus:outline-none transition-all duration-300 text-center rounded-2xl text-zen-black placeholder-black/30"
                />
                <p className="text-center mt-4 text-[9px] text-zen-black/60 uppercase tracking-[0.3em] font-bold">
                  Press Enter ↵
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    className="glass-panel glass-panel-hover p-5 text-sm font-semibold text-center hover:scale-[1.02] cursor-pointer text-zen-black active:scale-95"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizEngine;
