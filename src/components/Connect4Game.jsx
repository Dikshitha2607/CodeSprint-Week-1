import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Bot, Users, Trophy, ChevronDown, Gamepad2 } from 'lucide-react';
import { playSound } from '../utils/audio';

const ROWS = 6;
const COLS = 7;

export default function Connect4Game({ remoteAction, isPaused, restartCounter, onExit }) {
  const [grid, setGrid] = useState(() => Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
  const [turn, setTurn] = useState('Red'); // 'Red' (Player 1) | 'Yellow' (Player 2 / Bot)
  const [selectedCol, setSelectedCol] = useState(3); // Start at center column
  const [gameMode, setGameMode] = useState('1P'); // '1P' vs Bot | '2P' Local
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [winResult, setWinResult] = useState(null); // null | { winner: 'Red'|'Yellow', cells: [{r, c}] } | { winner: 'Draw' }
  const [lastDropped, setLastDropped] = useState(null); // { r, c } for drop animation
  const [scores, setScores] = useState({ red: 0, yellow: 0, draws: 0 });

  const lastHandledTimeRef = useRef(0);

  // Find lowest available row in a column
  const getAvailableRow = useCallback((g, col) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!g[r][col]) return r;
    }
    return -1;
  }, []);

  // Check for Connect 4 and return all 4 winning cell coordinates
  const checkWinFromGrid = useCallback((g) => {
    // 1. Horizontal (-)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const color = g[r][c];
        if (color && color === g[r][c + 1] && color === g[r][c + 2] && color === g[r][c + 3]) {
          return {
            winner: color,
            cells: [{ r, c }, { r, c: c + 1 }, { r, c: c + 2 }, { r, c: c + 3 }]
          };
        }
      }
    }

    // 2. Vertical (|)
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        const color = g[r][c];
        if (color && color === g[r + 1][c] && color === g[r + 2][c] && color === g[r + 3][c]) {
          return {
            winner: color,
            cells: [{ r, c }, { r: r + 1, c }, { r: r + 2, c }, { r: r + 3, c }]
          };
        }
      }
    }

    // 3. Diagonal Down-Right (\)
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const color = g[r][c];
        if (color && color === g[r + 1][c + 1] && color === g[r + 2][c + 2] && color === g[r + 3][c + 3]) {
          return {
            winner: color,
            cells: [{ r, c }, { r: r + 1, c: c + 1 }, { r: r + 2, c: c + 2 }, { r: r + 3, c: c + 3 }]
          };
        }
      }
    }

    // 4. Diagonal Up-Right (/)
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const color = g[r][c];
        if (color && color === g[r - 1][c + 1] && color === g[r - 2][c + 2] && color === g[r - 3][c + 3]) {
          return {
            winner: color,
            cells: [{ r, c }, { r: r - 1, c: c + 1 }, { r: r - 2, c: c + 2 }, { r: r - 3, c: c + 3 }]
          };
        }
      }
    }

    // Check Draw (all columns full)
    const isFull = g.every((row) => row.every((cell) => cell !== null));
    if (isFull) {
      return { winner: 'Draw', cells: [] };
    }

    return null;
  }, []);

  // Drop disc into column
  const dropDisc = useCallback((col, color) => {
    if (winResult !== null || isPaused || col < 0 || col >= COLS) return false;

    const row = getAvailableRow(grid, col);
    if (row === -1) return false; // Column is full

    const nextGrid = grid.map((r) => [...r]);
    nextGrid[row][col] = color;
    setGrid(nextGrid);
    setLastDropped({ r: row, c: col });
    playSound('drop');

    const result = checkWinFromGrid(nextGrid);
    if (result) {
      setWinResult(result);
      if (result.winner === 'Red') {
        setScores((s) => ({ ...s, red: s.red + 1 }));
        playSound('win');
      } else if (result.winner === 'Yellow') {
        setScores((s) => ({ ...s, yellow: s.yellow + 1 }));
        playSound(gameMode === '1P' ? 'wrong' : 'win');
      } else {
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
      }
      return true;
    }

    // Switch turn
    setTurn(color === 'Red' ? 'Yellow' : 'Red');
    return true;
  }, [grid, winResult, isPaused, getAvailableRow, checkWinFromGrid, gameMode]);

  // AI Move Calculation (Smart lookahead without freezing the UI)
  const calculateAiMove = useCallback(() => {
    const validCols = [3, 2, 4, 1, 5, 0, 6].filter((c) => getAvailableRow(grid, c) !== -1);
    if (validCols.length === 0) return null;

    // 1. Can AI (Yellow) win this turn?
    for (const c of validCols) {
      const r = getAvailableRow(grid, c);
      const test = grid.map((row) => [...row]);
      test[r][c] = 'Yellow';
      const win = checkWinFromGrid(test);
      if (win && win.winner === 'Yellow') return c;
    }

    // 2. Can Player (Red) win next turn? Block them!
    for (const c of validCols) {
      const r = getAvailableRow(grid, c);
      const test = grid.map((row) => [...row]);
      test[r][c] = 'Red';
      const win = checkWinFromGrid(test);
      if (win && win.winner === 'Red') return c;
    }

    // 3. Avoid moves that let Player win immediately above our move
    const safeCols = validCols.filter((c) => {
      const r = getAvailableRow(grid, c);
      if (r <= 0) return true;
      const test = grid.map((row) => [...row]);
      test[r][c] = 'Yellow';
      test[r - 1][c] = 'Red';
      const win = checkWinFromGrid(test);
      return !win || win.winner !== 'Red';
    });

    const candidates = safeCols.length > 0 ? safeCols : validCols;

    // Prefer center columns (3 > 2,4 > 1,5 > 0,6)
    return candidates[0];
  }, [grid, getAvailableRow, checkWinFromGrid]);

  // Handle AI turn
  useEffect(() => {
    if (gameMode !== '1P' || turn !== 'Yellow' || winResult !== null || isPaused || isAiThinking) {
      return;
    }

    setIsAiThinking(true);
    const delay = Math.floor(400 + Math.random() * 250);
    const timer = setTimeout(() => {
      const move = calculateAiMove();
      if (move !== null) {
        setSelectedCol(move);
        dropDisc(move, 'Yellow');
      }
      setIsAiThinking(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [gameMode, turn, winResult, isPaused, isAiThinking, calculateAiMove, dropDisc]);

  // Reset Game
  const resetGame = useCallback(() => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setTurn('Red');
    setWinResult(null);
    setLastDropped(null);
    setSelectedCol(3);
    setIsAiThinking(false);
  }, []);

  // Handle external restart trigger
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
      setSelectedCol((prev) => (prev > 0 ? prev - 1 : COLS - 1));
    } else if (action === 'RIGHT') {
      playSound('move');
      setSelectedCol((prev) => (prev < COLS - 1 ? prev + 1 : 0));
    } else if (action === 'ACTION_A' || action === 'ACTION_B' || action === 'START' || action === 'DOWN') {
      dropDisc(selectedCol, turn);
    }
  }, [remoteAction, isPaused, winResult, isAiThinking, selectedCol, turn, dropDisc, resetGame]);

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

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        playSound('move');
        setSelectedCol((prev) => (prev > 0 ? prev - 1 : COLS - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        playSound('move');
        setSelectedCol((prev) => (prev < COLS - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        dropDisc(selectedCol, turn);
      } else if (e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const colIdx = parseInt(e.key, 10) - 1;
        setSelectedCol(colIdx);
        dropDisc(colIdx, turn);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, winResult, isAiThinking, selectedCol, turn, dropDisc, resetGame]);

  // Helper to check if a cell is in the winning 4
  const isWinningCell = (r, c) => {
    if (!winResult || !winResult.cells) return false;
    return winResult.cells.some((cell) => cell.r === r && cell.c === c);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[620px] bg-[#0b0e14] text-[#ffffff] p-4 sm:p-6 select-none">
      {/* Top Header Bar */}
      <div className="w-full max-w-xl flex items-center justify-between mb-3 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f85149]/10 border border-[#f85149]/30 flex items-center justify-center text-[#f85149] font-bold text-lg">
            🔴
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#ffffff] tracking-tight">Connect 4</h2>
            <div className="flex items-center gap-2 text-[11px] font-mono-code text-[#8b949e]">
              <span>4-in-a-Row Arena</span>
              <span>•</span>
              <span className="text-[#f85149]">{gameMode === '1P' ? 'vs AI Bot' : '2 Players (Local)'}</span>
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
      <div className="w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-2xl p-5 sm:p-7 flex flex-col items-center shadow-2xl relative overflow-hidden">
        
        {/* Scoreboard */}
        <div className="w-full grid grid-cols-3 gap-3 mb-4 font-mono-code text-center">
          <div className={`p-2 rounded-xl border transition-all ${
            turn === 'Red' && !winResult
              ? 'bg-[#f85149]/15 border-[#f85149] shadow-[0_0_15px_rgba(248,81,73,0.3)]'
              : 'bg-[#0d1117] border-[#30363d]'
          }`}>
            <div className="text-[10px] text-[#8b949e] flex items-center justify-center gap-1 font-bold">
              <span>RED DISC</span>
              {gameMode === '1P' && <span className="text-[#f85149]">(You)</span>}
            </div>
            <div className="text-xl font-black text-[#f85149]">{scores.red}</div>
          </div>

          <div className="p-2 rounded-xl border bg-[#0d1117] border-[#30363d]">
            <div className="text-[10px] text-[#8b949e] font-bold">DRAWS</div>
            <div className="text-xl font-black text-[#c9d1d9]">{scores.draws}</div>
          </div>

          <div className={`p-2 rounded-xl border transition-all ${
            turn === 'Yellow' && !winResult
              ? 'bg-[#facc15]/15 border-[#facc15] shadow-[0_0_15px_rgba(250,204,21,0.3)]'
              : 'bg-[#0d1117] border-[#30363d]'
          }`}>
            <div className="text-[10px] text-[#8b949e] flex items-center justify-center gap-1 font-bold">
              <span>YELLOW DISC</span>
              {gameMode === '1P' && <span className="text-[#facc15]">(Bot)</span>}
            </div>
            <div className="text-xl font-black text-[#facc15]">{scores.yellow}</div>
          </div>
        </div>

        {/* Turn & Status Message */}
        <div className="w-full flex items-center justify-between mb-3 px-1 font-mono-code text-xs">
          {winResult ? (
            <span className="flex items-center gap-1.5 font-bold text-[#00ff85] bg-[#00ff85]/10 border border-[#00ff85]/30 px-3 py-1.5 rounded-lg text-sm w-full justify-center">
              <Trophy className="w-4 h-4" />
              {winResult.winner === 'Draw'
                ? "Board Full! Match is a Draw."
                : `Connect 4! ${winResult.winner} Player Wins! 🎉`}
            </span>
          ) : isAiThinking ? (
            <span className="flex items-center gap-2 text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/30 px-3 py-1.5 rounded-lg animate-pulse font-bold w-full justify-center">
              <Bot className="w-4 h-4 animate-spin" />
              <span>AI Bot is planning disc placement...</span>
            </span>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 text-[#8b949e]">
                <span>Turn:</span>
                <span className={`font-bold flex items-center gap-1.5 ${turn === 'Red' ? 'text-[#f85149]' : 'text-[#facc15]'}`}>
                  <span className={`w-3 h-3 rounded-full ${turn === 'Red' ? 'bg-[#f85149]' : 'bg-[#facc15]'}`}></span>
                  <span>{turn}</span>
                  <span>({gameMode === '1P' ? (turn === 'Red' ? 'You' : 'Bot') : `Player ${turn}`})</span>
                </span>
              </span>
              <span className="text-[10px] text-[#8b949e]">Column: {selectedCol + 1} of 7</span>
            </div>
          )}
        </div>

        {/* Floating Disc / Column Selector Arrow Row */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3 w-full max-w-sm sm:max-w-md px-3 mb-1">
          {Array.from({ length: COLS }).map((_, cIdx) => {
            const isSelected = cIdx === selectedCol && !winResult;
            const isColFull = getAvailableRow(grid, cIdx) === -1;

            return (
              <div
                key={cIdx}
                onClick={() => {
                  setSelectedCol(cIdx);
                  if (!isColFull && !isAiThinking) dropDisc(cIdx, turn);
                }}
                className="flex flex-col items-center justify-end h-7 cursor-pointer group"
              >
                {isSelected ? (
                  <div className="flex flex-col items-center animate-bounce">
                    <span className={`w-4 h-4 rounded-full border shadow-md ${
                      turn === 'Red' ? 'bg-[#f85149] border-[#f85149] shadow-[0_0_10px_rgba(248,81,73,0.8)]' : 'bg-[#facc15] border-[#facc15] shadow-[0_0_10px_rgba(250,204,21,0.8)]'
                    }`} />
                  </div>
                ) : (
                  <span className="text-[10px] text-[#30363d] group-hover:text-[#8b949e] font-mono-code">
                    {cIdx + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* The Connect 4 Board Stand */}
        <div className="bg-[#1b222d] border-4 border-[#2d3748] rounded-2xl p-3 sm:p-4 shadow-2xl relative w-full max-w-sm sm:max-w-md">
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {grid.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const isSelectedCol = cIdx === selectedCol && !winResult;
                const isWinning = isWinningCell(rIdx, cIdx);
                const isRecentDrop = lastDropped && lastDropped.r === rIdx && lastDropped.c === cIdx;

                let cellColorClass = 'bg-[#0d1117] border-[#30363d] shadow-inner';

                if (cell === 'Red') {
                  cellColorClass = 'bg-gradient-to-br from-[#f85149] to-[#d03a32] border-[#f85149] shadow-[0_0_14px_rgba(248,81,73,0.6)]';
                } else if (cell === 'Yellow') {
                  cellColorClass = 'bg-gradient-to-br from-[#facc15] to-[#ca8a04] border-[#facc15] shadow-[0_0_14px_rgba(250,204,21,0.6)]';
                }

                if (isWinning) {
                  cellColorClass += ' ring-4 ring-[#00ff85] shadow-[0_0_24px_rgba(0,255,133,0.9)] animate-win-pulse z-10';
                }

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => {
                      setSelectedCol(cIdx);
                      if (getAvailableRow(grid, cIdx) !== -1 && !isAiThinking) {
                        dropDisc(cIdx, turn);
                      }
                    }}
                    className={`aspect-square rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${cellColorClass} ${
                      isRecentDrop ? 'animate-drop-disc' : ''
                    } ${isSelectedCol && !cell ? 'hover:border-[#58a6ff]/50' : ''}`}
                  >
                    {/* Visual 3D rim highlight on discs */}
                    {cell && (
                      <div className="w-4/5 h-4/5 rounded-full border border-white/25 flex items-center justify-center">
                        <div className="w-1/3 h-1/3 rounded-full bg-white/20" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Controls & Footer Navigation */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-[#30363d]/60 text-xs font-mono-code text-[#8b949e]">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#0d1117] border border-[#30363d] text-[10px] text-[#58a6ff]">◄ ►</span>
            <span>Select column</span>
            <span className="p-1 rounded bg-[#0d1117] border border-[#30363d] text-[10px] text-[#58a6ff]">▼ / ENTER</span>
            <span>Drop disc</span>
          </div>

          <button
            onClick={resetGame}
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#ffffff] font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-[#30363d] hover:border-[#58a6ff]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{winResult ? 'Play Again' : 'Reset Grid'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
