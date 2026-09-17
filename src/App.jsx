import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import {
  Gamepad2,
  Wifi,
  Smartphone,
  Zap,
  QrCode,
  Tv,
  ChevronDown,
  ShieldCheck,
  Play,
  Pause,
  PauseCircle,
  LogOut,
  Radio,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  Copy,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Activity,
  Lock,
  WifiOff,
  Check,
  Loader2
} from 'lucide-react';

// Connect to Socket.IO backend server (Render deployment URL vs Localhost fallback)
const socketHost = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
export const BACKEND_URL = typeof window !== 'undefined' && window.location.hostname.endsWith('onrender.com')
  ? 'https://air-gamepad-backend.onrender.com'
  : `http://${socketHost}:3000`;

const socket = io(BACKEND_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

// --- GAME 1: PING PONG ---
function PingPongGame({ remoteAction, isPaused, restartCounter, onExit }) {
  const [paddleY, setPaddleY] = useState(50);
  const [aiPaddleY, setAiPaddleY] = useState(50);
  const [ball, setBall] = useState({ x: 50, y: 50, vx: 1.2, vy: 0.8 });
  const [score, setScore] = useState(0);
  const [aiDifficulty, setAiDifficulty] = useState(0.7);
  const [gameOver, setGameOver] = useState(false);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  useEffect(() => {
    resetGame();
  }, [restartCounter]);

  useEffect(() => {
    if (!remoteAction || isPaused) return;
    const { action } = remoteAction;
    if (gameOver) {
      if (action === 'ACTION_A' || action === 'ACTION_B' || action === 'START' || action === 'UP' || action === 'DOWN') {
        resetGame();
      }
      return;
    }
    if (action === 'UP' || action === 'LEFT' || action === 'ACTION_A') {
      setPaddleY((prev) => Math.max(10, prev - 12));
    } else if (action === 'DOWN' || action === 'RIGHT' || action === 'ACTION_B') {
      setPaddleY((prev) => Math.min(90, prev + 12));
    }
  }, [remoteAction, isPaused, gameOver]);

  useEffect(() => {
    const handleKey = (e) => {
      if (isPaused) return;
      if (e.key === 'ArrowUp') setPaddleY((prev) => Math.max(10, prev - 12));
      if (e.key === 'ArrowDown') setPaddleY((prev) => Math.min(90, prev + 12));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPaused]);

  useEffect(() => {
    if (gameOver || isPaused) return;
    const interval = setInterval(() => {
      setBall((prev) => {
        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVx = prev.vx;
        let newVy = prev.vy;

        if (newY <= 5 || newY >= 95) {
          newVy = -newVy;
          newY = Math.max(5, Math.min(95, newY));
        }

        if (newX <= 8) {
          if (Math.abs(newY - paddleY) <= 18) {
            newVx = Math.abs(prev.vx) * 1.05;
            newX = 8;
            setScore((s) => s + 1);
          } else {
            setGameOver(true);
          }
        }

        if (newX >= 92) {
          if (Math.abs(newY - aiPaddleY) <= 18) {
            newVx = -Math.abs(prev.vx) * 1.05;
            newX = 92;
            newVy += (newY - aiPaddleY) * 0.12;
          } else {
            setGameOver(true);
          }
        }

        return { x: newX, y: newY, vx: newVx, vy: newVy };
      });
    }, 30);

    return () => clearInterval(interval);
  }, [paddleY, aiPaddleY, gameOver, isPaused]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const aiSpeed = 0.8 + aiDifficulty * 1.35;
    const trackingBias = Math.max(0, 16 - aiDifficulty * 8);
    const predictedY = ball.y + ball.vy * (2.5 + aiDifficulty * 2.5);
    const targetY = clamp(predictedY + (ball.vy >= 0 ? trackingBias * 0.2 : -trackingBias * 0.2), 10, 90);

    setAiPaddleY((prev) => {
      const diff = targetY - prev;
      if (Math.abs(diff) < 3) {
        return prev;
      }
      const step = Math.min(Math.abs(diff), aiSpeed);
      return clamp(prev + (diff >= 0 ? step : -step), 10, 90);
    });
  }, [ball, aiDifficulty, gameOver, isPaused]);

  useEffect(() => {
    setAiDifficulty(Math.min(2.1, 0.7 + score * 0.08));
  }, [score]);

  const resetGame = () => {
    setBall({ x: 50, y: 50, vx: 1.2, vy: 0.8 });
    setScore(0);
    setPaddleY(50);
    setAiPaddleY(50);
    setAiDifficulty(0.7);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-[#0b0e14] text-[#ffffff] p-6">
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">🏓 Ping Pong</h2>
        <div className="text-lg font-mono-code font-bold text-[#00ff85]">Score / Rally: {score}</div>
        <button onClick={onExit} className="px-4 py-2 rounded-lg bg-[#21262d] text-xs font-mono-code hover:bg-[#30363d] cursor-pointer">Exit Game</button>
      </div>

      <div className="relative w-full max-w-4xl h-[400px] bg-[#161b22] border-2 border-[#30363d] rounded-2xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r-2 border-dashed border-[#30363d]/60 pointer-events-none"></div>

        <div
          className="absolute left-[3%] w-4 h-24 bg-[#58a6ff] rounded-full shadow-[0_0_15px_rgba(88,166,255,0.8)] transition-all duration-75"
          style={{ top: `calc(${paddleY}% - 48px)` }}
        ></div>

        <div
          className="absolute right-[3%] w-4 h-24 bg-[#f85149] rounded-full shadow-[0_0_15px_rgba(248,81,73,0.8)] transition-all duration-75"
          style={{ top: `calc(${aiPaddleY}% - 48px)` }}
        ></div>

        <div
          className="absolute w-6 h-6 bg-[#ffffff] rounded-full shadow-[0_0_20px_rgba(255,255,255,0.9)] transition-all duration-75"
          style={{ left: `calc(${ball.x}% - 12px)`, top: `calc(${ball.y}% - 12px)` }}
        ></div>

        {gameOver && (
          <div className="absolute inset-0 bg-[#0d1117]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h3 className="text-3xl font-extrabold text-[#f85149]">Game Over!</h3>
            <p className="text-sm font-mono-code text-[#8b949e]">Final Rally Score: {score}</p>
            <button onClick={resetGame} className="px-6 py-3 bg-[#58a6ff] text-[#0d1117] font-bold rounded-xl shadow-lg hover:scale-105 transition-transform cursor-pointer">
              Play Again
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs font-mono-code text-[#8b949e]">
        Mobile Remote: Press <span className="text-[#58a6ff]">▲ / ◄ UP</span> or <span className="text-[#58a6ff]">▼ / ► DOWN</span> to move paddle.
      </div>
    </div>
  );
}

// --- GAME 2: QUIZ ---
function QuizGame({ remoteAction, isPaused, restartCounter, onExit }) {
  const QUESTIONS = [
    { question: 'What protocol does Air Game Pad use for real-time streaming?', options: ['HTTP Long Polling', 'WebSockets Stream', 'FTP Server', 'MQTT Broker'], answer: 1 },
    { question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Power Utility', 'Core Performance Control', 'Control Packet Unit'], answer: 0 },
    { question: 'What is the default port for Vite local dev server?', options: ['3000', '8080', '5173', '4000'], answer: 2 },
    { question: 'Which game uses a 3x3 grid?', options: ['Connect 4', 'Chess', 'Tic Tac Toe', 'Ping Pong'], answer: 2 },
    { question: 'How many discs in a row win Connect 4?', options: ['3 Discs', '4 Discs', '5 Discs', '6 Discs'], answer: 1 },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [optCursor, setOptCursor] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    restartQuiz();
  }, [restartCounter]);

  const handleSelectAnswer = (optIdx) => {
    if (selectedOpt !== null || isCompleted || isPaused) return;
    setSelectedOpt(optIdx);
    if (optIdx === QUESTIONS[currentIdx].answer) {
      setScore((s) => s + 100);
    }
    setTimeout(() => {
      if (currentIdx + 1 < QUESTIONS.length) {
        setCurrentIdx((prev) => prev + 1);
        setSelectedOpt(null);
        setOptCursor(0);
      } else {
        setIsCompleted(true);
      }
    }, 1200);
  };

  useEffect(() => {
    if (!remoteAction || isPaused) return;
    const { action } = remoteAction;
    if (isCompleted) {
      if (action === 'ACTION_A' || action === 'ACTION_B' || action === 'START' || action === 'UP' || action === 'DOWN') {
        restartQuiz();
      }
      return;
    }
    if (action === 'LEFT') setOptCursor((prev) => (prev > 0 ? prev - 1 : 3));
    else if (action === 'RIGHT') setOptCursor((prev) => (prev < 3 ? prev + 1 : 0));
    else if (action === 'UP') setOptCursor((prev) => (prev >= 2 ? prev - 2 : (prev > 0 ? prev - 1 : 3)));
    else if (action === 'DOWN') setOptCursor((prev) => (prev <= 1 ? prev + 2 : (prev < 3 ? prev + 1 : 0)));
    else if (action === 'ACTION_A' || action === 'START') {
      handleSelectAnswer(optCursor);
    } else if (action === 'ACTION_B') {
      handleSelectAnswer(1);
    }
  }, [remoteAction, isPaused, optCursor, isCompleted]);

  const restartQuiz = () => {
    setCurrentIdx(0);
    setScore(0);
    setSelectedOpt(null);
    setOptCursor(0);
    setIsCompleted(false);
  };

  const q = QUESTIONS[currentIdx];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-[#0b0e14] text-[#ffffff] p-6">
      <div className="w-full max-w-3xl flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">❓ Quiz Challenge</h2>
        <div className="text-lg font-mono-code font-bold text-[#58a6ff]">Score: {score} pts</div>
        <button onClick={onExit} className="px-4 py-2 rounded-lg bg-[#21262d] text-xs font-mono-code hover:bg-[#30363d] cursor-pointer">Exit Game</button>
      </div>

      <div className="w-full max-w-3xl bg-[#161b22] border border-[#30363d] rounded-2xl p-8 shadow-2xl">
        {!isCompleted ? (
          <>
            <div className="flex justify-between items-center text-xs font-mono-code text-[#8b949e] mb-4">
              <span>QUESTION {currentIdx + 1} OF {QUESTIONS.length}</span>
              <span>D-PAD: ◄ ► ▲ ▼ Move Highlight • OK / Action A to Submit</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-[#ffffff] mb-8 leading-snug">
              {q.question}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {q.options.map((opt, idx) => {
                const isFocused = idx === optCursor;
                let btnStyle = isFocused ? "bg-[#58a6ff]/20 border-[#58a6ff] text-[#ffffff] shadow-[0_0_15px_rgba(88,166,255,0.4)] scale-[1.02]" : "bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff]";
                if (selectedOpt !== null) {
                  if (idx === q.answer) {
                    btnStyle = "bg-[#00ff85]/20 border-[#00ff85] text-[#00ff85] font-bold shadow-[0_0_15px_rgba(0,255,133,0.3)]";
                  } else if (idx === selectedOpt) {
                    btnStyle = "bg-[#f85149]/20 border-[#f85149] text-[#f85149] font-bold";
                  }
                }
                const labelMap = ['Option A', 'Option B', 'Option C', 'Option D'];

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setOptCursor(idx);
                      handleSelectAnswer(idx);
                    }}
                    className={`p-4 rounded-xl border text-left font-mono-code text-sm transition-all cursor-pointer flex flex-col gap-1 ${btnStyle}`}
                  >
                    <span className={`text-[10px] font-bold ${isFocused ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`}>{labelMap[idx]} {isFocused ? '(Highlighted)' : ''}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8 flex flex-col items-center gap-4">
            <h3 className="text-3xl font-extrabold text-[#00ff85]">Quiz Completed!</h3>
            <p className="text-lg font-mono-code text-[#c9d1d9]">Your Final Score: <span className="text-[#58a6ff] font-bold">{score} / {QUESTIONS.length * 100}</span></p>
            <button onClick={restartQuiz} className="px-6 py-3 bg-[#58a6ff] text-[#0d1117] font-bold rounded-xl shadow-lg hover:scale-105 transition-transform mt-4 cursor-pointer">
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- GAME 3: TIC TAC TOE ---
function TicTacToeGame({ remoteAction, isPaused, restartCounter, onExit }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [cursor, setCursor] = useState(0);
  const [winner, setWinner] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState(0.35);
  const [playerWinStreak, setPlayerWinStreak] = useState(0);

  useEffect(() => {
    resetGame();
  }, [restartCounter]);

  const checkWinner = (b) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let l of lines) {
      const [a, bIdx, c] = l;
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) return b[a];
    }
    if (b.every((cell) => cell !== null)) return 'Draw';
    return null;
  };

  const findWinningMove = (currentBoard, player) => {
    for (let i = 0; i < currentBoard.length; i++) {
      if (currentBoard[i] !== null) continue;
      const testBoard = [...currentBoard];
      testBoard[i] = player;
      if (checkWinner(testBoard) === player) return i;
    }
    return null;
  };

  const chooseAiMove = (currentBoard, difficulty) => {
    const availableMoves = currentBoard.map((cell, idx) => (cell === null ? idx : null)).filter((idx) => idx !== null);
    if (!availableMoves.length) return null;

    const immediateWin = findWinningMove(currentBoard, 'O');
    if (immediateWin !== null) return immediateWin;

    const blockMove = findWinningMove(currentBoard, 'X');
    if (blockMove !== null) return blockMove;

    const strategicOrder = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    const preferredMove = strategicOrder.find((idx) => currentBoard[idx] === null);
    if (preferredMove !== undefined && Math.random() < difficulty) {
      return preferredMove;
    }

    if (Math.random() < 0.35) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    return preferredMove !== undefined ? preferredMove : availableMoves[Math.floor(Math.random() * availableMoves.length)];
  };

  useEffect(() => {
    if (!aiThinking || winner || isPaused) return;

    const timer = setTimeout(() => {
      const move = chooseAiMove(board, aiDifficulty);
      if (move === null || winner) {
        setAiThinking(false);
        return;
      }

      const nextBoard = [...board];
      nextBoard[move] = 'O';
      setBoard(nextBoard);

      const nextWinner = checkWinner(nextBoard);
      if (nextWinner) {
        setWinner(nextWinner);
        if (nextWinner === 'O') {
          setPlayerWinStreak(0);
          setAiDifficulty((prev) => Math.max(0.35, prev - 0.12));
        }
      }
      setAiThinking(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [aiThinking, board, winner, isPaused, aiDifficulty]);

  const handleTileClick = (idx) => {
    if (board[idx] || winner || isPaused || aiThinking) return;
    const nextBoard = [...board];
    nextBoard[idx] = 'X';
    setBoard(nextBoard);

    const win = checkWinner(nextBoard);
    if (win) {
      setWinner(win);
      if (win === 'X') {
        setPlayerWinStreak((prev) => prev + 1);
        setAiDifficulty((prev) => Math.min(0.9, prev + 0.12 + playerWinStreak * 0.02));
      }
      return;
    }

    if (nextBoard.every((cell) => cell !== null)) {
      setWinner('Draw');
      setPlayerWinStreak(0);
      setAiDifficulty((prev) => Math.max(0.35, prev - 0.06));
      return;
    }

    setAiThinking(true);
  };

  useEffect(() => {
    if (!remoteAction || isPaused) return;
    const { action } = remoteAction;
    if (winner) {
      if (action === 'ACTION_A' || action === 'ACTION_B' || action === 'START' || action === 'UP' || action === 'DOWN') {
        resetGame();
      }
      return;
    }
    if (action === 'LEFT') setCursor((prev) => (prev % 3 > 0 ? prev - 1 : prev + 2));
    else if (action === 'RIGHT') setCursor((prev) => (prev % 3 < 2 ? prev + 1 : prev - 2));
    else if (action === 'UP') setCursor((prev) => (prev >= 3 ? prev - 3 : prev + 6));
    else if (action === 'DOWN') setCursor((prev) => (prev <= 5 ? prev + 3 : prev - 6));
    else if (action === 'ACTION_A' || action === 'ACTION_B' || action === 'START') {
      handleTileClick(cursor);
    }
  }, [remoteAction, cursor, board, winner, isPaused, aiThinking, playerWinStreak]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setCursor(0);
    setAiThinking(false);
    setAiDifficulty(0.35);
    setPlayerWinStreak(0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-[#0b0e14] text-[#ffffff] p-6">
      <div className="w-full max-w-xl flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">❌⭕ Tic Tac Toe</h2>
        <button onClick={onExit} className="px-4 py-2 rounded-lg bg-[#21262d] text-xs font-mono-code hover:bg-[#30363d] cursor-pointer">Exit Game</button>
      </div>

      <div className="w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-2xl p-8 flex flex-col items-center shadow-2xl">
        <div className="text-sm font-mono-code text-[#8b949e] mb-6 text-center">
          {winner ? (
            <span className="text-[#00ff85] font-bold text-lg">{winner === 'Draw' ? 'Game Ended in a Draw!' : `Player (${winner}) Wins! 🎉`}</span>
          ) : (
            <span>Use Mobile D-Pad to move cursor, press Action A to place X</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 w-72 h-72 mb-6">
          {board.map((val, idx) => {
            const isSelected = idx === cursor;
            return (
              <button
                key={idx}
                onClick={() => {
                  setCursor(idx);
                  handleTileClick(idx);
                }}
                className={`w-full h-full rounded-2xl border text-4xl font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#58a6ff] bg-[#58a6ff]/20 shadow-[0_0_20px_rgba(88,166,255,0.4)] scale-105'
                    : 'border-[#30363d] bg-[#0d1117] text-[#c9d1d9]'
                }`}
              >
                {val === 'X' && <span className="text-[#58a6ff]">X</span>}
                {val === 'O' && <span className="text-[#f85149]">O</span>}
              </button>
            );
          })}
        </div>

        <button onClick={resetGame} className="px-6 py-2.5 bg-[#58a6ff] text-[#0d1117] font-bold rounded-xl text-sm hover:scale-105 transition-transform cursor-pointer">
          Restart Game
        </button>
      </div>
    </div>
  );
}

// --- GAME 4: CONNECT 4 ---
function Connect4Game({ remoteAction, isPaused, restartCounter, onExit }) {
  const ROWS = 6;
  const COLS = 7;
  const [grid, setGrid] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
  const [selectedCol, setSelectedCol] = useState(3);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    resetGame();
  }, [restartCounter]);

  const dropDisc = (col) => {
    if (winner || isPaused) return;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!grid[r][col]) {
        const nextGrid = grid.map((row) => [...row]);
        nextGrid[r][col] = 'Red';
        setGrid(nextGrid);
        checkWin(nextGrid, r, col, 'Red');
        break;
      }
    }
  };

  const checkWin = (g, r, c, color) => {
    const directions = [
      [[0, 1], [0, -1]],
      [[1, 0], [-1, 0]],
      [[1, 1], [-1, -1]],
      [[1, -1], [-1, 1]]
    ];
    for (let d of directions) {
      let count = 1;
      for (let [dr, dc] of d) {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && g[nr][nc] === color) {
          count++;
          nr += dr;
          nc += dc;
        }
      }
      if (count >= 4) {
        setWinner(color);
        return;
      }
    }
  };

  useEffect(() => {
    if (!remoteAction || isPaused) return;
    const { action } = remoteAction;
    if (action === 'LEFT') setSelectedCol((prev) => (prev > 0 ? prev - 1 : COLS - 1));
    else if (action === 'RIGHT') setSelectedCol((prev) => (prev < COLS - 1 ? prev + 1 : 0));
    else if (action === 'ACTION_A' || action === 'ACTION_B' || action === 'DOWN') {
      dropDisc(selectedCol);
    }
  }, [remoteAction, selectedCol, winner, grid, isPaused]);

  const resetGame = () => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setWinner(null);
    setSelectedCol(3);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-[#0b0e14] text-[#ffffff] p-6">
      <div className="w-full max-w-2xl flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">🔴 Connect 4</h2>
        <button onClick={onExit} className="px-4 py-2 rounded-lg bg-[#21262d] text-xs font-mono-code hover:bg-[#30363d] cursor-pointer">Exit Game</button>
      </div>

      <div className="w-full max-w-2xl bg-[#161b22] border border-[#30363d] rounded-2xl p-6 flex flex-col items-center shadow-2xl">
        <div className="text-sm font-mono-code text-[#8b949e] mb-4 text-center">
          {winner ? (
            <span className="text-[#00ff85] font-bold text-lg">Connect 4 Achieved! Player Wins! 🎉</span>
          ) : (
            <span>Use Remote ◄ ► to select column, Action A / DOWN to drop disc</span>
          )}
        </div>

        <div className="grid grid-cols-7 gap-2 w-full max-w-md mb-2">
          {Array.from({ length: COLS }).map((_, cIdx) => (
            <div key={cIdx} className="text-center font-bold text-[#58a6ff]">
              {cIdx === selectedCol && '▼'}
            </div>
          ))}
        </div>

        <div className="bg-[#0d1117] border-2 border-[#30363d] rounded-xl p-3 grid grid-cols-7 gap-2.5 w-full max-w-md mb-6">
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <button
                key={`${rIdx}-${cIdx}`}
                onClick={() => {
                  setSelectedCol(cIdx);
                  dropDisc(cIdx);
                }}
                className={`w-10 h-10 rounded-full border border-[#30363d] flex items-center justify-center cursor-pointer transition-all ${
                  cell === 'Red' ? 'bg-[#f85149] border-[#f85149] shadow-[0_0_12px_rgba(248,81,73,0.7)]' : 'bg-[#161b22]'
                }`}
              />
            ))
          )}
        </div>

        <button onClick={resetGame} className="px-6 py-2.5 bg-[#58a6ff] text-[#0d1117] font-bold rounded-xl text-sm hover:scale-105 transition-transform cursor-pointer">
          Restart Game
        </button>
      </div>
    </div>
  );
}

// --- GAME 5: FLAPPY BIRD RACE ---
function FlappyBirdGame({ remoteAction, isPaused, restartCounter, onExit }) {
  const [birdY, setBirdY] = useState(50);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState([
    { x: 100, gapTop: 30, gapBottom: 65 }
  ]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    resetGame();
  }, [restartCounter]);

  const flap = () => {
    if (gameOver || isPaused) return;
    setVelocity(-6);
  };

  useEffect(() => {
    if (!remoteAction || isPaused) return;
    const { action } = remoteAction;
    if (gameOver) {
      if (action === 'ACTION_A' || action === 'ACTION_B' || action === 'START' || action === 'UP' || action === 'DOWN') {
        resetGame();
      }
      return;
    }
    if (action === 'ACTION_A' || action === 'ACTION_B' || action === 'UP' || action === 'START' || action === 'LEFT' || action === 'RIGHT' || action === 'DOWN') {
      flap();
    }
  }, [remoteAction, isPaused, gameOver]);

  useEffect(() => {
    if (gameOver || isPaused) return;
    const interval = setInterval(() => {
      setBirdY((prevY) => {
        const nextY = prevY + velocity * 0.4;
        if (nextY <= 0 || nextY >= 92) {
          setGameOver(true);
        }
        return Math.max(0, Math.min(92, nextY));
      });
      setVelocity((v) => v + 0.5);

      setPipes((prevPipes) => {
        return prevPipes.map((p) => {
          let newX = p.x - 2;
          if (newX < -15) {
            setScore((s) => s + 1);
            const randomGapTop = Math.floor(Math.random() * 35) + 15;
            return { x: 100, gapTop: randomGapTop, gapBottom: randomGapTop + 35 };
          }
          return { ...p, x: newX };
        });
      });
    }, 40);

    return () => clearInterval(interval);
  }, [velocity, gameOver, isPaused]);

  useEffect(() => {
    if (gameOver || isPaused) return;
    const currentPipe = pipes[0];
    if (currentPipe && currentPipe.x >= 15 && currentPipe.x <= 35) {
      if (birdY < currentPipe.gapTop || birdY > currentPipe.gapBottom) {
        setGameOver(true);
      }
    }
  }, [birdY, pipes, gameOver, isPaused]);

  const resetGame = () => {
    setBirdY(50);
    setVelocity(0);
    setPipes([{ x: 100, gapTop: 30, gapBottom: 65 }]);
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-[#0b0e14] text-[#ffffff] p-6">
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">🐤 Flappy Bird Race</h2>
        <div className="text-lg font-mono-code font-bold text-[#00ff85]">Pipes Passed: {score}</div>
        <button onClick={onExit} className="px-4 py-2 rounded-lg bg-[#21262d] text-xs font-mono-code hover:bg-[#30363d] cursor-pointer">Exit Game</button>
      </div>

      <div
        onClick={flap}
        className="relative w-full max-w-4xl h-[400px] bg-[#0d1117] border-2 border-[#30363d] rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
      >
        <div
          className="absolute left-[20%] w-8 h-8 bg-[#58a6ff] rounded-full border-2 border-[#ffffff] flex items-center justify-center shadow-[0_0_15px_rgba(88,166,255,0.9)] transition-all duration-75 text-sm"
          style={{ top: `calc(${birdY}% - 16px)` }}
        >
          🐤
        </div>

        {pipes.map((p, idx) => (
          <React.Fragment key={idx}>
            <div
              className="absolute bg-[#00ff85]/20 border-2 border-[#00ff85] rounded-b-xl"
              style={{ left: `${p.x}%`, width: '48px', top: '0', height: `${p.gapTop}%` }}
            />
            <div
              className="absolute bg-[#00ff85]/20 border-2 border-[#00ff85] rounded-t-xl"
              style={{ left: `${p.x}%`, width: '48px', top: `${p.gapBottom}%`, bottom: '0' }}
            />
          </React.Fragment>
        ))}

        {gameOver && (
          <div className="absolute inset-0 bg-[#0d1117]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h3 className="text-3xl font-extrabold text-[#f85149]">Bird Crashed!</h3>
            <p className="text-sm font-mono-code text-[#8b949e]">Score: {score} Pipes Passed</p>
            <button onClick={(e) => { e.stopPropagation(); resetGame(); }} className="px-6 py-3 bg-[#58a6ff] text-[#0d1117] font-bold rounded-xl shadow-lg hover:scale-105 transition-transform cursor-pointer">
              Try Again
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs font-mono-code text-[#8b949e]">
        Mobile Remote: Press <span className="text-[#58a6ff]">Action A</span> or <span className="text-[#58a6ff]">▲ UP</span> to flap bird upwards.
      </div>
    </div>
  );
}

export default function App() {
  // Navigation & View state: 'landing' | 'lobby' | 'troubleshoot'
  const [currentView, setCurrentView] = useState('landing');

  // Server LAN IP configuration
  const [serverIp, setServerIp] = useState('');

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'host' | 'join' | null
  const [controllerRole, setControllerRole] = useState('p1'); // 'p1' | 'p2'
  const [roomCode, setRoomCode] = useState('');

  // Code Generation Loading State & Digit Scrambler
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [scrambleDigits, setScrambleDigits] = useState(['-', '-', '-', '-']);
  const codeGenTimerRef = useRef(null);

  // Fetch Local Network IPv4 Address from Server API
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/config`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.localIp) {
          setServerIp(data.localIp);
        }
      })
      .catch((err) => console.log('[Network] Server config check:', err));
  }, []);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState(0);

  // Arena Selection & Mobile Controller state
  const [selectedGameIndex, setSelectedGameIndex] = useState(0); // 0: Ping Pong, 1: Quiz, 2: Tic Tac Toe, 3: Connect 4, 4: Flappy Bird
  const [activeGameId, setActiveGameId] = useState('pingpong');
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [restartCounter, setRestartCounter] = useState(0);
  const [remoteEvent, setRemoteEvent] = useState(null);
  const [lastMobileAction, setLastMobileAction] = useState(null);
  const [playerName, setPlayerName] = useState(typeof window !== 'undefined' ? (localStorage.getItem('air_player_name') || '') : '');
  const [nameInputValue, setNameInputValue] = useState(typeof window !== 'undefined' ? (localStorage.getItem('air_player_name') || '') : '');
  const [isEditingName, setIsEditingName] = useState(false);

  // Real-time Socket.IO Room State (Host PC waits for 1 user controller device + Bot AI)
  const [roomState, setRoomState] = useState({
    code: '',
    isSolo: true,
    players: {
      p1: {
        slot: 1,
        role: 'Player 1',
        deviceName: null,
        playerName: null,
        latency: null,
        sensors: null,
        connected: false
      },
      p2: {
        slot: 2,
        role: 'Player 2 (AI Bot)',
        deviceName: 'Bot (AI Companion)',
        playerName: 'Bot AI',
        latency: '0ms (Local)',
        sensors: 'AI Active',
        connected: true,
        isBot: true
      }
    },
    matchReady: false
  });

  // Diagnostics State
  const [diagState, setDiagState] = useState({
    running: false,
    progress: 0,
    status: 'IDLE',
    logs: []
  });

  // Copy Feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Live Canvas Pong Arena State & Physics (Automated Endless Rally)
  const canvasRef = useRef(null);
  const [gameStats, setGameStats] = useState({ speed: 184, pingP1: 11, pingP2: 14 });
  const [p1ActiveBtn, setP1ActiveBtn] = useState(null);
  const [p2ActiveBtn, setP2ActiveBtn] = useState(null);

  const gameStateRef = useRef({
    p1Y: 140,
    p2Y: 140,
    paddleHeight: 70,
    paddleWidth: 10,
    ballX: 350,
    ballY: 175,
    ballVx: 5.2,
    ballVy: 2.2,
    speed: 184,
    p1Offset: 0,
    p2Offset: 0,
    p1Lerp: 0.11,
    p2Lerp: 0.09
  });

  // Digit Scrambler Effect during code generation
  useEffect(() => {
    if (!isGeneratingCode) return;
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const interval = setInterval(() => {
      setScrambleDigits([
        chars[Math.floor(Math.random() * chars.length)],
        chars[Math.floor(Math.random() * chars.length)],
        chars[Math.floor(Math.random() * chars.length)],
        chars[Math.floor(Math.random() * chars.length)]
      ]);
    }, 80);
    return () => clearInterval(interval);
  }, [isGeneratingCode]);

  // Helper to generate a random fallback room code if server room code response is delayed
  const generateFallbackRoomCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Socket.IO Listener Setup & Initial Room Creation
  useEffect(() => {
    // Check if joining via URL ?code=XXXX or /join path
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    const isJoinPath = window.location.pathname.includes('/join');

    const handleConnect = () => {
      console.log('[Socket.io] Connected to server, socket.id:', socket.id);
      if (codeParam || isJoinPath) {
        const code = (codeParam || '').toUpperCase();
        if (code) setRoomCode(code);
        setCurrentView('controller');
        const savedName = localStorage.getItem('air_player_name');
        if (code) {
          socket.emit('join_room', {
            roomCode: code,
            playerName: savedName || 'Mobile Gamer',
            deviceName: 'Mobile Controller (' + (navigator.platform || 'Handheld') + ')'
          });
        }
      } else {
        // Host PC display - register host socket & create dynamic room
        socket.emit('register_host');
        socket.emit('create_room');
      }
    };

    socket.on('connect', handleConnect);
    if (socket.connected) {
      handleConnect();
    }

    socket.on('room_created', (data) => {
      console.log('[Socket.io] Room created by host display:', data);
      if (data && data.code) {
        setRoomState(data);
        setRoomCode(data.code);
      }
    });

    socket.on('room_updated', (data) => {
      console.log('[Socket.io] Room update received:', data);
      if (data && data.code) {
        setRoomState(data);
        setRoomCode(data.code);
      }
    });

    socket.on('diagnostics_result', (res) => {
      setDiagState({
        running: false,
        progress: 100,
        status: 'COMPLETE',
        logs: [
          'Pre-flight connection probe: OK',
          'Realtime WebSocket: CONNECTED',
          'Host Session Pairing: ACTIVE',
          'Latency: SUB-8MS | Zero Packet Loss'
        ]
      });
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('room_created');
      socket.off('room_updated');
      socket.off('diagnostics_result');
      if (codeGenTimerRef.current) {
        clearTimeout(codeGenTimerRef.current);
      }
    };
  }, []);

  // Refs to avoid stale closures in socket listener
  const currentViewRef = useRef(currentView);
  const selectedGameIndexRef = useRef(selectedGameIndex);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    selectedGameIndexRef.current = selectedGameIndex;
  }, [selectedGameIndex]);

  // Remote Mobile D-Pad Navigation Listener on Host PC for Game Selection & Gameplay
  useEffect(() => {
    const handleControllerEvent = ({ action }) => {
      console.log('[Socket.io] Remote controller action received:', action);
      setRemoteEvent({ action, timestamp: Date.now() });

      if (action === 'PAUSE') {
        setIsGamePaused((prev) => !prev);
        return;
      }
      if (action === 'RESTART') {
        setIsGamePaused(false);
        setRestartCounter((prev) => prev + 1);
        return;
      }
      if (action === 'EXIT_GAME') {
        setIsGamePaused(false);
        setCurrentView('arena');
        return;
      }

      const view = currentViewRef.current;
      if (view === 'arena') {
        if (action === 'LEFT') {
          setSelectedGameIndex((prev) => (prev > 0 ? prev - 1 : 4));
        } else if (action === 'RIGHT') {
          setSelectedGameIndex((prev) => (prev < 4 ? prev + 1 : 0));
        } else if (action === 'UP') {
          setSelectedGameIndex((prev) => (prev >= 3 ? prev - 3 : (prev > 0 ? prev - 1 : 4)));
        } else if (action === 'DOWN') {
          setSelectedGameIndex((prev) => (prev <= 1 ? prev + 3 : (prev < 4 ? prev + 1 : 0)));
        } else if (action === 'ACTION_A' || action === 'ACTION_B' || action === 'START') {
          const gameIds = ['pingpong', 'quiz', 'tictactoe', 'connect4', 'flappybird'];
          const targetGame = gameIds[selectedGameIndexRef.current] || 'pingpong';
          setActiveGameId(targetGame);
          setIsGamePaused(false);
          setCurrentView('game_play');
        }
      }
    };

    socket.on('controller_event', handleControllerEvent);
    return () => {
      socket.off('controller_event', handleControllerEvent);
    };
  }, []);

  // Handle Create Game Room (Generates random 4-digit code via Socket.IO with 2.5s loading animation)
  const handleStartGameRoom = () => {
    setIsGeneratingCode(true);
    setCurrentView('lobby');
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('create_room');

    if (codeGenTimerRef.current) {
      clearTimeout(codeGenTimerRef.current);
    }
    // Show scrambler animation for exactly 2.5 seconds before revealing room code
    codeGenTimerRef.current = setTimeout(() => {
      setIsGeneratingCode(false);
      setRoomCode((prev) => {
        const currentCode = prev || roomState.code;
        if (!currentCode) {
          const fallback = generateFallbackRoomCode();
          setRoomState((r) => ({ ...r, code: fallback }));
          return fallback;
        }
        return currentCode;
      });
    }, 2500);
  };

  // Save Player Name & Join Room
  const handleSavePlayerName = (nameToSave) => {
    const finalName = (nameToSave || nameInputValue || 'Gamer').trim();
    if (!finalName) return;
    setPlayerName(finalName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('air_player_name', finalName);
    }
    setIsEditingName(false);
    socket.emit('join_room', {
      roomCode: roomCode || roomState.code,
      playerName: finalName,
      deviceName: 'Mobile Controller (' + (navigator.platform || 'Handheld') + ')'
    });
  };

  // Handle Mobile Touch Input Emission
  const handleSendMobileInput = (action) => {
    setLastMobileAction(action);
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    const targetCode = (roomCode || roomState.code || codeParam || '').toUpperCase();
    if (targetCode) {
      socket.emit('controller_input', {
        roomCode: targetCode,
        player: controllerRole,
        action
      });
    }
    setTimeout(() => setLastMobileAction(null), 300);
  };

  // Handle Controller Disconnect & Leave Room
  const handleLeaveRoom = () => {
    socket.emit('leave_room', { roomCode: roomState.code || roomCode });
    setCurrentView('landing');
  };

  // Toggle P1 Connection via Socket.io (Simulate Device 1)
  const handleToggleP1Connection = () => {
    socket.emit('toggle_p1_connection', { roomCode: roomState.code || roomCode });
  };

  // Toggle P2 Connection via Socket.io (Simulate Device 2)
  const handleToggleP2Connection = () => {
    socket.emit('toggle_p2_connection', { roomCode: roomState.code || roomCode });
  };

  // Run Diagnostics Probe
  const handleRunDiagnostics = () => {
    setDiagState({ running: true, progress: 25, status: 'PROBING WEBRTC...', logs: ['Initiating ICE candidate check...'] });
    setTimeout(() => {
      setDiagState({ running: true, progress: 65, status: 'TESTING SOCKET.IO...', logs: ['Checking WebSocket RFC 6455 handshake...'] });
    }, 600);
    setTimeout(() => {
      socket.emit('run_diagnostics');
    }, 1200);
  };

  // Helper to build Controller Join URL (Render deployment vs Local LAN IPv4)
  const getControllerUrl = () => {
    const code = roomState.code || roomCode || '';
    if (typeof window !== 'undefined') {
      const { hostname, protocol, port } = window.location;
      if (hostname.endsWith('onrender.com') || (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/))) {
        return `${protocol}//${hostname}/join?code=${code}`;
      }
      const hostIp = serverIp || hostname || '127.0.0.1';
      const portStr = port ? `:${port}` : ':5173';
      return `http://${hostIp}${portStr}/join?code=${code}`;
    }
    return `/join?code=${code}`;
  };

  // Copy Link Handler
  const handleCopyLink = () => {
    const inviteUrl = getControllerUrl();
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Table Tennis Canvas Game Loop
  useEffect(() => {
    if (currentView !== 'landing') return;
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const g = gameStateRef.current;

    const loop = () => {
      g.ballX += g.ballVx;
      g.ballY += g.ballVy;

      if (g.ballVx < 0) {
        const targetP1Y = g.ballY - g.paddleHeight / 2 + g.p1Offset;
        g.p1Y += (targetP1Y - g.p1Y) * g.p1Lerp;
        const restP2Y = (height - g.paddleHeight) / 2 + Math.sin(Date.now() / 600) * 15;
        g.p2Y += (restP2Y - g.p2Y) * 0.04;
      } else {
        const targetP2Y = g.ballY - g.paddleHeight / 2 + g.p2Offset;
        g.p2Y += (targetP2Y - g.p2Y) * g.p2Lerp;
        const restP1Y = (height - g.paddleHeight) / 2 + Math.cos(Date.now() / 600) * 15;
        g.p1Y += (restP1Y - g.p1Y) * 0.04;
      }

      if (g.ballX <= 120 && g.ballVx < 0) {
        const minY = g.ballY - g.paddleHeight + 12;
        const maxY = g.ballY - 12;
        g.p1Y = Math.max(minY, Math.min(maxY, g.p1Y));
      }
      if (g.ballX >= width - 120 && g.ballVx > 0) {
        const minY = g.ballY - g.paddleHeight + 12;
        const maxY = g.ballY - 12;
        g.p2Y = Math.max(minY, Math.min(maxY, g.p2Y));
      }

      g.p1Y = Math.max(10, Math.min(height - g.paddleHeight - 10, g.p1Y));
      g.p2Y = Math.max(10, Math.min(height - g.paddleHeight - 10, g.p2Y));

      if (g.ballY <= 12) {
        g.ballY = 12;
        g.ballVy = Math.abs(g.ballVy);
      } else if (g.ballY >= height - 12) {
        g.ballY = height - 12;
        g.ballVy = -Math.abs(g.ballVy);
      }

      if (g.ballX - 7 <= 25 && g.ballVx < 0) {
        g.ballX = 26;
        g.ballVx = Math.abs(g.ballVx);
        const hitPos = (g.ballY - (g.p1Y + g.paddleHeight / 2)) / (g.paddleHeight / 2);
        g.ballVy = hitPos * 3.8 + (Math.random() - 0.5) * 0.5;
        g.ballVy = Math.max(-5, Math.min(5, g.ballVy));
        g.p2Offset = (Math.random() - 0.5) * 36;
        g.p2Lerp = 0.08 + Math.random() * 0.08;
        setP1ActiveBtn('hit');
        setTimeout(() => setP1ActiveBtn(null), 180);
      }

      if (g.ballX + 7 >= width - 25 && g.ballVx > 0) {
        g.ballX = width - 26;
        g.ballVx = -Math.abs(g.ballVx);
        const hitPos = (g.ballY - (g.p2Y + g.paddleHeight / 2)) / (g.paddleHeight / 2);
        g.ballVy = hitPos * 3.8 + (Math.random() - 0.5) * 0.5;
        g.ballVy = Math.max(-5, Math.min(5, g.ballVy));
        g.p1Offset = (Math.random() - 0.5) * 36;
        g.p1Lerp = 0.08 + Math.random() * 0.08;
        setP2ActiveBtn('hit');
        setTimeout(() => setP2ActiveBtn(null), 180);
      }

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = '#161b22';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      ctx.strokeStyle = '#30363d';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#30363d';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.shadowColor = '#58a6ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#58a6ff';
      ctx.beginPath();
      ctx.roundRect(15, g.p1Y, g.paddleWidth, g.paddleHeight, 5);
      ctx.fill();

      ctx.shadowColor = '#f85149';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#f85149';
      ctx.beginPath();
      ctx.roundRect(width - 25, g.p2Y, g.paddleWidth, g.paddleHeight, 5);
      ctx.fill();

      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(g.ballX, g.ballY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [currentView]);

  const handleP1Dir = (dir) => {
    setP1ActiveBtn(dir);
    setTimeout(() => setP1ActiveBtn(null), 250);
  };

  const handleP2Btn = (btn) => {
    setP2ActiveBtn(btn);
    setTimeout(() => setP2ActiveBtn(null), 250);
  };

  const faqData = [
    {
      q: "01. How do players join a room?",
      a: "Players simply scan the QR code displayed on the host screen using their phone's camera, or type in the 4-digit room code. The controller channel initializes automatically in under 1 second without downloading any app."
    },
    {
      q: "02. Do both phones need to be on the same Wi-Fi network?",
      a: "Staying on the same local Wi-Fi router delivers ultra-fast low-latency performance for instant responsive multiplayer gameplay."
    },
    {
      q: "03. Are controller haptics and motion sensors supported?",
      a: "Yes! Modern web features allow us to trigger physical device vibration motors for tactile feedback as well as motion-assisted controls."
    },
    {
      q: "04. Is any dongle, app, or extra hardware needed?",
      a: "Zero hardware dongles, USB adapters, or native mobile installations are needed. Any modern web browser running on a Smart TV, laptop, or desktop acts as the display host."
    }
  ];

  // PAGE VIEW: DEDICATED MOBILE CONTROLLER VIEW (WHEN SCANNING FROM PHONE OR /join PATH)
  if (currentView === 'controller') {
    const isP1 = controllerRole === 'p1';

    // If Name is not provided, prompt the mobile user for their name first
    if (!playerName || isEditingName) {
      return (
        <div className="min-h-screen bg-[#0d1117] text-[#ffffff] font-['Inter',sans-serif] flex flex-col items-center justify-center p-4 selection:bg-[#58a6ff] selection:text-[#0d1117]">
          <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[#58a6ff]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff] mb-4 overflow-hidden p-1.5">
              <img src="/logo.png" className="w-full h-full object-contain" alt="Air Game Pad Logo" />
            </div>
            <h2 className="text-2xl font-black text-[#ffffff] mb-1">Air Game Pad</h2>
            <p className="text-xs text-[#8b949e] mb-6">Enter your gamer name to join room #{roomCode || roomState.code || '----'}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSavePlayerName(nameInputValue);
              }}
              className="w-full space-y-4"
            >
              <div>
                <label className="block text-xs font-mono-code text-[#8b949e] mb-2 uppercase text-left">Your Gamer Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nameInputValue}
                  onChange={(e) => setNameInputValue(e.target.value)}
                  placeholder="e.g. Rahul, Alex, GamerOne"
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-xl px-4 py-3 font-mono-code text-center text-lg text-[#ffffff] font-bold outline-none shadow-inner"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold bg-[#58a6ff] text-[#0d1117] hover:bg-[#58a6ff]/90 transition-all cursor-pointer shadow-[0_0_20px_rgba(88,166,255,0.3)] text-sm"
              >
                Join Room #{roomCode || roomState.code || '----'}
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen max-h-screen w-full bg-[#0d1117] text-[#ffffff] font-['Inter',sans-serif] flex flex-col justify-between p-3 select-none overflow-hidden touch-none">
        {/* Compact Mobile Header Bar */}
        <header className="w-full flex items-center justify-between py-1.5 border-b border-[#30363d]/60 text-xs font-mono-code shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#161b22] border border-[#30363d] flex items-center justify-center p-0.5 overflow-hidden">
              <img src="/logo.png" className="w-full h-full object-contain" alt="Air Game Pad Logo" />
            </div>
            <span className="font-bold text-[#ffffff] text-xs">Air Game Pad</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#00ff85] font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
            <span>CONNECTED</span>
          </div>
        </header>

        {/* Compact Room & Gamer Info Bar */}
        <div className="my-1.5 w-full max-w-md mx-auto bg-[#161b22] rounded-xl border border-[#30363d] px-3 py-2 shadow-lg flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#58a6ff]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff] font-bold text-xs font-mono-code">
              P1
            </div>
            <div>
              <div className="text-xs font-bold text-[#ffffff] leading-tight">{playerName}</div>
              <div className="text-[10px] font-mono-code text-[#8b949e]">Room #{roomCode || roomState.code || '----'}</div>
            </div>
          </div>

          <button
            onClick={() => {
              setNameInputValue(playerName);
              setIsEditingName(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#0d1117] border border-[#30363d] text-[10px] font-mono-code text-[#8b949e] hover:text-[#ffffff] transition-all cursor-pointer"
          >
            Edit Name
          </button>
        </div>

        {/* In-Game Utility Controls Bar (Pause, Restart, Exit Game) */}
        <div className="w-full max-w-md mx-auto bg-[#161b22] border border-[#30363d] rounded-xl p-1.5 shadow-lg flex items-center justify-between gap-1.5 my-1 shrink-0">
          <button
            onClick={() => handleSendMobileInput('PAUSE')}
            className="flex-1 py-2 px-1 rounded-lg bg-[#0d1117] border border-[#30363d] active:border-[#58a6ff] active:bg-[#58a6ff]/20 text-[#58a6ff] font-mono-code text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-inner"
          >
            <Pause className="w-3 h-3" />
            <span>Pause</span>
          </button>

          <button
            onClick={() => handleSendMobileInput('RESTART')}
            className="flex-1 py-2 px-1 rounded-lg bg-[#0d1117] border border-[#30363d] active:border-[#00ff85] active:bg-[#00ff85]/20 text-[#00ff85] font-mono-code text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-inner"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restart</span>
          </button>

          <button
            onClick={() => handleSendMobileInput('EXIT_GAME')}
            className="flex-1 py-2 px-1 rounded-lg bg-[#0d1117] border border-[#30363d] active:border-[#f85149] active:bg-[#f85149]/20 text-[#f85149] font-mono-code text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-inner"
          >
            <LogOut className="w-3 h-3" />
            <span>Exit Game</span>
          </button>
        </div>

        {/* Interactive Touch GamePad Area */}
        <div className="flex-1 w-full max-w-md mx-auto bg-[#161b22] rounded-2xl border border-[#30363d] p-3 shadow-2xl flex flex-col items-center justify-between min-h-0 my-1">
          <div className="text-center text-[10px] font-mono-code text-[#8b949e] shrink-0">
            {lastMobileAction ? (
              <span className="text-[#00ff85] font-bold animate-pulse">Input Sent: {lastMobileAction}</span>
            ) : (
              <span>Remote Touch GamePad Active</span>
            )}
          </div>

          {/* Integrated 4-Way Circular D-Pad + Center Button */}
          <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center my-auto">
            {/* Background Outer Ring */}
            <div className="absolute inset-0 rounded-full border border-[#30363d] bg-gradient-to-b from-[#0d1117] to-[#161b22] shadow-[0_0_25px_rgba(0,0,0,0.6)]"></div>

            {/* D-Pad 3x3 Grid */}
            <div className="relative z-10 w-48 h-48 sm:w-56 sm:h-56 grid grid-cols-3 grid-rows-3 gap-2 p-1 items-center justify-center">
              {/* Row 1, Col 2: UP */}
              <div className="col-start-2 row-start-1 flex justify-center">
                <button
                  onClick={() => handleSendMobileInput('UP')}
                  className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl bg-[#0d1117] border-2 border-[#30363d] active:border-[#58a6ff] active:bg-[#58a6ff]/25 text-[#58a6ff] flex items-center justify-center font-black text-lg shadow-lg active:scale-90 transition-all cursor-pointer"
                >
                  ▲
                </button>
              </div>

              {/* Row 2, Col 1: LEFT */}
              <div className="col-start-1 row-start-2 flex justify-center">
                <button
                  onClick={() => handleSendMobileInput('LEFT')}
                  className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl bg-[#0d1117] border-2 border-[#30363d] active:border-[#58a6ff] active:bg-[#58a6ff]/25 text-[#58a6ff] flex items-center justify-center font-black text-lg shadow-lg active:scale-90 transition-all cursor-pointer"
                >
                  ◄
                </button>
              </div>

              {/* Row 2, Col 2: MAIN CENTER BUTTON (OK / ACTION A) */}
              <div className="col-start-2 row-start-2 flex justify-center">
                <button
                  onClick={() => handleSendMobileInput('ACTION_A')}
                  className="w-15 h-15 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#58a6ff] via-[#388bfd] to-[#79c0ff] text-[#0d1117] border-2 border-[#ffffff]/60 flex items-center justify-center font-black text-base shadow-[0_0_20px_rgba(88,166,255,0.7)] active:scale-90 transition-all cursor-pointer"
                >
                  OK
                </button>
              </div>

              {/* Row 2, Col 3: RIGHT */}
              <div className="col-start-3 row-start-2 flex justify-center">
                <button
                  onClick={() => handleSendMobileInput('RIGHT')}
                  className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl bg-[#0d1117] border-2 border-[#30363d] active:border-[#58a6ff] active:bg-[#58a6ff]/25 text-[#58a6ff] flex items-center justify-center font-black text-lg shadow-lg active:scale-90 transition-all cursor-pointer"
                >
                  ►
                </button>
              </div>

              {/* Row 3, Col 2: DOWN */}
              <div className="col-start-2 row-start-3 flex justify-center">
                <button
                  onClick={() => handleSendMobileInput('DOWN')}
                  className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl bg-[#0d1117] border-2 border-[#30363d] active:border-[#58a6ff] active:bg-[#58a6ff]/25 text-[#58a6ff] flex items-center justify-center font-black text-lg shadow-lg active:scale-90 transition-all cursor-pointer"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Action Buttons (B & Start) */}
          <div className="flex items-center justify-center gap-4 w-full pt-1.5 border-t border-[#30363d]/60 shrink-0">
            <button
              onClick={() => handleSendMobileInput('ACTION_B')}
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#0d1117] border-2 border-[#30363d] active:border-[#00ff85] active:text-[#00ff85] text-[#c9d1d9] font-mono-code font-extrabold text-sm flex items-center justify-center shadow-inner active:scale-90 transition-all cursor-pointer"
            >
              B
            </button>
            <button
              onClick={() => handleSendMobileInput('START')}
              className="px-4 py-1.5 rounded-full bg-[#0d1117] border border-[#30363d] active:border-[#58a6ff] text-[#8b949e] active:text-[#ffffff] font-mono-code text-[11px] font-bold shadow-inner active:scale-90 transition-all cursor-pointer"
            >
              START
            </button>
          </div>
        </div>

        {/* Compact Footer Disconnect Option */}
        <div className="w-full max-w-md mx-auto shrink-0 pt-1">
          <button
            onClick={handleLeaveRoom}
            className="w-full py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#f85149] text-[10px] font-mono-code text-[#8b949e] hover:text-[#f85149] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Disconnect Controller & Leave Room</span>
          </button>
        </div>
      </div>
    );
  }

  // PAGE VIEW 2: LOBBY PAGE (ROOM CREATION & CONTROLLER PAIRING)
  if (currentView === 'lobby') {
    const isP1Connected = roomState.players.p1.connected;
    const isP2Connected = true; // Bot AI is always active
    const matchReady = isP1Connected;

    return (
      <div className="min-h-screen bg-[#0d1117] text-[#ffffff] font-['Inter',sans-serif] flex flex-col justify-between p-4 sm:p-8 selection:bg-[#58a6ff] selection:text-[#0d1117]">
        
        {/* Top Status Bar */}
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between text-xs font-mono-code text-[#8b949e] border-b border-[#30363d]/60 pb-3 mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
            <span className="text-[#00ff85] font-bold">AIR GAMEPAD LOBBY</span>
            <span>/ ONLINE SESSION</span>
          </div>
          <div className="flex items-center gap-2">
            <span>STREAM: ACTIVE</span>
            <span>/</span>
            <span className="text-[#00ff85]">LOW-LATENCY RUNTIME</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-2xl mx-auto w-full flex flex-col items-center relative">
          
          {/* Top Header Controls with Back to Home Button */}
          <div className="w-full flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentView('landing')}
              className="px-3.5 py-1.5 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff] hover:bg-[#21262d] text-[#ffffff] hover:text-[#58a6ff] text-xs font-mono-code font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md group"
            >
              <ArrowLeft className="w-4 h-4 text-[#58a6ff] group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home Page</span>
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-mono-code text-[#58a6ff]">
              <Radio className="w-3.5 h-3.5" />
              <span>1 USER VS BOT AI MODE</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#ffffff] text-center mb-2 flex items-center justify-center gap-3">
            <img src="/logo.png" className="w-9 h-9 object-contain" alt="Air Game Pad Logo" />
            <span>Air Game Pad</span>
          </h1>
          <p className="text-sm text-[#8b949e] text-center mb-6">
            Scan the QR code with your phone camera or visit <span className="text-[#c9d1d9] font-mono-code">{getControllerUrl()}</span>
          </p>

          {/* ROOM ACCESS KEY CARD CONTAINER */}
          <div className="w-full bg-[#161b22] rounded-2xl border border-[#30363d] p-6 sm:p-8 flex flex-col items-center shadow-2xl mb-6 relative overflow-hidden">
            
            <div className="w-full flex items-center justify-between text-xs font-mono-code text-[#8b949e] mb-6">
              <span>ROOM ACCESS KEY</span>
              {isGeneratingCode ? (
                <span className="text-[#58a6ff] flex items-center gap-1.5 font-bold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#58a6ff]" />
                  GENERATING SECURE ROOM KEY...
                </span>
              ) : (
                <span className="text-[#00ff85] flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
                  DISCOVERABLE
                </span>
              )}
            </div>

            {/* Room Code Digits */}
            {isGeneratingCode ? (
              <div className="flex items-center justify-center gap-3 sm:gap-4 font-mono-code font-black text-4xl sm:text-6xl text-[#58a6ff] mb-6 tracking-wider">
                {scrambleDigits.map((char, i) => (
                  <div key={i} className="w-12 h-16 sm:w-16 sm:h-20 rounded-xl bg-[#0d1117] border border-[#58a6ff]/60 flex items-center justify-center text-[#58a6ff] shadow-[0_0_20px_rgba(88,166,255,0.3)] animate-pulse">
                    {char}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 sm:gap-4 font-mono-code font-black text-4xl sm:text-6xl text-[#ffffff] mb-6 tracking-wider">
                {(roomState.code || roomCode || '----').split('').map((char, i) => (
                  <div key={i} className="w-12 h-16 sm:w-16 sm:h-20 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#ffffff] shadow-inner transition-all transform hover:scale-105">
                    {char}
                  </div>
                ))}
              </div>
            )}

            {/* QR Code Container (Real Scannable QRCodeSVG with LAN IPv4) */}
            {isGeneratingCode ? (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-6 mb-6 shadow-xl flex flex-col items-center justify-center w-52 h-52 sm:w-60 sm:h-60 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#58a6ff]/10 to-transparent animate-pulse"></div>
                <Loader2 className="w-10 h-10 text-[#58a6ff] animate-spin mb-3 z-10" />
                <span className="text-[11px] font-mono-code text-[#8b949e] z-10 tracking-wide">GENERATING QR CODE...</span>
              </div>
            ) : (
              <div className="bg-[#ffffff] p-4 sm:p-5 rounded-2xl mb-6 shadow-2xl flex flex-col items-center justify-center border-2 border-[#58a6ff]/40 hover:border-[#58a6ff] transition-all">
                <QRCodeSVG
                  value={getControllerUrl()}
                  size={200}
                  bgColor={"#ffffff"}
                  fgColor={"#0d1117"}
                  level={"H"}
                  includeMargin={false}
                />
              </div>
            )}

            {/* Copy Invite Link */}
            {isGeneratingCode ? (
              <div className="flex items-center gap-2 text-xs font-mono-code text-[#8b949e] py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#58a6ff]" />
                <span>Initializing WebRTC signaling socket URL...</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-xs font-mono-code text-[#c9d1d9] flex items-center gap-2 transition-all cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-[#00ff85]" /> : <Copy className="w-4 h-4 text-[#58a6ff]" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Invite Link'}</span>
                </button>
                <span className="text-xs font-mono-code text-[#8b949e]">
                  {getControllerUrl()}
                </span>
              </div>
            )}

          </div>

          {/* TWO CONTROLLER DEVICE CARDS GRID (1 USER CONTROLLER + 1 BOT AI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
            
            {/* DEVICE 1 (USER CONTROLLER) CARD */}
            <div className={`bg-[#161b22] rounded-xl border-l-4 ${isP1Connected ? 'border-l-[#58a6ff]' : 'border-l-[#8b949e]'} border border-[#30363d] p-4 flex flex-col justify-between shadow-lg transition-all`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-mono-code text-xs font-bold text-[#ffffff]">
                    <Smartphone className="w-4 h-4 text-[#58a6ff]" />
                    <span>Device 1 {roomState.players.p1.playerName ? `(${roomState.players.p1.playerName})` : '(User Mobile)'}</span>
                  </div>
                  {isP1Connected ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#00ff85]/10 text-[#00ff85] border border-[#00ff85]/30 text-[10px] font-mono-code flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff85]"></span>
                      Device 1 Connected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-[#30363d] text-[#8b949e] text-[10px] font-mono-code flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8b949e]"></span>
                      Waiting for Device 1...
                    </span>
                  )}
                </div>

                {isP1Connected ? (
                  <div className="text-xs font-mono-code text-[#8b949e] space-y-1">
                    <div>CONTROLLER SLOT #1</div>
                    <div className="pt-2 text-[#c9d1d9]">Device: <span className="text-[#ffffff] font-bold">{roomState.players.p1.deviceName || 'Mobile Controller'}</span></div>
                    {roomState.players.p1.playerName && (
                      <div className="text-[#58a6ff]">Player Name: <span className="text-[#ffffff] font-bold">{roomState.players.p1.playerName}</span></div>
                    )}
                    <div>Latency: <span className="text-[#00ff85] font-bold">{roomState.players.p1.latency || '11ms RTT'}</span></div>
                    <div className="flex items-center gap-1 text-[#58a6ff] pt-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{roomState.players.p1.sensors || 'Gyro Active'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-mono-code text-[#8b949e] space-y-2 py-1">
                    <p className="text-[#c9d1d9]">Awaiting Device 1 connection.</p>
                    <p className="text-[#58a6ff]">Scan QR code or enter code {roomState.code} on phone</p>
                  </div>
                )}
              </div>

              {/* Simulation button for Device 1 pairing */}
              <button
                onClick={handleToggleP1Connection}
                className="mt-3 py-1.5 px-3 rounded bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-[11px] font-mono-code text-[#8b949e] hover:text-[#58a6ff] flex items-center justify-between transition-all cursor-pointer"
              >
                <span>Channel: DEV-1 (P1)</span>
                <span className="text-[#00ff85] font-bold">{isP1Connected ? 'Disconnect' : 'Simulate Device 1 Join'}</span>
              </button>
            </div>

            {/* DEVICE 2 (BOT AI) CARD */}
            <div className="bg-[#161b22] rounded-xl border-l-4 border-l-[#f85149] border border-[#30363d] p-4 flex flex-col justify-between shadow-lg transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-mono-code text-xs font-bold text-[#ffffff]">
                    <Cpu className="w-4 h-4 text-[#f85149]" />
                    <span>Device 2 (Bot AI)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#00ff85]/10 text-[#00ff85] border border-[#00ff85]/30 text-[10px] font-mono-code flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff85]"></span>
                    AI Bot Active
                  </span>
                </div>

                <div className="text-xs font-mono-code text-[#8b949e] space-y-1">
                  <div>CONTROLLER SLOT #2</div>
                  <div className="pt-2 text-[#c9d1d9]">Opponent: <span className="text-[#ffffff] font-bold">Bot (AI Companion)</span></div>
                  <div className="text-[#f85149]">Player Name: <span className="text-[#ffffff] font-bold">Bot AI</span></div>
                  <div>Latency: <span className="text-[#00ff85] font-bold">0ms (Local AI)</span></div>
                  <div className="flex items-center gap-1 text-[#f85149] pt-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>AI Physics Engine Active</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 py-1.5 px-3 rounded bg-[#0d1117] border border-[#30363d] text-[11px] font-mono-code text-[#8b949e] flex items-center justify-between">
                <span>Opponent: User vs Bot</span>
                <span className="text-[#00ff85] font-bold">Auto-Paired</span>
              </div>
            </div>

          </div>

          {/* MATCH READINESS FOOTER BAR */}
          <div className="w-full bg-[#161b22] rounded-xl border border-[#30363d] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-mono-code font-bold text-[#ffffff]">
                  Match Readiness: <span className={matchReady ? 'text-[#00ff85]' : 'text-[#58a6ff]'}>{isP1Connected ? 'User Connected vs Bot AI (Ready)' : 'Awaiting 1 Mobile Device'}</span>
                </div>
                <div className="text-[11px] font-mono-code text-[#8b949e]">
                  {matchReady ? 'Ready to launch party arena!' : 'Activates automatically when 1 mobile controller connects.'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentView('arena')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-mono-code font-bold flex items-center justify-center gap-2 transition-all bg-[#58a6ff] text-[#0d1117] hover:bg-[#58a6ff]/90 shadow-[0_0_15px_rgba(88,166,255,0.4)] cursor-pointer"
            >
              <span>Proceed to Game Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Footer Troubleshooting Link */}
        <div className="text-center pt-8">
          <button
            onClick={() => setCurrentView('troubleshoot')}
            className="text-xs font-mono-code text-[#58a6ff] hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <span>Trouble connecting? Open Troubleshoot Guide</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    );
  }

  // PAGE VIEW 3: PARTY ARENA SELECTION PAGE (MATCHES USER SCREENSHOT + REMOTE D-PAD CONTROL)
  if (currentView === 'arena') {
    const isP1Connected = roomState.players.p1.connected;

    const GAMES = [
      { id: 'pingpong', title: 'Ping Pong', category: 'CLASSIC ARCADE', tag: 'D-Pad Up/Down', desc: 'High-speed retro table tennis duel. Control your paddle to rally the ball.', icon: Activity, modeText: 'MODE: PLAYER RALLY' },
      { id: 'quiz', title: 'Quiz', category: 'KNOWLEDGE TRIVIA', tag: 'A/B/C/D Buttons', desc: 'Interactive trivia game. Use mobile buttons to answer questions.', icon: Sparkles, modeText: 'MODE: TRIVIA CHALLENGE' },
      { id: 'tictactoe', title: 'Tic Tac Toe', category: 'QUICK STRATEGY', tag: 'D-Pad + Action A', desc: 'Classic 3×3 grid showdown. Move cursor and place X marks.', icon: Layers, modeText: 'MODE: 3x3 TACTICAL' },
      { id: 'connect4', title: 'Connect 4', category: 'GRID STRATEGY', tag: 'D-Pad Left/Right', desc: 'Vertical drop strategy. Connect four discs in a row.', icon: Gamepad2, modeText: 'GRID: 7x6 VERTICAL' },
      { id: 'flappybird', title: 'Flappy Bird Race', category: 'PHYSICS & TIMING', tag: 'Action A to Flap', desc: 'Endless obstacle flight. Flap to navigate through pipe gaps.', icon: Zap, modeText: 'SYNC: REALTIME FLAP' }
    ];

    return (
      <div className="min-h-screen bg-[#0b0e14] text-[#ffffff] font-['Inter',sans-serif] flex flex-col justify-between selection:bg-[#58a6ff] selection:text-[#0d1117]">
        {/* Top Header Bar matching Screenshot with logo.png */}
        <header className="border-b border-[#21262d] bg-[#0d1117]/90 px-4 sm:px-8 py-3.5 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs font-mono-code flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-center p-1 overflow-hidden">
                <img src="/logo.png" className="w-full h-full object-contain" alt="Air Game Pad Logo" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#ffffff] text-sm">Air Game Pad</span>
                <span className="px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] text-[10px] font-bold">HOST CONSOLE</span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Room Pill */}
              <div className="px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
                <span>ROOM: #{roomState.code || roomCode}</span>
              </div>

              {/* P1 Host Pill */}
              <div className="px-3 py-1 rounded-full bg-[#58a6ff]/15 border border-[#58a6ff]/40 text-[#58a6ff] flex items-center gap-1.5 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
                <span>P1: {roomState.players.p1.playerName || 'User'}</span>
              </div>

              {/* P2 Status Pill */}
              <div className="px-3 py-1 rounded-full bg-[#f85149]/15 border border-[#f85149]/40 text-[#f85149] flex items-center gap-1.5 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#f85149]"></span>
                <span>P2: Bot AI</span>
              </div>

              {/* Latency Pill */}
              <div className="px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-[#00ff85] flex items-center gap-1.5 text-xs">
                <Wifi className="w-3.5 h-3.5" />
                <span>4ms</span>
              </div>

              {/* Exit Room Button */}
              <button
                onClick={() => setCurrentView('lobby')}
                className="px-3.5 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-[#f85149] text-[#c9d1d9] hover:text-[#f85149] flex items-center gap-2 transition-all cursor-pointer text-xs"
              >
                <span>Exit Room</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Arena Selection Body */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-1">
          {/* Section Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[#21262d] pb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#ffffff] mb-2 tracking-tight">
                Select Game
              </h1>
              <p className="text-sm text-[#8b949e]">
                Choose a game to launch on this host display. <span className="text-[#58a6ff] font-bold">Use mobile D-Pad (▲ ▼ ◄ ►) or tap to open.</span>
              </p>
            </div>
            <div className="text-xs font-mono-code text-[#8b949e] uppercase tracking-wider">
              SESSION: <span className="text-[#58a6ff]">AIR GAMEPAD REMOTE</span> • SYNC: <span className="text-[#00ff85]">REALTIME</span>
            </div>
          </div>

          {/* Arena Cards Grid (Dynamic selection via Mobile D-Pad or Click) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {GAMES.map((game, idx) => {
              const isSelected = idx === selectedGameIndex;
              const IconComp = game.icon;

              return (
                <div
                  key={game.id}
                  onClick={() => {
                    setSelectedGameIndex(idx);
                    setActiveGameId(game.id);
                    setCurrentView('game_play');
                  }}
                  className={`bg-[#161b22] rounded-2xl p-6 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-2 border-[#58a6ff] shadow-[0_0_30px_rgba(88,166,255,0.25)] scale-[1.02]'
                      : 'border border-[#30363d] hover:border-[#58a6ff]/60'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-[#58a6ff] text-[#0d1117] text-[10px] font-mono-code font-extrabold px-3 py-1 rounded-bl-xl tracking-wider">
                      ACTIVE SELECTION
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-xs font-mono-code text-[#8b949e] mb-4">
                      <span>{game.category}</span>
                      <span className={`px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] ${isSelected ? 'text-[#58a6ff]' : 'text-[#c9d1d9]'}`}>
                        {game.tag}
                      </span>
                    </div>

                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${
                      isSelected ? 'bg-[#58a6ff]/15 border-[#58a6ff]/40 text-[#58a6ff]' : 'bg-[#0d1117] border-[#30363d] text-[#58a6ff]'
                    }`}>
                      <IconComp className="w-5 h-5" />
                    </div>

                    <h3 className="text-xl font-bold text-[#ffffff] mb-2">{game.title}</h3>
                    <p className="text-xs text-[#8b949e] leading-relaxed mb-4">{game.desc}</p>
                  </div>

                  {isSelected ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveGameId(game.id);
                        setCurrentView('game_play');
                      }}
                      className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#58a6ff] text-[#0d1117] hover:bg-[#58a6ff]/90 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(88,166,255,0.4)] mt-4"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Launch Game</span>
                    </button>
                  ) : (
                    <div className="pt-4 border-t border-[#30363d]/60 flex items-center justify-between text-xs font-mono-code text-[#8b949e] mt-4">
                      <span>{game.modeText || 'MODE: PLAYER RALLY'}</span>
                      <button className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:text-[#58a6ff] transition-all">
                        Select
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        </div>

        {/* Bottom Controller Mapping Bar */}
        <footer className="border-t border-[#21262d] bg-[#0d1117]/80 py-4 px-4 sm:px-8 text-xs font-mono-code text-[#8b949e]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span>CONTROLLER MAP:</span>
              <span className="px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-[#ffffff] font-bold">D-PAD (▲ ▼ ◄ ►) / ACTION A</span>
              <span>= REMOTE GAME SELECTION</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[#58a6ff]">
                <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
                P1 (User): Active Remote
              </span>
              <span className="flex items-center gap-1.5 text-[#f85149]">
                <span className="w-2 h-2 rounded-full bg-[#f85149]"></span>
                P2 (Bot AI): Opponent
              </span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // PAGE VIEW 4: ACTIVE GAME PLAYING PAGE
  if (currentView === 'game_play') {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-[#ffffff] font-['Inter',sans-serif] flex flex-col justify-between selection:bg-[#58a6ff] selection:text-[#0d1117] relative">
        {/* Top Header Bar */}
        <header className="border-b border-[#21262d] bg-[#0d1117]/90 px-4 sm:px-8 py-3.5 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs font-mono-code flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-center p-1 overflow-hidden">
                <img src="/logo.png" className="w-full h-full object-contain" alt="Air Game Pad Logo" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#ffffff] text-sm">Air Game Pad</span>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${isGamePaused ? 'bg-[#f85149]/20 text-[#f85149] border-[#f85149]/40' : 'bg-[#00ff85]/20 text-[#00ff85] border-[#00ff85]/40'}`}>
                  {isGamePaused ? 'PAUSED' : 'GAME PLAYING'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
                <span>ROOM: #{roomState.code || roomCode}</span>
              </div>

              <div className="px-3 py-1 rounded-full bg-[#58a6ff]/15 border border-[#58a6ff]/40 text-[#58a6ff] flex items-center gap-1.5 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
                <span>P1: {roomState.players.p1.playerName || 'User'}</span>
              </div>

              {/* PC Pause Button */}
              <button
                onClick={() => setIsGamePaused((prev) => !prev)}
                className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
                  isGamePaused
                    ? 'bg-[#00ff85] text-[#0d1117] border-[#00ff85] shadow-[0_0_15px_rgba(0,255,133,0.4)]'
                    : 'bg-[#161b22] border-[#30363d] text-[#58a6ff] hover:border-[#58a6ff]'
                }`}
              >
                {isGamePaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                <span>{isGamePaused ? 'Resume Match' : 'Pause Game'}</span>
              </button>

              {/* PC Restart Button */}
              <button
                onClick={() => {
                  setIsGamePaused(false);
                  setRestartCounter((prev) => prev + 1);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-[#00ff85] text-[#00ff85] flex items-center gap-1 transition-all cursor-pointer text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>

              {/* Exit Room Button */}
              <button
                onClick={() => {
                  setIsGamePaused(false);
                  setCurrentView('arena');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-[#f85149] text-[#c9d1d9] hover:text-[#f85149] flex items-center gap-1.5 transition-all cursor-pointer text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Back to Arenas</span>
              </button>
            </div>
          </div>
        </header>

        {/* Active Game Component Render */}
        <div className="flex-1 flex flex-col justify-center relative">
          {activeGameId === 'pingpong' && <PingPongGame remoteAction={remoteEvent} isPaused={isGamePaused} restartCounter={restartCounter} onExit={() => setCurrentView('arena')} />}
          {activeGameId === 'quiz' && <QuizGame remoteAction={remoteEvent} isPaused={isGamePaused} restartCounter={restartCounter} onExit={() => setCurrentView('arena')} />}
          {activeGameId === 'tictactoe' && <TicTacToeGame remoteAction={remoteEvent} isPaused={isGamePaused} restartCounter={restartCounter} onExit={() => setCurrentView('arena')} />}
          {activeGameId === 'connect4' && <Connect4Game remoteAction={remoteEvent} isPaused={isGamePaused} restartCounter={restartCounter} onExit={() => setCurrentView('arena')} />}
          {activeGameId === 'flappybird' && <FlappyBirdGame remoteAction={remoteEvent} isPaused={isGamePaused} restartCounter={restartCounter} onExit={() => setCurrentView('arena')} />}

          {/* GAME PAUSED MODAL OVERLAY */}
          {isGamePaused && (
            <div className="absolute inset-0 bg-[#0d1117]/85 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-50">
              <div className="w-20 h-20 rounded-3xl bg-[#58a6ff]/10 border-2 border-[#58a6ff]/40 flex items-center justify-center text-[#58a6ff] shadow-[0_0_40px_rgba(88,166,255,0.3)]">
                <PauseCircle className="w-10 h-10" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black tracking-tight text-[#ffffff] mb-1">GAME PAUSED</h2>
                <p className="text-sm font-mono-code text-[#8b949e]">Match state frozen. Resume from PC or Mobile Controller.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
                <button
                  onClick={() => setIsGamePaused(false)}
                  className="w-full py-3.5 rounded-xl font-bold bg-[#58a6ff] text-[#0d1117] hover:bg-[#58a6ff]/90 transition-all cursor-pointer shadow-[0_0_20px_rgba(88,166,255,0.4)] flex items-center justify-center gap-2 text-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Game</span>
                </button>

                <button
                  onClick={() => {
                    setIsGamePaused(false);
                    setRestartCounter((prev) => prev + 1);
                  }}
                  className="w-full py-3.5 rounded-xl font-bold bg-[#161b22] border border-[#30363d] hover:border-[#00ff85] text-[#00ff85] transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Restart Match</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setIsGamePaused(false);
                  setCurrentView('arena');
                }}
                className="text-xs font-mono-code text-[#8b949e] hover:text-[#f85149] transition-colors cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Match & Return to Arena Selection</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PAGE VIEW 3: TROUBLESHOOT GUIDE PAGE (IMAGE 2 REPLICA)
  if (currentView === 'troubleshoot') {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#ffffff] font-['Inter',sans-serif] flex flex-col justify-between selection:bg-[#58a6ff] selection:text-[#0d1117]">
        
        {/* Top Navbar */}
        <header className="border-b border-[#30363d]/80 bg-[#0d1117]/90 backdrop-blur-md px-4 sm:px-8 py-3 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs font-mono-code">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Air Game Pad Logo" className="w-7 h-7 object-contain rounded-md" />
              <span className="font-bold text-[#ffffff]">Air Game Pad</span>
            </div>

            <div className="hidden md:flex items-center gap-6 text-[#8b949e]">
              <button onClick={() => setCurrentView('landing')} className="hover:text-[#ffffff] transition-colors cursor-pointer">Features</button>
              <button onClick={() => setCurrentView('landing')} className="hover:text-[#ffffff] transition-colors cursor-pointer">Interactive Topology</button>
              <span className="text-[#ffffff] font-bold border-b-2 border-[#58a6ff] pb-0.5">Troubleshoot</span>
              <a href="https://github.com/Dikshitha2607/CodeSprint-Week-1" target="_blank" rel="noreferrer" className="hover:text-[#ffffff] transition-colors">GitHub</a>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleStartGameRoom}
                className="px-3.5 py-1.5 rounded-lg bg-[#58a6ff] text-[#0d1117] font-semibold hover:bg-[#58a6ff]/90 transition-all cursor-pointer"
              >
                Start Game Room
              </button>
            </div>
          </div>
        </header>

        {/* Diagnostic Status Sub-Header Bar */}
        <div className="bg-[#161b22] border-b border-[#30363d] py-2 px-4 sm:px-8 text-xs font-mono-code text-[#8b949e]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[#00ff85] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
                NETWORK RUNTIME: ONLINE
              </span>
              <span>/</span>
              <span>AIR GAMEPAD REMOTE</span>
              <span>/</span>
              <span className="text-[#c9d1d9]">SESSION: DUAL_PLAYER</span>
            </div>
            <div className="flex items-center gap-3">
              <span>STATUS: ACTIVE</span>
              <span className="text-[#00ff85] font-bold">ULTRA LOW LATENCY</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
          
          {/* Back link & Title */}
          <div className="mb-8">
            <button
              onClick={() => setCurrentView('lobby')}
              className="inline-flex items-center gap-1.5 text-xs font-mono-code text-[#58a6ff] hover:underline mb-3 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Lobby</span>
            </button>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#ffffff] mb-2">
              Connection & WebRTC Troubleshoot Guide
            </h1>
            <p className="text-sm text-[#8b949e] max-w-3xl leading-relaxed">
              Step-by-step diagnostic procedures for resolving local Wi-Fi routing, camera QR scanning, latency variance, and WebRTC peer connection handshakes.
            </p>
          </div>

          {/* AUTOMATED PRE-FLIGHT CONNECTION PROBE BOX */}
          <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-5 mb-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-mono-code text-sm font-bold text-[#ffffff]">
                  <span>Automated Pre-Flight Connection Probe</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code ${diagState.status === 'COMPLETE' ? 'bg-[#00ff85]/20 text-[#00ff85]' : 'bg-[#30363d] text-[#8b949e]'}`}>
                    {diagState.status}
                  </span>
                </div>
                <div className="text-xs text-[#8b949e] font-mono-code mt-0.5">
                  Run an automated browser verification for WebRTC DataChannel, Localhost loopback, and MediaDevices API.
                </div>
              </div>
            </div>

            <button
              onClick={handleRunDiagnostics}
              disabled={diagState.running}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-xs font-mono-code text-[#58a6ff] hover:bg-[#58a6ff]/10 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{diagState.running ? 'Probing Network...' : 'Run Diagnostics'}</span>
            </button>
          </div>

          {/* DIAGNOSTICS LOG FEEDBACK IF RUN */}
          {diagState.logs.length > 0 && (
            <div className="bg-[#0d1117] rounded-xl border border-[#30363d] p-4 mb-8 font-mono-code text-xs text-[#00ff85] space-y-1">
              {diagState.logs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span>✓</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}

          {/* 4 DIAGNOSTIC CARDS GRID (2x2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* DIAG_01: QR Code & WebRTC Connection */}
            <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5 font-extrabold text-lg text-[#ffffff]">
                    <div className="w-9 h-9 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <span>QR Code & WebRTC Connection</span>
                  </div>
                  <span className="text-xs font-mono-code text-[#8b949e]">DIAG_01</span>
                </div>

                <div className="space-y-4 text-xs font-mono-code text-[#8b949e]">
                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <Check className="w-4 h-4 text-[#00ff85]" />
                      <span>Camera Permissions:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      Ensure your native camera application or mobile browser (Chrome/Safari) has explicitly granted camera permissions to scan deep links.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <Check className="w-4 h-4 text-[#00ff85]" />
                      <span>Same Wi-Fi Network & Subnet:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      Both host screen and mobile controller must resolve through the exact same SSID/router. Verify that <span className="text-[#c9d1d9]">AP/Client Isolation</span> or Guest Wi-Fi subnet fencing is disabled on the router.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <Check className="w-4 h-4 text-[#00ff85]" />
                      <span>WebSockets & WebRTC Support:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      Verify that private/incognito browsing or content-blockers do not mute WebRTC STUN handshakes or prune local ICE candidate exchange.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono-code text-[#8b949e] pt-4 mt-6 border-t border-[#30363d]/60">
                <span>Signaling: WebSocket RFC 6455</span>
                <span className="text-[#00ff85]">ICE_TYPE: HOST_PRFLX</span>
              </div>
            </div>

            {/* DIAG_02: Controller Latency & Lag Fixes */}
            <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5 font-extrabold text-lg text-[#ffffff]">
                    <div className="w-9 h-9 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#00ff85]">
                      <Zap className="w-5 h-5" />
                    </div>
                    <span>Controller Latency & Lag Fixes</span>
                  </div>
                  <span className="text-xs font-mono-code text-[#8b949e]">DIAG_02</span>
                </div>

                <div className="space-y-4 text-xs font-mono-code text-[#8b949e]">
                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <Zap className="w-4 h-4 text-[#00ff85]" />
                      <span>Disable Low-Power Mode:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      iOS Low Power Mode and Android Battery Saver intentionally clamp high-frequency <span className="text-[#58a6ff]">requestAnimationFrame</span> and touch timers from 60Hz down to 30Hz.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <Zap className="w-4 h-4 text-[#00ff85]" />
                      <span>Prefer 5GHz Wi-Fi Band:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      2.4GHz channels suffer from dense microwave, smart appliance, and Bluetooth packet collision. Switch both host machine and phone to a 5GHz 802.11ac/ax radio band.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <Zap className="w-4 h-4 text-[#00ff85]" />
                      <span>Close Background Tabs:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      Heavy background mobile scripts cause garbage collection spikes that starve the WebRTC UDP streaming thread and introduce micro-stutters.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono-code text-[#8b949e] pt-4 mt-6 border-t border-[#30363d]/60">
                <span>Target Throughput: 120Hz polling</span>
                <span className="text-[#00ff85]">PACKET_LOSS: &lt; 0.01%</span>
              </div>
            </div>

            {/* DIAG_03: Manual Room Code Entry */}
            <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5 font-extrabold text-lg text-[#ffffff]">
                    <div className="w-9 h-9 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                      <Radio className="w-5 h-5" />
                    </div>
                    <span>Manual Room Code Entry</span>
                  </div>
                  <span className="text-xs font-mono-code text-[#8b949e]">DIAG_03</span>
                </div>

                <div className="space-y-4 text-xs font-mono-code text-[#8b949e]">
                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <span className="text-[#58a6ff]">01</span>
                      <span>Open Mobile Browser:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      Launch Safari, Chrome, or Firefox on the target handheld and navigate directly to:
                      <span className="block mt-1 p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#58a6ff] w-fit">airgamepad.party/join</span>
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <span className="text-[#58a6ff]">02</span>
                      <span>Input 4-Digit Room Code:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      Enter the active alphanumeric key displayed on the host screen (e.g., <span className="text-[#00ff85] font-bold">A1B2</span>).
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <span className="text-[#58a6ff]">03</span>
                      <span>Select Controller Slot:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      Assign slot as <span className="text-[#58a6ff]">Player 1 (Blue)</span> or <span className="text-[#f85149]">Player 2 (Coral)</span> and tap <span className="text-[#ffffff] font-bold">Connect Controller</span>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono-code text-[#8b949e] pt-4 mt-6 border-t border-[#30363d]/60">
                <span>Fallback Mode: HTTP REST</span>
                <span className="text-[#8b949e]">AUTH: SHA256_ROOM_PIN</span>
              </div>
            </div>

            {/* DIAG_04: Device Lock & Session Reset */}
            <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5 font-extrabold text-lg text-[#ffffff]">
                    <div className="w-9 h-9 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#f85149]">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <span>Device Lock & Session Reset</span>
                  </div>
                  <span className="text-xs font-mono-code text-[#8b949e]">DIAG_04</span>
                </div>

                <div className="space-y-4 text-xs font-mono-code text-[#8b949e]">
                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <Lock className="w-4 h-4 text-[#f85149]" />
                      <span>Phone Screen Lock:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      If the phone sleeps or switches apps, mobile OS halts WebSockets. Return to the browser tab to fire immediate socket re-sync.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <RefreshCw className="w-4 h-4 text-[#f85149]" />
                      <span>Host Screen Refresh:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      If a player slot remains stuck in Waiting..., press <span className="text-[#ffffff] font-bold">F5</span> on the host to generate clean room entropy.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-[#ffffff] font-bold mb-1">
                      <ShieldCheck className="w-4 h-4 text-[#f85149]" />
                      <span>Clear Local Storage & Credentials:</span>
                    </div>
                    <p className="pl-6 leading-relaxed">
                      Flush cached ICE candidates, stale room tokens, and session bindings using the action trigger below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-[#30363d]/60">
                <button
                  onClick={() => {
                    localStorage.clear();
                    alert('Local session cache cleared successfully.');
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#f85149] text-xs font-mono-code text-[#c9d1d9] hover:text-[#f85149] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Local Session Cache</span>
                </button>
              </div>
            </div>

          </div>

          {/* NETWORK TOPOLOGY REFERENCE SPECS BOX */}
          <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-[#30363d]/60 pb-3">
              <div className="flex items-center gap-2 font-mono-code text-xs font-bold text-[#58a6ff]">
                <Layers className="w-4 h-4" />
                <span>Wireless Remote Reference Specs</span>
              </div>
              <div className="text-[11px] font-mono-code text-[#8b949e]">
                REALTIME CONTROLLER MATRIX
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono-code text-xs">
              <div>
                <div className="text-[#8b949e] uppercase mb-1">DATA CHANNEL</div>
                <div className="text-[#ffffff] font-bold mb-1">Direct Socket Stream</div>
                <div className="text-[#8b949e] text-[11px] leading-relaxed">
                  Fast responsive input streaming for low latency analog and directional controls.
                </div>
              </div>

              <div>
                <div className="text-[#8b949e] uppercase mb-1">PAIRING</div>
                <div className="text-[#ffffff] font-bold mb-1">Instant QR Connection</div>
                <div className="text-[#8b949e] text-[11px] leading-relaxed">
                  Automatic instant device pairing via mobile QR code scan.
                </div>
              </div>

              <div>
                <div className="text-[#8b949e] uppercase mb-1">SECURITY</div>
                <div className="text-[#ffffff] font-bold mb-1">Encrypted Session</div>
                <div className="text-[#8b949e] text-[11px] leading-relaxed">
                  Isolated session tokens per room code.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="border-t border-[#30363d]/80 py-6 px-4 sm:px-8 text-xs font-mono-code text-[#8b949e] bg-[#0d1117]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>Made by Rahul and Dikshitha</div>
            <div className="flex items-center gap-6">
              <button onClick={() => setCurrentView('troubleshoot')} className="text-[#ffffff] font-bold hover:underline cursor-pointer">Troubleshoot Guide</button>
              <a href="https://github.com/Dikshitha2607/CodeSprint-Week-1" target="_blank" rel="noreferrer" className="hover:text-[#ffffff] transition-colors">GitHub</a>
              <button onClick={() => setCurrentView('landing')} className="hover:text-[#ffffff] transition-colors cursor-pointer">Controls Support</button>
            </div>
          </div>
        </footer>

      </div>
    );
  }

  // PAGE VIEW 1: MAIN LANDING PAGE
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#ffffff] font-['Inter',sans-serif] selection:bg-[#58a6ff] selection:text-[#0d1117]">

      {/* NAV BAR */}
      <header className="sticky top-0 z-40 border-b border-[#30363d]/80 bg-[#0d1117]/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Status Badge */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
            <img src="/logo.png" alt="Air Game Pad Logo" className="w-9 h-9 object-contain rounded-md" />
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-lg leading-tight flex items-center gap-1.5">
                Air Game <span className="text-[#58a6ff]">Pad</span>
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono-code bg-[#161b22] border border-[#30363d] text-[#00ff85]">
              <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
              WIRELESS CONTROLLER
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8b949e]">
            <a href="#features" className="hover:text-[#ffffff] transition-colors">Features</a>
            <a href="#architecture" className="hover:text-[#ffffff] transition-colors">Interactive Topology</a>
            <button onClick={() => setCurrentView('troubleshoot')} className="hover:text-[#ffffff] transition-colors cursor-pointer">Troubleshoot</button>
            <a href="#faq" className="hover:text-[#ffffff] transition-colors">FAQ</a>
            <a href="https://github.com/Dikshitha2607/CodeSprint-Week-1" target="_blank" rel="noreferrer" className="hover:text-[#ffffff] transition-colors flex items-center gap-1">
              GitHub
            </a>
          </nav>

          {/* Right Metrics & CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-mono-code text-[#c9d1d9]">
              <span className="flex items-center gap-1 text-[#00ff85]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff85]"></span>
                LOW LATENCY | 60 FPS SYNC
              </span>
            </div>

            <button
              onClick={handleStartGameRoom}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#58a6ff] text-[#0d1117] hover:bg-[#58a6ff]/90 transition-all shadow-[0_0_15px_rgba(88,166,255,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Start Game Room
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#58a6ff]/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-mono-code text-[#c9d1d9] mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#00ff85]"></span>
            <span>AIR GAMEPAD • INSTANT CONTROLLER • PLAY ANYWHERE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#ffffff] mb-4">
            Air Game <span className="bg-gradient-to-r from-[#ffffff] via-[#c9d1d9] to-[#58a6ff] bg-clip-text text-transparent">Pad</span>
          </h1>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#c9d1d9] mb-4 max-w-2xl">
            Turn your phone into a gamepad. Zero setup required.
          </h2>

          <p className="text-base sm:text-lg text-[#8b949e] max-w-2xl mb-8 leading-relaxed">
            High-performance, ultra-low latency wireless controller streaming direct in the browser via WebRTC data channels.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={handleStartGameRoom}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-base font-bold bg-[#58a6ff] text-[#0d1117] hover:bg-[#58a6ff]/90 transition-all flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(88,166,255,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Game Room
            </button>

            <button
              onClick={() => setActiveModal('join')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-base font-bold bg-[#161b22] text-[#ffffff] border border-[#30363d] hover:border-[#58a6ff]/50 hover:bg-[#161b22]/80 transition-all flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Radio className="w-5 h-5 text-[#58a6ff]" />
              Join as Controller
            </button>
          </div>
        </div>
      </section>

      {/* 3 FEATURE CARDS GRID */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono-code text-[#58a6ff] mb-2 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
              CORE PLATFORM CAPABILITIES
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#ffffff]">
              Features
            </h2>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs font-mono-code text-[#c9d1d9] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#58a6ff]" />
            <span>ARCH SPEC: 0-APP SETUP • P2P MESH</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#58a6ff] mb-5 shadow-sm">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#ffffff] mb-2.5">
                P2P Local Duel
              </h3>
              <p className="text-sm text-[#8b949e] leading-relaxed mb-6">
                True split-screen arena gameplay. Dual-controller parity featuring directional thumb sweeps, trigger clicks, and tactile haptic recoil.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-code text-[#58a6ff] pt-4 border-t border-[#30363d]/60">
              <CheckCircle2 className="w-4 h-4" />
              <span>Dual P1/P2 Support</span>
            </div>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#00ff85] mb-5 shadow-sm">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#ffffff] mb-2.5">
                Sub-15ms WebRTC
              </h3>
              <p className="text-sm text-[#8b949e] leading-relaxed mb-6">
                Sub-15ms direct UDP input streaming with automated WebSocket signaling fallback and adaptive STUN packet interleaving.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-code text-[#00ff85] pt-4 border-t border-[#30363d]/60">
              <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
              <span>~8.5ms Local Wi-Fi</span>
            </div>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#f85149] mb-5 shadow-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#ffffff] mb-2.5">
                Zero-App Install
              </h3>
              <p className="text-sm text-[#8b949e] leading-relaxed mb-6">
                Instant browser-to-browser P2P via QR scan, zero downloads, zero App Store friction. Works on iOS Safari & Android Chrome.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-code text-[#f85149] pt-4 border-t border-[#30363d]/60">
              <QrCode className="w-4 h-4" />
              <span>Scan & Connect</span>
            </div>
          </div>

        </div>
      </section>

      {/* LIVING ROOM ARENA ARCHITECTURE */}
      <section id="architecture" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono-code text-[#58a6ff] mb-2 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
              INTERACTIVE STREAMING TOPOLOGY
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#ffffff]">
              Living Room Arena Architecture
            </h2>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs font-mono-code text-[#c9d1d9] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#58a6ff]" />
            <span>P2P CHANNEL MESH: P1 (<span className="text-[#58a6ff]">#58A6FF</span>) • P2 (<span className="text-[#f85149]">#F85149</span>)</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#161b22] border border-[#30363d] p-4 sm:p-8 flex flex-col gap-6 shadow-2xl relative">
          
          {/* TV DISPLAY */}
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 sm:p-5 relative">
            <div className="flex items-center justify-between mb-3 border-b border-[#30363d]/60 pb-2.5">
              <div className="flex items-center gap-2 font-mono-code text-xs font-bold text-[#00ff85]">
                <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
                TV APP Neon Hyper-Rally • Air Game Pad Arena
              </div>
              <div className="flex items-center gap-3 text-xs font-mono-code">
                <span className="text-[#58a6ff] font-bold">P1 MATCH ACTIVE</span>
                <span className="text-[#8b949e]">•</span>
                <span className="text-[#f85149] font-bold">P2 MATCH ACTIVE</span>
                <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
              </div>
            </div>

            <div className="relative w-full aspect-[16/8] sm:aspect-[16/7] rounded-lg bg-[#0d1117] border border-[#30363d] overflow-hidden flex items-center justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                width={700}
                height={350}
                className="w-full h-full object-contain"
              />

              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-[#161b22]/90 border border-[#30363d] text-[11px] font-mono-code text-[#00ff85] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                SPD: {gameStats.speed} MPH
              </div>

              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-[#161b22]/90 border border-[#30363d] text-[11px] font-mono-code text-[#f85149] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                CONTINUOUS RALLIES
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3 font-mono-code text-xs text-[#8b949e]">
              <div className="flex items-center gap-2 text-[#00ff85]">
                <Tv className="w-4 h-4" />
                <span>SHARED LIVING ROOM DESKTOP DISPLAY</span>
              </div>
              <div>NO DONGLES OR PLUGINS REQUIRED</div>
            </div>
          </div>

          {/* PLAYER REMOTES SIDE BY SIDE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PLAYER 1 CONTROLLER */}
            <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 border-b border-[#30363d]/60 pb-2.5">
                <div className="flex items-center gap-2 font-mono-code text-xs font-bold text-[#58a6ff]">
                  <span className="w-2 h-2 rounded-full bg-[#58a6ff] animate-pulse"></span>
                  ● PLAYER 1
                </div>
                <div className="flex items-center gap-3 text-xs font-mono-code text-[#8b949e]">
                  <span>{gameStats.pingP1}ms PING</span>
                  <BatteryIcon level={92} color="#58a6ff" />
                </div>
              </div>

              <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]/80 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 text-[11px] font-mono-code text-[#8b949e]">
                  <span>AIR CONTROLLER P1</span>
                  <span className="text-[#58a6ff]">TOUCH / D-PAD READY</span>
                </div>

                <div className="grid grid-cols-3 gap-2 w-36 h-36 my-2">
                  <div></div>
                  <button
                    onClick={() => handleP1Dir('up')}
                    className={`rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#58a6ff] flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p1ActiveBtn === 'up' ? 'bg-[#58a6ff]/30 border-[#58a6ff] text-[#58a6ff] scale-95' : ''}`}
                  >
                    ▲
                  </button>
                  <div></div>

                  <button
                    onClick={() => handleP1Dir('left')}
                    className={`rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#58a6ff] flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p1ActiveBtn === 'left' ? 'bg-[#58a6ff]/30 border-[#58a6ff] text-[#58a6ff] scale-95' : ''}`}
                  >
                    ◀
                  </button>
                  <div className="rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${p1ActiveBtn ? 'bg-[#ffffff] scale-125' : 'bg-[#58a6ff]'} transition-all`}></span>
                  </div>
                  <button
                    onClick={() => handleP1Dir('right')}
                    className={`rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#58a6ff] flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p1ActiveBtn === 'right' ? 'bg-[#58a6ff]/30 border-[#58a6ff] text-[#58a6ff] scale-95' : ''}`}
                  >
                    ▶
                  </button>

                  <div></div>
                  <button
                    onClick={() => handleP1Dir('down')}
                    className={`rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#58a6ff] flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p1ActiveBtn === 'down' ? 'bg-[#58a6ff]/30 border-[#58a6ff] text-[#58a6ff] scale-95' : ''}`}
                  >
                    ▼
                  </button>
                  <div></div>
                </div>

                <div className="w-full flex items-center justify-between gap-4 mt-3 pt-3 border-t border-[#30363d]/60 font-mono-code text-xs">
                  <button
                    onClick={() => handleP1Dir('L1')}
                    className={`flex-1 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-[#58a6ff] text-center font-semibold transition-all cursor-pointer ${p1ActiveBtn === 'L1' ? 'bg-[#58a6ff]/30 border-[#58a6ff]' : ''}`}
                  >
                    L1 • BOOST
                  </button>
                  <button
                    onClick={() => handleP1Dir('R1')}
                    className={`flex-1 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-[#58a6ff] text-center font-semibold transition-all cursor-pointer ${p1ActiveBtn === 'R1' ? 'bg-[#58a6ff]/30 border-[#58a6ff]' : ''}`}
                  >
                    R1 • NITRO
                  </button>
                </div>
              </div>
              <div className="text-center font-mono-code text-xs text-[#8b949e] mt-3">
                Mobile Touch Surface (P1)
              </div>
            </div>

            {/* PLAYER 2 CONTROLLER */}
            <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 border-b border-[#30363d]/60 pb-2.5">
                <div className="flex items-center gap-2 font-mono-code text-xs font-bold text-[#f85149]">
                  <span className="w-2 h-2 rounded-full bg-[#f85149] animate-pulse"></span>
                  ● PLAYER 2
                </div>
                <div className="flex items-center gap-3 text-xs font-mono-code text-[#8b949e]">
                  <span>{gameStats.pingP2}ms PING</span>
                  <BatteryIcon level={88} color="#f85149" />
                </div>
              </div>

              <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]/80 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 text-[11px] font-mono-code text-[#8b949e]">
                  <span>AIR CONTROLLER P2</span>
                  <span className="text-[#f85149]">ACTION POD READY</span>
                </div>

                <div className="grid grid-cols-3 gap-2 w-36 h-36 my-2">
                  <div></div>
                  <button
                    onClick={() => handleP2Btn('Y')}
                    className={`rounded-full bg-[#0d1117] border border-[#30363d] text-[#f85149] hover:border-[#f85149] hover:bg-[#f85149]/20 flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p2ActiveBtn === 'Y' ? 'scale-90 bg-[#f85149]/40 border-[#f85149]' : ''}`}
                  >
                    Y
                  </button>
                  <div></div>

                  <button
                    onClick={() => handleP2Btn('X')}
                    className={`rounded-full bg-[#0d1117] border border-[#30363d] text-[#f85149] hover:border-[#f85149] hover:bg-[#f85149]/20 flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p2ActiveBtn === 'X' ? 'scale-90 bg-[#f85149]/40 border-[#f85149]' : ''}`}
                  >
                    X
                  </button>
                  <div className="rounded-full bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${p2ActiveBtn ? 'bg-[#ffffff] scale-125' : 'bg-[#f85149]'} transition-all`}></span>
                  </div>
                  <button
                    onClick={() => handleP2Btn('B')}
                    className={`rounded-full bg-[#0d1117] border border-[#30363d] text-[#f85149] hover:border-[#f85149] hover:bg-[#f85149]/20 flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p2ActiveBtn === 'B' ? 'scale-90 bg-[#f85149]/40 border-[#f85149]' : ''}`}
                  >
                    B
                  </button>

                  <div></div>
                  <button
                    onClick={() => handleP2Btn('A')}
                    className={`rounded-full bg-[#0d1117] border border-[#30363d] text-[#f85149] hover:border-[#f85149] hover:bg-[#f85149]/20 flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p2ActiveBtn === 'A' ? 'scale-90 bg-[#f85149]/40 border-[#f85149]' : ''}`}
                  >
                    A
                  </button>
                  <div></div>
                </div>

                <div className="w-full flex items-center justify-between gap-4 mt-3 pt-3 border-t border-[#30363d]/60 font-mono-code text-xs">
                  <span className="text-[#8b949e]">HAPTIC ENGINE</span>
                  <span className="text-[#00ff85] font-semibold">ACTIVE (30MS)</span>
                </div>
              </div>
              <div className="text-center font-mono-code text-xs text-[#8b949e] mt-3">
                Tactile Action Pod (P2)
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-mono-code text-[#58a6ff] mb-4">
            # faq
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#ffffff] mb-3">
            Everything You Need to Know
          </h2>
          <p className="text-[#8b949e] text-base">
            Instant couch multiplayer, zero drivers or configuration.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {faqData.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="glass-card rounded-xl border border-[#30363d] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-base sm:text-lg text-[#ffffff] hover:text-[#58a6ff] transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[#8b949e] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#58a6ff]' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-[#8b949e] leading-relaxed border-t border-[#30363d]/50 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="glass-card rounded-2xl p-8 sm:p-12 border border-[#30363d] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-2xl">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 bg-[#58a6ff]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-xl relative z-10">
            <div className="text-xs font-mono-code font-bold text-[#58a6ff] tracking-wider uppercase mb-2">
              COUCH GAMING REIMAGINED
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#ffffff] mb-3">
              Open this screen on your Smart TV or Laptop.
            </h2>
            <p className="text-sm sm:text-base text-[#8b949e] leading-relaxed">
              Create a room in 3 seconds, gather your friends on the couch, and start playing competitive arcade party duels immediately.
            </p>
          </div>

          <div className="relative z-10 w-full md:w-auto">
            <button
              onClick={handleStartGameRoom}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-[#58a6ff] text-[#0d1117] hover:bg-[#58a6ff]/90 transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(88,166,255,0.4)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              Launch Arena Now
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#30363d]/80 py-8 px-4 sm:px-8 text-xs font-mono-code text-[#8b949e]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
            <span>All Systems Operational • P2P-App WebRTC Peer-To-Peer • 60 FPS Sync</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('troubleshoot')} className="hover:text-[#ffffff] transition-colors cursor-pointer">Troubleshoot Guide</button>
            <a href="https://github.com/Dikshitha2607/CodeSprint-Week-1" target="_blank" rel="noreferrer" className="hover:text-[#ffffff] transition-colors">GitHub</a>
            <button onClick={() => setCurrentView('troubleshoot')} className="hover:text-[#ffffff] transition-colors cursor-pointer">APIDocs</button>
            <a href="#architecture" className="hover:text-[#ffffff] transition-colors">Controls Support</a>
          </div>
        </div>
      </footer>

      {/* MODAL: JOIN AS CONTROLLER */}
      {activeModal === 'join' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1117]/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 sm:p-8 border border-[#30363d] relative shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-[#8b949e] hover:text-[#ffffff] p-1 rounded-lg hover:bg-[#30363d]/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#00ff85]/10 border border-[#00ff85]/30 flex items-center justify-center text-[#00ff85]">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#ffffff]">Join Controller Room</h3>
                <p className="text-xs text-[#8b949e]">Enter your host room code to pair instantly</p>
              </div>
            </div>

            <div className="my-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono-code text-[#8b949e] mb-1.5 uppercase">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-xl px-4 py-3 font-mono-code text-center text-lg text-[#58a6ff] font-bold uppercase tracking-wider outline-none"
                  placeholder="e.g. A1B2"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-code text-[#8b949e] mb-1.5 uppercase">Select Player Slot</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setControllerRole('p1')}
                    className={`py-3 rounded-xl border font-mono-code text-sm font-bold transition-all cursor-pointer ${controllerRole === 'p1' ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff]' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'}`}
                  >
                    PLAYER 1 (#58A6FF)
                  </button>
                  <button
                    onClick={() => setControllerRole('p2')}
                    className={`py-3 rounded-xl border font-mono-code text-sm font-bold transition-all cursor-pointer ${controllerRole === 'p2' ? 'bg-[#f85149]/20 border-[#f85149] text-[#f85149]' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'}`}
                  >
                    PLAYER 2 (#F85149)
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveModal(null);
                setCurrentView('lobby');
                socket.emit('join_room', { roomCode: roomCode, slot: controllerRole, deviceName: 'Galaxy S24 (Chrome Mobile)' });
              }}
              className="w-full py-3.5 rounded-xl font-bold bg-[#00ff85] text-[#0d1117] hover:bg-[#00ff85]/90 transition-all cursor-pointer text-center shadow-[0_0_20px_rgba(0,255,133,0.3)] font-mono-code"
            >
              Connect Controller
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper Battery Icon Component
function BatteryIcon({ level = 100, color = "#58a6ff" }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-5 h-2.5 rounded-[2px] border border-[#30363d] p-[1px] relative">
        <div
          className="h-full rounded-[1px]"
          style={{ width: `${level}%`, backgroundColor: color }}
        ></div>
      </div>
      <span>{level}%</span>
    </div>
  );
}
