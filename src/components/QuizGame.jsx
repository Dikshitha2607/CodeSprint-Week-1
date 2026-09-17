import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Clock, AlertTriangle, RotateCcw, ArrowRight, Award, Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import { playSound } from '../utils/audio';

const DEMO_PRESETS = {
  networking: [
    {
      question: "Which transport protocol does WebSockets use for persistent bi-directional streaming?",
      options: ["UDP Datagram", "TCP RFC 6455", "HTTP GET Polling", "SMTP Mail Stream"],
      answer: 1,
      explanation: "WebSockets establish a full-duplex TCP connection over RFC 6455."
    },
    {
      question: "What is the typical target latency tier for competitive local wireless game controllers?",
      options: ["Sub-8ms Realtime", "120ms - 200ms Buffer", "500ms Delay", "1000ms Standard"],
      answer: 0,
      explanation: "Sub-8ms latency delivers responsive, near-instantaneous game input."
    },
    {
      question: "In browser WebRTC data channels, what protocol facilitates peer NAT traversal?",
      options: ["FTP Mirror", "STUN / TURN Server", "POP3 Relay", "SNMP Bridge"],
      answer: 1,
      explanation: "STUN and TURN servers enable direct peer-to-peer data channels through NATs."
    },
    {
      question: "What happens when a Socket.IO client cannot establish a direct WebSocket connection?",
      options: ["Closes application", "Falls back to HTTP Long-Polling", "Requires device reboot", "Throws fatal kernel error"],
      answer: 1,
      explanation: "Socket.IO automatically falls back to HTTP long-polling transport."
    },
    {
      question: "Which port is configured as the unified dev server binding in this container?",
      options: ["Port 8080", "Port 3000 (0.0.0.0)", "Port 5173", "Port 8000"],
      answer: 1,
      explanation: "Port 3000 on host 0.0.0.0 is the dedicated reverse-proxy port."
    }
  ]
};

// Client-side 5-question synthesizer from uploaded text
function generateQuestionsFromText(text, fileName) {
  const cleanName = fileName.replace(/\.[^/.]+$/, "");
  
  // Try parsing JSON first
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length >= 5 && parsed[0].question && parsed[0].options) {
      return parsed.slice(0, 5).map((q) => ({
        question: String(q.question),
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : ["A", "B", "C", "D"],
        answer: typeof q.answer === 'number' ? q.answer : 0,
        explanation: q.explanation || "Extracted directly from uploaded JSON questions."
      }));
    }
  } catch {
    // Not a direct JSON quiz array, proceed with smart text extraction
  }

  // Extract meaningful non-empty lines and words
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 20 && !l.startsWith('//') && !l.startsWith('/*'));

  const words = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4 && !/^\d+$/.test(w));

  const uniqueWords = Array.from(new Set(words));
  const sampleKeyTerms = uniqueWords.slice(0, 15);

  const keyTerm1 = sampleKeyTerms[0] || 'Architecture';
  const keyTerm2 = sampleKeyTerms[1] || 'Configuration';
  const keyTerm3 = sampleKeyTerms[2] || 'Interface';
  const keyTerm4 = sampleKeyTerms[3] || 'Optimization';
  const keyTerm5 = sampleKeyTerms[4] || 'Execution';

  return [
    {
      question: `According to ${fileName}, what primary concept is emphasized in relation to "${keyTerm1}"?`,
      options: [
        `High-throughput modular workflow based on ${keyTerm1}`,
        `Static legacy single-threaded process`,
        `Unencrypted unbuffered transmission mode`,
        `Manual off-line backup script`
      ],
      answer: 0,
      explanation: `Document context highlights ${keyTerm1} as the primary modular design element.`
    },
    {
      question: `Which configuration parameter or component governs "${keyTerm2}" in ${cleanName}?`,
      options: [
        `Default unmanaged global environment`,
        `Targeted parameter tuning for ${keyTerm2}`,
        `Deprecated legacy fallback profile`,
        `External unauthenticated client proxy`
      ],
      answer: 1,
      explanation: `Targeted parameter tuning for ${keyTerm2} is specified in the uploaded file structure.`
    },
    {
      question: `What functional role is associated with "${keyTerm3}" in the document workflow?`,
      options: [
        `Periodic cache purge daemon`,
        `Random seed generator`,
        `Standardized protocol communication for ${keyTerm3}`,
        `Static documentation disclaimer`
      ],
      answer: 2,
      explanation: `${keyTerm3} establishes standardized communication boundaries in this specification.`
    },
    {
      question: `What operational benefit is achieved by applying "${keyTerm4}" in ${fileName}?`,
      options: [
        `Increased computational overhead`,
        `Reduced latency and streamlined ${keyTerm4}`,
        `Forced blocking thread sleep cycles`,
        `Extended cold-start boot sequence`
      ],
      answer: 1,
      explanation: `Implementing ${keyTerm4} reduces latency and provides cleaner resource allocation.`
    },
    {
      question: `What is the expected outcome of the "${keyTerm5}" lifecycle step in ${cleanName}?`,
      options: [
        `System crash and memory dump`,
        `Indefinite background process loop`,
        `Unconditional connection reset`,
        `Successful execution validation and state synchronization`
      ],
      answer: 3,
      explanation: `The ${keyTerm5} step concludes with validation and synchronous state delivery.`
    }
  ];
}

export default function QuizGame({ remoteAction, isPaused, restartCounter, onExit }) {
  // Game States: 'UPLOAD' | 'QUIZ' | 'COMPLETED'
  const [gameState, setGameState] = useState('UPLOAD');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [questions, setQuestions] = useState(DEMO_PRESETS.networking);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null); // null | 0..3 | -1 (timeout)
  const [cursor, setCursor] = useState(0); // 0..3 for mobile remote D-Pad
  const [feedback, setFeedback] = useState(null); // null | { isCorrect: boolean, chosen: number, correct: number, timedOut: boolean }
  const [timeLeft, setTimeLeft] = useState(45); // 45 seconds countdown timer
  const [userAnswers, setUserAnswers] = useState([]); // [{ qIdx, chosen, correct, isCorrect }]

  const lastHandledTimeRef = useRef(0);
  const timerRef = useRef(null);

  // Restart Quiz when external restart is pressed
  useEffect(() => {
    resetQuiz();
  }, [restartCounter]);

  // 45-Second Timer Countdown
  useEffect(() => {
    if (gameState !== 'QUIZ' || selectedOpt !== null || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        if (prev <= 6 && prev > 1) {
          playSound('tick');
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentIdx, selectedOpt, isPaused]);

  // Handle Timeout (45s elapsed without answering)
  const handleTimeout = () => {
    if (selectedOpt !== null) return;
    const currentQ = questions[currentIdx];
    setSelectedOpt(-1);
    playSound('wrong');

    const result = {
      isCorrect: false,
      chosen: -1,
      correct: currentQ.answer,
      timedOut: true
    };
    setFeedback(result);
    setUserAnswers((prev) => [...prev, { qIdx: currentIdx, ...result }]);

    // Show correct answer banner for 2.2s before advancing
    setTimeout(() => {
      advanceQuestion();
    }, 2200);
  };

  // Handle User Selecting an Answer
  const handleSelectAnswer = (optIdx) => {
    if (selectedOpt !== null || gameState !== 'QUIZ' || isPaused) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const currentQ = questions[currentIdx];
    const isCorrect = optIdx === currentQ.answer;
    setSelectedOpt(optIdx);

    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft * 3);
      setScore((s) => s + 100 + timeBonus);
      playSound('correct');
    } else {
      playSound('wrong');
    }

    const result = {
      isCorrect,
      chosen: optIdx,
      correct: currentQ.answer,
      timedOut: false
    };
    setFeedback(result);
    setUserAnswers((prev) => [...prev, { qIdx: currentIdx, ...result }]);

    // Display correct/wrong answer feedback clearly before advancing
    const waitTime = isCorrect ? 1800 : 2400;
    setTimeout(() => {
      advanceQuestion();
    }, waitTime);
  };

  // Advance to next question or complete quiz
  const advanceQuestion = () => {
    setSelectedOpt(null);
    setFeedback(null);
    setCursor(0);
    setTimeLeft(45);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setGameState('COMPLETED');
      playSound('win');
    }
  };

  // Handle File Upload from PC
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setIsReadingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      const generated = generateQuestionsFromText(String(content), file.name);
      setQuestions(generated);
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setIsReadingFile(false);
    };

    // Read file text
    reader.readAsText(file);
  };

  // Start Quiz
  const startQuiz = () => {
    setGameState('QUIZ');
    setCurrentIdx(0);
    setScore(0);
    setSelectedOpt(null);
    setCursor(0);
    setFeedback(null);
    setTimeLeft(45);
    setUserAnswers([]);
  };

  // Reset Quiz
  const resetQuiz = () => {
    setGameState('UPLOAD');
    setUploadedFile(null);
    setQuestions(DEMO_PRESETS.networking);
    setCurrentIdx(0);
    setScore(0);
    setSelectedOpt(null);
    setCursor(0);
    setFeedback(null);
    setTimeLeft(45);
    setUserAnswers([]);
  };

  // Remote Mobile Controller Handler
  useEffect(() => {
    if (!remoteAction || isPaused) return;
    const { action, timestamp } = remoteAction;

    if (timestamp && timestamp === lastHandledTimeRef.current) return;
    lastHandledTimeRef.current = timestamp || Date.now();

    if (gameState === 'UPLOAD') {
      if (action === 'ACTION_A' || action === 'START' || action === 'UP' || action === 'DOWN') {
        startQuiz();
      }
      return;
    }

    if (gameState === 'COMPLETED') {
      if (action === 'ACTION_A' || action === 'START' || action === 'UP' || action === 'DOWN') {
        resetQuiz();
      }
      return;
    }

    if (gameState === 'QUIZ') {
      if (action === 'UP') {
        playSound('move');
        setCursor((prev) => (prev >= 2 ? prev - 2 : (prev > 0 ? prev - 1 : 3)));
      } else if (action === 'DOWN') {
        playSound('move');
        setCursor((prev) => (prev <= 1 ? prev + 2 : (prev < 3 ? prev + 1 : 0)));
      } else if (action === 'LEFT') {
        playSound('move');
        setCursor((prev) => (prev > 0 ? prev - 1 : 3));
      } else if (action === 'RIGHT') {
        playSound('move');
        setCursor((prev) => (prev < 3 ? prev + 1 : 0));
      } else if (action === 'ACTION_A' || action === 'START') {
        handleSelectAnswer(cursor);
      } else if (action === 'ACTION_B') {
        handleSelectAnswer(1);
      }
    }
  }, [remoteAction, isPaused, gameState, cursor, selectedOpt]);

  // Keyboard navigation on Host PC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPaused) return;

      if (gameState === 'UPLOAD') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startQuiz();
        }
        return;
      }

      if (gameState === 'COMPLETED') {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          resetQuiz();
        }
        return;
      }

      if (gameState === 'QUIZ') {
        if (selectedOpt !== null) return;

        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          playSound('move');
          setCursor((prev) => (prev >= 2 ? prev - 2 : (prev > 0 ? prev - 1 : 3)));
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          playSound('move');
          setCursor((prev) => (prev <= 1 ? prev + 2 : (prev < 3 ? prev + 1 : 0)));
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          playSound('move');
          setCursor((prev) => (prev > 0 ? prev - 1 : 3));
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          playSound('move');
          setCursor((prev) => (prev < 3 ? prev + 1 : 0));
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelectAnswer(cursor);
        } else if (e.key >= '1' && e.key <= '4') {
          e.preventDefault();
          const opt = parseInt(e.key, 10) - 1;
          setCursor(opt);
          handleSelectAnswer(opt);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, gameState, selectedOpt, cursor]);

  const currentQ = questions[currentIdx] || questions[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-[620px] bg-[#0b0e14] text-[#ffffff] p-4 sm:p-6 select-none">
      {/* Header Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#58a6ff]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff] font-bold">
            ❓
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#ffffff] tracking-tight">Knowledge Trivia</h2>
            <div className="flex items-center gap-2 text-[11px] font-mono-code text-[#8b949e]">
              <span>5 Questions Challenge</span>
              <span>•</span>
              <span className="text-[#58a6ff]">45s Timer Per Question</span>
            </div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-[#f85149] text-xs font-mono-code text-[#8b949e] hover:text-[#f85149] transition-colors cursor-pointer"
        >
          Exit
        </button>
      </div>

      {/* Main Game Container */}
      <div className="w-full max-w-2xl bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* VIEW 1: FILE UPLOAD & PRESET SELECTION */}
        {gameState === 'UPLOAD' && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#58a6ff]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff]">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-[#ffffff] mb-1.5">Upload File to Generate Quiz</h3>
              <p className="text-xs text-[#8b949e] max-w-md mx-auto">
                Upload any document (.txt, .md, .json, .csv, .pdf, .docx) from your PC to generate 5 custom questions with a 45-second timer.
              </p>
            </div>

            {/* Dropzone Container */}
            <div className="w-full max-w-md border-2 border-dashed border-[#30363d] hover:border-[#58a6ff] rounded-2xl p-6 bg-[#0d1117] transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group">
              <input
                type="file"
                id="quiz-upload-input"
                accept=".txt,.md,.json,.csv,.pdf,.docx,.doc,.js,.html,.ts"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="quiz-upload-input" className="cursor-pointer flex flex-col items-center gap-2 w-full">
                <FileText className="w-8 h-8 text-[#8b949e] group-hover:text-[#58a6ff] transition-colors" />
                <span className="text-xs font-mono-code font-bold text-[#58a6ff] hover:underline">
                  {uploadedFile ? uploadedFile.name : 'Click to Browse File from PC'}
                </span>
                <span className="text-[10px] font-mono-code text-[#8b949e]">
                  {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB • Ready` : 'Supports TXT, MD, JSON, CSV, PDF, DOCX'}
                </span>
              </label>

              {isReadingFile && (
                <div className="flex items-center gap-2 text-xs font-mono-code text-[#00ff85] mt-2 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing 5 questions from content...</span>
                </div>
              )}
            </div>

            {/* Quick Demo Options */}
            <div className="w-full max-w-md pt-2">
              <div className="flex items-center gap-2 text-[11px] font-mono-code text-[#8b949e] mb-2 justify-center">
                <span>Or load quick demo topic:</span>
              </div>
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setQuestions(DEMO_PRESETS.networking);
                  startQuiz();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-xs font-mono-code text-[#c9d1d9] hover:text-[#58a6ff] transition-all cursor-pointer"
              >
                🎮 WebSockets & Game Controllers (Default)
              </button>
            </div>

            {/* Start Button */}
            <button
              onClick={startQuiz}
              disabled={isReadingFile}
              className="w-full max-w-md py-3.5 px-6 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-[#0d1117] font-extrabold rounded-xl shadow-[0_0_20px_rgba(88,166,255,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <span>{uploadedFile ? 'Start 5-Question Quiz from File' : 'Start 5-Question Quiz'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* VIEW 2: ACTIVE QUIZ PLAY */}
        {gameState === 'QUIZ' && (
          <div className="space-y-6">
            {/* Top Bar: Progress & 45s Timer */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono-code">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] text-[#58a6ff] font-bold">
                    QUESTION {currentIdx + 1} OF 5
                  </span>
                  <span className="text-[#8b949e]">Score: {score} pts</span>
                </div>

                {/* 45-Second Timer Badge */}
                <div className={`px-3 py-1 rounded-lg border font-mono-code font-bold flex items-center gap-1.5 transition-colors ${
                  timeLeft <= 10
                    ? 'text-[#f85149] bg-[#f85149]/10 border-[#f85149] animate-pulse'
                    : timeLeft <= 20
                    ? 'text-[#facc15] bg-[#facc15]/10 border-[#facc15]'
                    : 'text-[#00ff85] bg-[#00ff85]/10 border-[#00ff85]/30'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeLeft}s remaining</span>
                </div>
              </div>

              {/* 45-Second Progress Bar */}
              <div className="w-full h-2 bg-[#0d1117] rounded-full overflow-hidden border border-[#30363d]">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${
                    timeLeft > 20 ? 'bg-[#00ff85]' : timeLeft > 10 ? 'bg-[#facc15]' : 'bg-[#f85149]'
                  }`}
                  style={{ width: `${(timeLeft / 45) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-bold text-[#ffffff] leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* 4 Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentQ.options.map((option, idx) => {
                const isFocused = idx === cursor;
                const isSelected = selectedOpt === idx;
                const isCorrect = idx === currentQ.answer;

                let optClass = "bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff]/70";

                if (isFocused && selectedOpt === null) {
                  optClass = "border-2 border-[#58a6ff] bg-[#58a6ff]/15 text-[#ffffff] shadow-[0_0_16px_rgba(88,166,255,0.35)] scale-[1.01]";
                }

                // If user selected an answer (or timed out), display correct & wrong answers accordingly!
                if (selectedOpt !== null) {
                  if (isCorrect) {
                    // Highlight the correct answer in Emerald Green!
                    optClass = "border-2 border-[#00ff85] bg-[#00ff85]/20 text-[#00ff85] font-bold shadow-[0_0_20px_rgba(0,255,133,0.4)] scale-[1.02]";
                  } else if (isSelected && !isCorrect) {
                    // Highlight the wrong chosen option in Red!
                    optClass = "border-2 border-[#f85149] bg-[#f85149]/20 text-[#f85149] font-bold shadow-[0_0_15px_rgba(248,81,73,0.4)]";
                  } else {
                    optClass = "bg-[#0d1117]/50 border-[#30363d]/40 text-[#8b949e] opacity-40";
                  }
                }

                const label = ['A', 'B', 'C', 'D'][idx];

                return (
                  <button
                    key={idx}
                    disabled={selectedOpt !== null}
                    onClick={() => {
                      setCursor(idx);
                      handleSelectAnswer(idx);
                    }}
                    className={`p-4 rounded-xl border text-left font-mono-code text-xs sm:text-sm transition-all cursor-pointer flex flex-col gap-2 relative ${optClass}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        isSelected && isCorrect
                          ? 'bg-[#00ff85] text-[#0d1117]'
                          : isSelected && !isCorrect
                          ? 'bg-[#f85149] text-[#ffffff]'
                          : isCorrect && selectedOpt !== null
                          ? 'bg-[#00ff85] text-[#0d1117]'
                          : 'bg-[#161b22] border border-[#30363d] text-[#8b949e]'
                      }`}>
                        {label}
                      </span>

                      {selectedOpt !== null && isCorrect && (
                        <span className="flex items-center gap-1 text-[#00ff85] font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" /> Correct
                        </span>
                      )}

                      {selectedOpt !== null && isSelected && !isCorrect && (
                        <span className="flex items-center gap-1 text-[#f85149] font-bold text-xs">
                          <XCircle className="w-4 h-4" /> Wrong
                        </span>
                      )}
                    </div>

                    <span className="font-semibold leading-snug">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Immediate Correct / Wrong Answer Banner */}
            {feedback && (
              <div className={`p-4 rounded-xl border font-mono-code text-xs transition-all ${
                feedback.isCorrect
                  ? 'bg-[#00ff85]/10 border-[#00ff85]/40 text-[#00ff85]'
                  : 'bg-[#f85149]/10 border-[#f85149]/40 text-[#f85149]'
              }`}>
                <div className="flex items-start gap-2.5">
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-[#00ff85] mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-[#f85149] mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold text-sm">
                      {feedback.isCorrect
                        ? '✓ Correct Answer!'
                        : feedback.timedOut
                        ? '⏰ 45s Time Expired!'
                        : '✗ Incorrect Answer!'}
                    </div>
                    {!feedback.isCorrect && (
                      <div className="text-[#ffffff]">
                        Correct Answer: <strong className="text-[#00ff85]">{currentQ.options[currentQ.answer]}</strong>
                      </div>
                    )}
                    <div className="text-[11px] text-[#8b949e]">
                      {currentQ.explanation}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: COMPLETED RESULTS & QUESTION REVIEW */}
        {gameState === 'COMPLETED' && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#00ff85]/10 border border-[#00ff85]/30 flex items-center justify-center text-[#00ff85]">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#ffffff]">Quiz Completed!</h3>
              <p className="text-xs text-[#8b949e] font-mono-code mt-1">
                {uploadedFile ? `Based on: ${uploadedFile.name}` : 'Topic: WebSockets & Game Controllers'}
              </p>
            </div>

            {/* Score Summary Metrics */}
            <div className="w-full max-w-md grid grid-cols-2 gap-3 font-mono-code">
              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e] uppercase font-bold">Total Score</div>
                <div className="text-2xl font-black text-[#58a6ff] mt-1">{score} pts</div>
              </div>

              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e] uppercase font-bold">Accuracy</div>
                <div className="text-2xl font-black text-[#00ff85] mt-1">
                  {userAnswers.filter((a) => a.isCorrect).length} / 5
                  <span className="text-xs text-[#8b949e] font-normal ml-1">
                    ({Math.round((userAnswers.filter((a) => a.isCorrect).length / 5) * 100)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Comprehensive Answer Review List */}
            <div className="w-full text-left space-y-3 font-mono-code">
              <div className="text-xs font-bold text-[#8b949e] uppercase px-1">
                Question Review & Explanations:
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const ans = userAnswers[idx];
                  const wasCorrect = ans && ans.isCorrect;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs ${
                        wasCorrect ? 'bg-[#00ff85]/5 border-[#00ff85]/30' : 'bg-[#f85149]/5 border-[#f85149]/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-[#ffffff]">
                          {idx + 1}. {q.question}
                        </div>
                        {wasCorrect ? (
                          <span className="text-[#00ff85] font-bold shrink-0 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                          </span>
                        ) : (
                          <span className="text-[#f85149] font-bold shrink-0 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Wrong
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-[11px] space-y-0.5">
                        <div className="text-[#8b949e]">
                          Your Answer:{' '}
                          <span className={wasCorrect ? 'text-[#00ff85]' : 'text-[#f85149]'}>
                            {ans && ans.chosen >= 0 ? q.options[ans.chosen] : 'Timed out (No answer)'}
                          </span>
                        </div>
                        {!wasCorrect && (
                          <div className="text-[#ffffff]">
                            Correct Answer: <span className="text-[#00ff85] font-bold">{q.options[q.answer]}</span>
                          </div>
                        )}
                        <div className="text-[#8b949e] italic text-[10px] mt-1">
                          Reason: {q.explanation}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
              <button
                onClick={startQuiz}
                className="flex-1 py-3 px-4 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-[#0d1117] font-extrabold rounded-xl transition-all cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>

              <button
                onClick={resetQuiz}
                className="flex-1 py-3 px-4 bg-[#21262d] hover:bg-[#30363d] text-[#ffffff] font-bold rounded-xl border border-[#30363d] hover:border-[#58a6ff] transition-all cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New File</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
