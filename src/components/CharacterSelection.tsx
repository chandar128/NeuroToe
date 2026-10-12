import React from 'react';
import { PlayerSymbol } from '../types';
import { sound } from '../utils/audio';

interface CharacterSelectionProps {
  onSelect: (symbol: PlayerSymbol) => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({ onSelect }) => {
  const handleSelect = (symbol: PlayerSymbol) => {
    sound.playClick();
    onSelect(symbol);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center py-10 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          Choose Your Symbol
        </h2>
        <p className="text-sm text-zinc-400">
          Pick your side to initiate the game loop.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 w-full max-w-md mb-8">
        {/* Choice X */}
        <button
          onClick={() => handleSelect('X')}
          className="group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-zinc-900 border-2 border-zinc-800 hover:border-red-500/80 hover:bg-zinc-850 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-200 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label="Choose symbol X"
        >
          <div className="w-24 h-24 flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105">
            <svg viewBox="0 0 100 100" className="w-full h-full stroke-red-500 fill-none" strokeWidth="14" strokeLinecap="round">
              <line x1="20" y1="20" x2="80" y2="80" />
              <line x1="80" y1="20" x2="20" y2="80" />
            </svg>
          </div>
          <span className="text-lg font-bold text-red-400 group-hover:text-red-300">
            Play as X
          </span>
          <span className="text-xs text-zinc-500 mt-1">
            Moves First
          </span>
        </button>

        {/* Choice O */}
        <button
          onClick={() => handleSelect('O')}
          className="group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-zinc-900 border-2 border-zinc-800 hover:border-sky-500/80 hover:bg-zinc-850 hover:shadow-2xl hover:shadow-sky-500/20 transition-all duration-200 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500"
          aria-label="Choose symbol O"
        >
          <div className="w-24 h-24 flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105">
            <svg viewBox="0 0 100 100" className="w-full h-full stroke-sky-400 fill-none" strokeWidth="14">
              <circle cx="50" cy="50" r="32" />
            </svg>
          </div>
          <span className="text-lg font-bold text-sky-400 group-hover:text-sky-300">
            Play as O
          </span>
          <span className="text-xs text-zinc-500 mt-1">
            AI Moves First
          </span>
        </button>
      </div>

      <div className="text-xs text-zinc-500 font-medium tracking-wide">
        Rule: <strong className="text-zinc-300">X always goes first!</strong>
      </div>
    </div>
  );
};
