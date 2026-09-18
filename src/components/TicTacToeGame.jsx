import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Bot, Trophy } from 'lucide-react';
import { playSound } from '../utils/audio';
import EndGameActions from './EndGameActions';

// 8 Winning Triples
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

const createOpeningBoard = () => Array(9).fill(null);

export default function TicTacToeGame({ remoteAction, isPaused, restartCounter, onExit }) {
  // A classic, empty board lets either player take the centre naturally.
  const [board, setBoard] = useState(createOpeningBoard);
  const [turn, setTurn] = useState('X');
  const [cursor, setCursor] = useState(4);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [winResult, setWinResult] = useState(null); // null | { winner: 'X'|'O', line: [a,b,c] } | { winner: 'Draw' }
  const [scores, setScores] = useState({ x: 0, o: 0, ties: 0 });
  const [hoveredCell, setHoveredCell] = useState(null);
  const [endChoice, setEndChoice] = useState(0);

  const lastHandledTimeRef = useRef(0);
  const lastNavigationAtRef = useRef(0);

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

  // The bot evaluates every possible continuation. Tic Tac Toe is small
  // enough that this is instant and means it never overlooks a forced win.
  const getAiMove = useCallback((currentBoard) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((v) => v !== null);

    if (emptyIndices.length === 0) return null;

    // A small amount of intentional imperfection makes the solo game
    // winnable while retaining the bot's strong tactical play most turns.
    if (Math.random() < 0.38) return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

    let bestMove = emptyIndices[0];
    let bestScore = -Infinity;
    for (const idx of emptyIndices) {
      const test = [...currentBoard];
      test[idx] = 'O';
      const score = minimax(test, 0, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }
    return bestMove;
  }, [minimax]);

  // Apply a move
  const makeMove = useCallback((idx, player) => {
    if (board[idx] !== null || winResult !== null || isPaused) return false;
    // X belongs to the player and O belongs to the scheduled bot turn. This
    // prevents rapid clicks/remote events from placing a bot piece manually.
    if ((player === 'X' && turn !== 'X') ||
        (player === 'O' && turn !== 'O')) return false;

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
        playSound('wrong');
      } else {
        setScores((s) => ({ ...s, ties: s.ties + 1 }));
      }
      return true;
    }

    // Switch turn
    const nextTurn = player === 'X' ? 'O' : 'X';
    setTurn(nextTurn);
    return true;
  }, [board, turn, winResult, isPaused, evaluateBoard]);

  // Handle AI turn when in 1P mode
  useEffect(() => {
    if (turn !== 'O' || winResult !== null || isPaused) {
      return;
    }

    setIsAiThinking(true);
    const delay = Math.floor(350 + Math.random() * 250);
    const timer = setTimeout(() => {
      const move = getAiMove(board);
      if (move !== null && board[move] === null) {
        makeMove(move, 'O');
      }
      setIsAiThinking(false);
    }, delay);

    return () => clearTimeout(timer);
    // Do not depend on isAiThinking here. Setting it to true re-renders the
    // component; having it as a dependency used to clean up this timeout
    // before the bot could place its move.
  }, [turn, winResult, isPaused, board, getAiMove, makeMove]);

  // Reset Game
  const resetGame = useCallback(() => {
    setBoard(createOpeningBoard());
    setTurn('X');
    setWinResult(null);
    setIsAiThinking(false);
    setCursor(4);
    setEndChoice(0);
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
      if (action === 'LEFT' || action === 'RIGHT') setEndChoice((choice) => choice === 0 ? 1 : 0);
      else if (action === 'ACTION_A' || action === 'START') endChoice === 0 ? resetGame() : onExit();
      return;
    }

    if (isAiThinking) return;

    // Mobile controllers can emit repeated direction events while a button is
    // held. Keep cursor movement deliberate and readable.
    if (['LEFT', 'RIGHT', 'UP', 'DOWN'].includes(action)) {
      const now = Date.now();
      if (now - lastNavigationAtRef.current < 140) return;
      lastNavigationAtRef.current = now;
    }

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
      makeMove(cursor, 'X');
    }
  }, [remoteAction, isPaused, winResult, isAiThinking, cursor, turn, makeMove, resetGame]);

  // Keyboard navigation on Host PC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPaused) return;

      if (winResult !== null) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setEndChoice((choice) => choice === 0 ? 1 : 0); }
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); endChoice === 0 ? resetGame() : onExit(); }
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
        makeMove(cursor, 'X');
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const targetIdx = parseInt(e.key, 10) - 1;
        setCursor(targetIdx);
        makeMove(targetIdx, 'X');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, winResult, isAiThinking, cursor, turn, makeMove, resetGame, endChoice, onExit]);

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
              <span className="text-[#58a6ff]">vs AI Bot</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">

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
              <span className="text-[#58a6ff]">(You)</span>
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
              <span className="text-[#f85149]">(Bot)</span>
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
                  : winResult.winner === 'X'
                    ? 'You won the match! 🎉'
                    : 'The bot won this round!'}
              </span>
            ) : isAiThinking ? (
              <span className="flex items-center gap-2 text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/30 px-3 py-1.5 rounded-lg font-bold">
                <Bot className="w-4 h-4" />
                <span>AI Bot is calculating move...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <span className="text-[#8b949e]">Turn:</span>
                <span className={`font-bold flex items-center gap-1 ${turn === 'X' ? 'text-[#58a6ff]' : 'text-[#f85149]'}`}>
                  <span className="text-sm font-black">{turn}</span>
                  <span>({turn === 'X' ? 'You' : 'Bot'})</span>
                </span>
              </span>
            )}
          </div>

        </div>

        {/* 3x3 Interactive Grid */}
        <div className="grid grid-cols-3 grid-rows-3 gap-3 w-72 aspect-square sm:w-80 mb-6 relative">
          {board.map((val, idx) => {
            const isCursor = idx === cursor;
            const isWinningCell = winResult && winResult.line && winResult.line.includes(idx);
            const isHovered = hoveredCell === idx && !val && !winResult && !isAiThinking;

            let cellClass = "bg-[#0d1117] border-[#30363d] text-[#c9d1d9]";

            if (isWinningCell) {
              cellClass = "bg-[#00ff85]/20 border-[#00ff85] shadow-[0_0_16px_rgba(0,255,133,0.45)]";
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
                  makeMove(idx, 'X');
                }}
                className={`aspect-square w-full rounded-2xl border flex items-center justify-center font-extrabold text-5xl sm:text-6xl transition-all cursor-pointer relative overflow-hidden group ${cellClass}`}
              >
                {/* Cell coordinate guide number in corner */}
                <span className="absolute top-1.5 left-2 text-[9px] font-mono-code text-[#30363d] group-hover:text-[#8b949e]">
                  {idx + 1}
                </span>

                {/* Placed Piece with Pop-In Animation */}
                {val === 'X' && (
                  <span className="text-[#58a6ff]">
                    ✕
                  </span>
                )}
                {val === 'O' && (
                  <span className="text-[#f85149]">
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

        {winResult && <EndGameActions selected={endChoice} onPlayAgain={resetGame} onExit={onExit} />}

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
