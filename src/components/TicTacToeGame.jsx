import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Bot, Users, Trophy, Sparkles, ChevronRight, Gamepad2 } from 'lucide-react';
import { playSound } from '../utils/audio';

// 8 Winning Triples
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export default function TicTacToeGame({ remoteAction, isPaused, restartCounter, onExit }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('X'); // 'X' always goes first
  const [cursor, setCursor] = useState(4); // Default center cursor
  const [gameMode, setGameMode] = useState('1P'); // '1P' (vs Bot) | '2P' (Local / 2 Players)
  const [aiDifficulty, setAiDifficulty] = useState('medium'); // 'easy' | 'medium' | 'master'
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [winResult, setWinResult] = useState(null); // null | { winner: 'X'|'O', line: [a,b,c] } | { winner: 'Draw' }
  const [scores, setScores] = useState({ x: 0, o: 0, ties: 0 });
  const [hoveredCell, setHoveredCell] = useState(null);

  const lastHandledTimeRef = useRef(0);

  // Check Winner Helper
  const evaluateBoard = useCallback((b) => {
    for (const [a, bIdx, c] of WINNING_LINES) {
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
        return { winner: b[a], line: [a, bIdx, c] };
      }
    }
    if (b.every((cell) => cell !== null)) {
      return { winner: 'Draw', line: [] };
    }
    return null;
  }, []);

  // Minimax algorithm for unbeatable AI
  const minimax = useCallback((testBoard, depth, isMaximizing) => {
    const result = evaluateBoard(testBoard);
    if (result) {
      if (result.winner === 'O') return 10 - depth;
      if (result.winner === 'X') return depth - 10;
      if (result.winner === 'Draw') return 0;
    }

    const emptyIndices = testBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((v) => v !== null);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const idx of emptyIndices) {
        testBoard[idx] = 'O';
        const evalScore = minimax(testBoard, depth + 1, false);
        testBoard[idx] = null;
        maxEval = Math.max(maxEval, evalScore);
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const idx of emptyIndices) {
        testBoard[idx] = 'X';
        const evalScore = minimax(testBoard, depth + 1, true);
        testBoard[idx] = null;
        minEval = Math.min(minEval, evalScore);
      }
      return minEval;
    }
  }, [evaluateBoard]);

  // AI Move Selector
  const getAiMove = useCallback((currentBoard, difficulty) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((v) => v !== null);

    if (emptyIndices.length === 0) return null;

    // Easy: 70% random, 30% smart
    if (difficulty === 'easy') {
      if (Math.random() < 0.7) {
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }
    }

    // Medium: Block immediate opponent win or take immediate win, otherwise 40% random
    if (difficulty === 'medium') {
      // 1. Check if AI can win immediately
      for (const idx of emptyIndices) {
        const test = [...currentBoard];
        test[idx] = 'O';
        const res = evaluateBoard(test);
        if (res && res.winner === 'O') return idx;
      }
      // 2. Check if Human can win immediately and block
      for (const idx of emptyIndices) {
        const test = [...currentBoard];
        test[idx] = 'X';
        const res = evaluateBoard(test);
        if (res && res.winner === 'X') return idx;
      }
      // 3. Take center if available
      if (currentBoard[4] === null && Math.random() < 0.6) return 4;

      if (Math.random() < 0.4) {
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }
    }

    // Master / Unbeatable Minimax
    let bestScore = -Infinity;
    let bestMove = emptyIndices[0];

    for (const idx of emptyIndices) {
      const copyBoard = [...currentBoard];
      copyBoard[idx] = 'O';
      const score = minimax(copyBoard, 0, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }
    return bestMove;
  }, [evaluateBoard, minimax]);

  // Apply a move
  const makeMove = useCallback((idx, player) => {
    if (board[idx] !== null || winResult !== null || isPaused) return false;

    const nextBoard = [...board];
    nextBoard[idx] = player;
    setBoard(nextBoard);
    playSound(player === 'X' ? 'place_x' : 'place_o');

    const result = evaluateBoard(nextBoard);
    if (result) {
      setWinResult(result);
      if (result.winner === 'X') {
        setScores((s) => ({ ...s, x: s.x + 1 }));
        playSound('win');
      } else if (result.winner === 'O') {
        setScores((s) => ({ ...s, o: s.o + 1 }));
        playSound(gameMode === '1P' ? 'wrong' : 'win');
      } else {
        setScores((s) => ({ ...s, ties: s.ties + 1 }));
      }
      return true;
    }

    // Switch turn
    const nextTurn = player === 'X' ? 'O' : 'X';
    setTurn(nextTurn);
    return true;
  }, [board, winResult, isPaused, evaluateBoard, gameMode]);

  // Handle AI turn when in 1P mode
  useEffect(() => {
    if (gameMode !== '1P' || turn !== 'O' || winResult !== null || isPaused || isAiThinking) {
      return;
    }

    setIsAiThinking(true);
    const delay = Math.floor(350 + Math.random() * 250);
    const timer = setTimeout(() => {
      const move = getAiMove(board, aiDifficulty);
      if (move !== null && board[move] === null) {
        makeMove(move, 'O');
      }
      setIsAiThinking(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [gameMode, turn, winResult, isPaused, isAiThinking, board, aiDifficulty, getAiMove, makeMove]);

  // Reset Game
  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinResult(null);
    setIsAiThinking(false);
    setCursor(4);
  }, []);

  // Handle external restartCounter trigger
  useEffect(() => {
    if (restartCounter > 0) {
      resetGame();
    }
  }, [restartCounter, resetGame]);

  // Remote controller action handler
  useEffect(() => {
    if (!remoteAction || isPaused) return;
    const { action, timestamp } = remoteAction;

    if (timestamp && timestamp === lastHandledTimeRef.current) return;
    lastHandledTimeRef.current = timestamp || Date.now();

    if (winResult !== null) {
      if (action === 'ACTION_A' || action === 'ACTION_B' || action === 'START' || action === 'UP' || action === 'DOWN') {
        resetGame();
      }
      return;
    }

    if (isAiThinking) return;

    if (action === 'LEFT') {
      playSound('move');
      setCursor((prev) => (prev % 3 > 0 ? prev - 1 : prev + 2));
    } else if (action === 'RIGHT') {
      playSound('move');
      setCursor((prev) => (prev % 3 < 2 ? prev + 1 : prev - 2));
    } else if (action === 'UP') {
      playSound('move');
      setCursor((prev) => (prev >= 3 ? prev - 3 : prev + 6));
    } else if (action === 'DOWN') {
      playSound('move');
      setCursor((prev) => (prev <= 5 ? prev + 3 : prev - 6));
    } else if (action === 'ACTION_A' || action === 'ACTION_B' || action === 'START') {
      makeMove(cursor, turn);
    }
  }, [remoteAction, isPaused, winResult, isAiThinking, cursor, turn, makeMove, resetGame]);

  // Keyboard navigation on Host PC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPaused) return;

      if (winResult !== null) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          resetGame();
        }
        return;
      }

      if (isAiThinking) return;

      // Arrow keys / WASD navigation
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        playSound('move');
        setCursor((prev) => (prev % 3 > 0 ? prev - 1 : prev + 2));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        playSound('move');
        setCursor((prev) => (prev % 3 < 2 ? prev + 1 : prev - 2));
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        playSound('move');
        setCursor((prev) => (prev >= 3 ? prev - 3 : prev + 6));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        playSound('move');
        setCursor((prev) => (prev <= 5 ? prev + 3 : prev - 6));
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        makeMove(cursor, turn);
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const targetIdx = parseInt(e.key, 10) - 1;
        setCursor(targetIdx);
        makeMove(targetIdx, turn);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, winResult, isAiThinking, cursor, turn, makeMove, resetGame]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[620px] bg-[#0b0e14] text-[#ffffff] p-4 sm:p-6 select-none">
      {/* Top Header Bar */}
      <div className="w-full max-w-xl flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#58a6ff]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff] font-bold text-lg">
            ✕◯
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#ffffff] tracking-tight">Tic Tac Toe</h2>
            <div className="flex items-center gap-2 text-[11px] font-mono-code text-[#8b949e]">
              <span>Air GamePad Classic</span>
              <span>•</span>
              <span className="text-[#58a6ff]">{gameMode === '1P' ? `vs AI Bot (${aiDifficulty})` : '2 Players (Local)'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-[#161b22] border border-[#30363d] p-0.5">
            <button
              onClick={() => {
                setGameMode('1P');
                resetGame();
              }}
              className={`px-2.5 py-1 text-xs font-mono-code rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                gameMode === '1P' ? 'bg-[#58a6ff] text-[#0d1117] font-bold' : 'text-[#8b949e] hover:text-[#ffffff]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>vs Bot</span>
            </button>
            <button
              onClick={() => {
                setGameMode('2P');
                resetGame();
              }}
              className={`px-2.5 py-1 text-xs font-mono-code rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                gameMode === '2P' ? 'bg-[#58a6ff] text-[#0d1117] font-bold' : 'text-[#8b949e] hover:text-[#ffffff]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2 Players</span>
            </button>
          </div>

          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-[#f85149] text-xs font-mono-code text-[#8b949e] hover:text-[#f85149] transition-colors cursor-pointer"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main Game Container */}
      <div className="w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
        
        {/* Scoreboard Bar */}
        <div className="w-full grid grid-cols-3 gap-3 mb-6 font-mono-code text-center">
          <div className={`p-2.5 rounded-xl border transition-all ${
            turn === 'X' && !winResult
              ? 'bg-[#58a6ff]/15 border-[#58a6ff] shadow-[0_0_15px_rgba(88,166,255,0.3)]'
              : 'bg-[#0d1117] border-[#30363d]'
          }`}>
            <div className="text-[10px] text-[#8b949e] flex items-center justify-center gap-1 font-bold">
              <span>PLAYER X</span>
              {gameMode === '1P' && <span className="text-[#58a6ff]">(You)</span>}
            </div>
            <div className="text-xl font-black text-[#58a6ff]">{scores.x}</div>
          </div>

          <div className="p-2.5 rounded-xl border bg-[#0d1117] border-[#30363d]">
            <div className="text-[10px] text-[#8b949e] font-bold">DRAWS</div>
            <div className="text-xl font-black text-[#c9d1d9]">{scores.ties}</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            turn === 'O' && !winResult
              ? 'bg-[#f85149]/15 border-[#f85149] shadow-[0_0_15px_rgba(248,81,73,0.3)]'
              : 'bg-[#0d1117] border-[#30363d]'
          }`}>
            <div className="text-[10px] text-[#8b949e] flex items-center justify-center gap-1 font-bold">
              <span>PLAYER O</span>
              {gameMode === '1P' && <span className="text-[#f85149]">(Bot)</span>}
            </div>
            <div className="text-xl font-black text-[#f85149]">{scores.o}</div>
          </div>
        </div>

        {/* Turn / Status Banner */}
        <div className="w-full flex items-center justify-between mb-5 px-1 font-mono-code text-xs">
          <div className="flex items-center gap-2">
            {winResult ? (
              <span className="flex items-center gap-1.5 font-bold text-[#00ff85] bg-[#00ff85]/10 border border-[#00ff85]/30 px-3 py-1.5 rounded-lg text-sm">
                <Trophy className="w-4 h-4" />
                {winResult.winner === 'Draw'
                  ? "Match Tied! Well played."
                  : `Player (${winResult.winner}) Won the Match! 🎉`}
              </span>
            ) : isAiThinking ? (
              <span className="flex items-center gap-2 text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/30 px-3 py-1.5 rounded-lg animate-pulse font-bold">
                <Bot className="w-4 h-4 animate-spin" />
                <span>AI Bot is calculating move...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <span className="text-[#8b949e]">Turn:</span>
                <span className={`font-bold flex items-center gap-1 ${turn === 'X' ? 'text-[#58a6ff]' : 'text-[#f85149]'}`}>
                  <span className="text-sm font-black">{turn}</span>
                  <span>({gameMode === '1P' ? (turn === 'X' ? 'You' : 'Bot') : `Player ${turn}`})</span>
                </span>
              </span>
            )}
          </div>

          {gameMode === '1P' && !winResult && (
            <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5">
              {['easy', 'medium', 'master'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setAiDifficulty(lvl)}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold cursor-pointer transition-colors ${
                    aiDifficulty === lvl ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40' : 'text-[#8b949e] hover:text-[#c9d1d9]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3x3 Interactive Grid */}
        <div className="grid grid-cols-3 gap-3 w-72 h-72 sm:w-80 sm:h-80 mb-6 relative">
          {board.map((val, idx) => {
            const isCursor = idx === cursor;
            const isWinningCell = winResult && winResult.line && winResult.line.includes(idx);
            const isHovered = hoveredCell === idx && !val && !winResult && !isAiThinking;

            let cellClass = "bg-[#0d1117] border-[#30363d] text-[#c9d1d9]";

            if (isWinningCell) {
              cellClass = "bg-[#00ff85]/20 border-[#00ff85] shadow-[0_0_25px_rgba(0,255,133,0.6)] animate-win-pulse";
            } else if (isCursor && !winResult) {
              cellClass = "border-2 border-[#58a6ff] bg-[#58a6ff]/10 shadow-[0_0_20px_rgba(88,166,255,0.35)] scale-[1.03]";
            } else {
              cellClass += " hover:border-[#58a6ff]/60 hover:bg-[#161b22]";
            }

            return (
              <button
                key={idx}
                disabled={Boolean(val) || Boolean(winResult) || isAiThinking || isPaused}
                onMouseEnter={() => setHoveredCell(idx)}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => {
                  setCursor(idx);
                  makeMove(idx, turn);
                }}
                className={`w-full h-full rounded-2xl border flex items-center justify-center font-extrabold text-5xl sm:text-6xl transition-all cursor-pointer relative overflow-hidden group ${cellClass}`}
              >
                {/* Cell coordinate guide number in corner */}
                <span className="absolute top-1.5 left-2 text-[9px] font-mono-code text-[#30363d] group-hover:text-[#8b949e]">
                  {idx + 1}
                </span>

                {/* Placed Piece with Pop-In Animation */}
                {val === 'X' && (
                  <span className="text-[#58a6ff] drop-shadow-[0_0_12px_rgba(88,166,255,0.6)] animate-pop-in">
                    ✕
                  </span>
                )}
                {val === 'O' && (
                  <span className="text-[#f85149] drop-shadow-[0_0_12px_rgba(248,81,73,0.6)] animate-pop-in">
                    ◯
                  </span>
                )}

                {/* Ghost preview on hover / cursor focus */}
                {!val && !winResult && !isAiThinking && (isHovered || (isCursor && !val)) && (
                  <span className={`opacity-20 font-black scale-90 transition-opacity ${turn === 'X' ? 'text-[#58a6ff]' : 'text-[#f85149]'}`}>
                    {turn === 'X' ? '✕' : '◯'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls & Hint Footer */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#30363d]/60 text-xs font-mono-code text-[#8b949e]">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#0d1117] border border-[#30363d] text-[10px] text-[#58a6ff]">D-PAD / ARROWS</span>
            <span>Move cursor</span>
            <span className="p-1 rounded bg-[#0d1117] border border-[#30363d] text-[10px] text-[#58a6ff]">ACTION A / ENTER</span>
            <span>Place</span>
          </div>

          <button
            onClick={resetGame}
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#ffffff] font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-[#30363d] hover:border-[#58a6ff]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{winResult ? 'Play Again' : 'Reset Board'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
