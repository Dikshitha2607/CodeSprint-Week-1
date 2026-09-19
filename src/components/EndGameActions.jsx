import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function EndGameActions({ onPlayAgain }) {
  return (
    <div className="end-game-actions w-full max-w-sm mt-5">
      <button
        onClick={onPlayAgain}
        className="w-full py-3 rounded-xl border border-[#58a6ff] bg-[#58a6ff] text-[#0d1117] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#79c0ff] transition-colors cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
        Play Again
      </button>
      <p className="mt-3 text-center text-[10px] font-mono-code text-[#8b949e]">ACTION A / ENTER to play again</p>
    </div>
  );
}
