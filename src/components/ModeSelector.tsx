import React, { useRef } from 'react';
import { GameMode } from '../types';
import { Bot, Brain, Cpu, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface ModeSelectorProps {
  gameMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

interface ModeOption {
  id: GameMode;
  label: string;
  opponent: string;
  description: string;
  icon: React.ReactNode;
  activeColor: string;
}

const MODES: ModeOption[] = [
  {
    id: 'medium',
    label: 'Medium Mode',
    opponent: 'Human vs Computer',
    description: 'Tactical block & win heuristics',
    icon: <Cpu className="w-4 h-4" />,
    activeColor: 'border-zinc-500 bg-zinc-850 text-white shadow-md shadow-zinc-800/40',
  },
  {
    id: 'minmax',
    label: 'MinMax Mode',
    opponent: 'Human vs MinMax',
    description: 'Mathematically unbeatable game tree',
    icon: <Bot className="w-4 h-4" />,
    activeColor: 'border-rose-500/80 bg-rose-950/40 text-white shadow-md shadow-rose-900/20',
  },
  {
    id: 'ai',
    label: 'AI Mode',
    opponent: 'Human vs AI',
    description: 'Collective cloud brain (learns from all players)',
    icon: <Brain className="w-4 h-4" />,
    activeColor: 'border-sky-500/80 bg-sky-950/40 text-white shadow-md shadow-sky-900/20',
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ gameMode, onSelectMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation support: Arrow Left/Right to change mode
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % MODES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + MODES.length) % MODES.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectMode(MODES[index].id);
      sound.playClick();
      return;
    } else {
      return;
    }

    e.preventDefault();
    const nextMode = MODES[nextIndex].id;
    onSelectMode(nextMode);
    sound.playClick();

    // Move focus to next button
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons?.[nextIndex]?.focus();
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-4">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <label id="mode-selector-label" className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <span>Game Mode</span>
          <span className="text-zinc-500 font-normal">· Select opponent difficulty</span>
        </label>
        <span className="text-[11px] text-zinc-500 hidden sm:inline">
          Use Arrow keys or Click
        </span>
      </div>

      <div
        ref={containerRef}
        role="radiogroup"
        aria-labelledby="mode-selector-label"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
      >
        {MODES.map((mode, index) => {
          const isSelected = gameMode === mode.id;

          return (
            <button
              key={mode.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                if (gameMode !== mode.id) {
                  onSelectMode(mode.id);
                  sound.playClick();
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`relative flex flex-col items-start text-left p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer min-h-[64px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                isSelected
                  ? `${mode.activeColor} ring-1 ring-white/10`
                  : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              {/* Active Indicator Pip */}
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={isSelected ? 'text-white' : 'text-zinc-500'}>
                    {mode.icon}
                  </span>
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                    {mode.label}
                  </span>
                </div>

                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-sky-400 bg-sky-500' : 'border-zinc-700 bg-zinc-800'
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
              </div>

              <div className="text-[11px] font-medium text-zinc-300 leading-tight">
                {mode.opponent}
              </div>

              <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight line-clamp-1">
                {mode.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
