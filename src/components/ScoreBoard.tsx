import React from 'react';
import { GameMode, PlayerSymbol, UniversalScores } from '../types';
import { Trophy, Bot, Equal, Globe, Sparkles, Brain, Cpu } from 'lucide-react';

interface ScoreBoardProps {
  gameMode: GameMode;
  universalScores: UniversalScores;
  playerSymbol: PlayerSymbol;
  aiSymbol: PlayerSymbol;
  cloudBrainEpisodes: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  gameMode,
  universalScores,
  playerSymbol,
  aiSymbol,
  cloudBrainEpisodes,
}) => {
  // Mode-specific labels strictly conforming to the user request:
  // - Medium: Human vs Computer
  // - MinMax: Human vs MinMax
  // - AI: Human vs AI
  const getModeInfo = () => {
    switch (gameMode) {
      case 'medium':
        return {
          title: 'Medium Mode',
          humanLabel: `HUMAN (${playerSymbol})`,
          opponentLabel: `COMPUTER (${aiSymbol})`,
          humanScore: universalScores.medium.human,
          opponentScore: universalScores.medium.computer,
          draws: universalScores.medium.draws,
          totalGames: universalScores.medium.totalGames,
          badgeColor: 'text-zinc-300',
          badgeText: 'Tactical Heuristics Engine',
          badgeIcon: <Cpu className="w-3.5 h-3.5 text-zinc-400" />,
        };
      case 'minmax':
        return {
          title: 'MinMax Mode',
          humanLabel: `HUMAN (${playerSymbol})`,
          opponentLabel: `MINMAX (${aiSymbol})`,
          humanScore: universalScores.minmax.human,
          opponentScore: universalScores.minmax.minmax,
          draws: universalScores.minmax.draws,
          totalGames: universalScores.minmax.totalGames,
          badgeColor: 'text-rose-400',
          badgeText: 'Unbeatable Alpha-Beta Pruned Game Tree',
          badgeIcon: <Bot className="w-3.5 h-3.5 text-rose-400" />,
        };
      case 'ai':
      default:
        return {
          title: 'AI Mode',
          humanLabel: `HUMAN (${playerSymbol})`,
          opponentLabel: `AI (${aiSymbol})`,
          humanScore: universalScores.ai.human,
          opponentScore: universalScores.ai.ai,
          draws: universalScores.ai.draws,
          totalGames: universalScores.ai.totalGames,
          badgeColor: 'text-sky-400',
          badgeText: `Collective Cloud Brain · ${cloudBrainEpisodes} global games learned`,
          badgeIcon: <Brain className="w-3.5 h-3.5 text-sky-400" />,
        };
    }
  };

  const info = getModeInfo();

  return (
    <div className="w-full max-w-xl mx-auto mb-4 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-lg">
      {/* Universal Cloud Synchronized Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-200">{info.title}</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>You: <strong className={playerSymbol === 'X' ? 'text-red-400' : 'text-sky-400'}>{playerSymbol}</strong></span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>Opponent: <strong className={aiSymbol === 'X' ? 'text-red-400' : 'text-sky-400'}>{aiSymbol}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
          <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Universal Scores</span>
        </div>
      </div>

      {/* Mode Information & Cloud Status Banner */}
      <div className="mb-3 px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 border bg-zinc-950/70 border-zinc-800">
        <div className="flex items-center gap-1.5 truncate">
          {info.badgeIcon}
          <span className={`font-medium truncate ${info.badgeColor}`}>
            {info.badgeText}
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono shrink-0">
          {info.totalGames} total global games
        </span>
      </div>

      {/* 3 Universal Score Columns */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Human Column */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg py-2 px-3">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Trophy className="w-3 h-3 text-red-400 shrink-0" />
            <span className="truncate">{info.humanLabel}</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-500 mt-0.5">
            {info.humanScore}
          </div>
        </div>

        {/* Mode-Specific Opponent Column (Computer, MinMax, or AI) */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg py-2 px-3">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Bot className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="truncate">{info.opponentLabel}</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-sky-400 mt-0.5">
            {info.opponentScore}
          </div>
        </div>

        {/* Draws Column */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg py-2 px-3">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Equal className="w-3 h-3 text-zinc-400 shrink-0" />
            <span>DRAWS</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-zinc-200 mt-0.5">
            {info.draws}
          </div>
        </div>
      </div>
    </div>
  );
};
