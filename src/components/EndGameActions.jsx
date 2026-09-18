import React from 'react';
import { DoorOpen, RotateCcw } from 'lucide-react';

export default function EndGameActions({ selected = 0, onPlayAgain, onExit }) {
  const choices = [
    { label: 'Play Again', icon: RotateCcw, action: onPlayAgain, activeClass: 'bg-[#58a6ff] text-[#0d1117] border-[#58a6ff]' },
    { label: 'Exit', icon: DoorOpen, action: onExit, activeClass: 'bg-[#f85149] text-white border-[#f85149]' },
  ];
  return (
    <div className="end-game-actions w-full max-w-sm mt-5">
      <div className="grid grid-cols-2 gap-3">
        {choices.map(({ label, icon: Icon, action, activeClass }, index) => (
          <button key={label} onClick={action} className={`py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out ${selected === index ? `${activeClass} ring-2 ring-white/30 scale-[1.03] shadow-lg` : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] scale-100'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-[10px] font-mono-code text-[#8b949e]">◀ ▶ choose &nbsp; • &nbsp; ACTION A / ENTER confirm</p>
    </div>
  );
}
