import React from 'react';
import { GameMode } from '../types';
import { Volume2, VolumeX, Cpu, RotateCcw, Cloud, Sparkles } from 'lucide-react';
import { TicTacToeBotLogo } from './TicTacToeBotLogo';

interface HeaderProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  showInspector: boolean;
  setShowInspector: (show: boolean) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onNewGame: () => void;
  isCloudConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  gameMode,
  setGameMode,
  showInspector,
  setShowInspector,
  isMuted,
  onToggleMute,
  onNewGame,
  isCloudConnected,
}) => {
  return (
    <header className="w-full border-b border-zinc-800 bg-black/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark & Bot Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <TicTacToeBotLogo className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white font-sans leading-tight">
              NeuroToe <span className="text-xs font-normal text-zinc-400 hidden sm:inline">Arena</span>
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>Universal Cloud Sync</span>
            </div>
          </div>
        </div>

        {/* Zone 2: The 3 Modes (Medium, MinMax, AI Mode) */}
        <nav aria-label="Game Modes" className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium overflow-x-auto max-w-full">
          <button
            onClick={() => setGameMode('medium')}
            aria-label="Switch to Medium Mode: Human vs Computer"
            aria-pressed={gameMode === 'medium'}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-400 ${
              gameMode === 'medium'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Medium</span>
            <span className="text-[10px] text-zinc-400 font-normal hidden lg:inline">(Computer)</span>
          </button>

          <button
            onClick={() => setGameMode('minmax')}
            aria-label="Switch to MinMax Mode: Human vs MinMax"
            aria-pressed={gameMode === 'minmax'}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-400 ${
              gameMode === 'minmax'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>MinMax</span>
            <span className="text-[10px] text-rose-300 font-normal hidden lg:inline">(Unbeatable)</span>
          </button>

          <button
            onClick={() => setGameMode('ai')}
            aria-label="Switch to AI Mode: Human vs Collective AI"
            aria-pressed={gameMode === 'ai'}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-400 ${
              gameMode === 'ai'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>AI Mode</span>
            <span className="text-[10px] text-sky-300 font-normal hidden sm:inline">(Cloud)</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              showInspector
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-xs'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
            title="Inspect AI Thought Process & Live Values"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Brain</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onNewGame}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title="Start New Round"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Round</span>
          </button>
        </div>
      </div>
    </header>
  );
};
