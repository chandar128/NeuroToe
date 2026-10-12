import React from 'react';
import { GameMode, MoveEvaluation, PlayerSymbol, CollectiveAiBrain } from '../types';
import { Brain, Cpu, Bot, Globe, Activity } from 'lucide-react';

interface AiInspectorProps {
  gameMode: GameMode;
  evaluation: MoveEvaluation | null;
  aiSymbol: PlayerSymbol;
  humanSymbol: PlayerSymbol;
  cloudBrain: CollectiveAiBrain;
}

export const AiInspector: React.FC<AiInspectorProps> = ({
  gameMode,
  evaluation,
  aiSymbol,
  humanSymbol,
  cloudBrain,
}) => {
  return (
    <aside className="w-full max-w-xl mx-auto mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              AI Decision Telemetry
            </h3>
            <span className="text-[11px] text-zinc-500">
              {gameMode === 'ai' ? 'Synchronized Cloud Neural Memory' : 'Local Heuristic Analysis'}
            </span>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-sky-300">
          {gameMode === 'medium'
            ? 'Computer (Medium)'
            : gameMode === 'minmax'
            ? 'MinMax Alpha-Beta'
            : 'Collective Cloud AI'}
        </span>
      </div>

      {/* Mode 1: Medium (Computer) */}
      {gameMode === 'medium' && (
        <div className="space-y-3 text-xs text-zinc-300">
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-zinc-200">1-Ply Tactical Heuristic</span>
              <span className="font-mono text-zinc-400 text-[11px]">Computer Opponent</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Scans for immediate 3-in-a-row opportunities to score a win, detects immediate human threats to execute tactical blocks, and plays positional moves otherwise.
            </p>
          </div>

          {evaluation && (
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
              <span className="font-semibold text-zinc-200 block mb-1">
                Computer Move Evaluation
              </span>
              <p className="text-[11px] text-zinc-400">
                {evaluation.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: MinMax Mode */}
      {gameMode === 'minmax' && (
        <div className="space-y-3 text-xs text-zinc-300">
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-zinc-200">Recursive Game Tree</span>
              <span className="font-mono text-emerald-400 text-[11px]">Alpha-Beta Pruned</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Expands the complete game graph with depth bounding. Prunes branches mathematically guaranteed to yield inferior utility. Mathematically unyielding: cannot be beaten.
            </p>
          </div>

          {evaluation && (
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
              <span className="font-semibold text-zinc-200 block mb-1">
                MinMax Target Evaluation
              </span>
              <p className="text-[11px] text-zinc-400 mb-1">
                {evaluation.explanation}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span>Best Move: <strong className="text-sky-400 font-mono">#{evaluation.bestMove}</strong></span>
                {evaluation.depthOrConfidence !== undefined && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Game Value: <strong className="text-emerald-400 font-mono">{evaluation.depthOrConfidence}</strong></span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: AI Mode (Learns from all players in cloud) */}
      {gameMode === 'ai' && (
        <div className="space-y-3 text-xs text-zinc-300">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 text-center">
              <span className="text-[10px] text-zinc-500 block uppercase">Global Games</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {cloudBrain.episodesTrained}
              </span>
            </div>
            <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 text-center">
              <span className="text-[10px] text-zinc-500 block uppercase">Q-Table States</span>
              <span className="text-base font-bold font-mono text-sky-400">
                {Object.keys(cloudBrain.qTable || {}).length}
              </span>
            </div>
            <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 text-center">
              <span className="text-[10px] text-zinc-500 block uppercase">Exploration ε</span>
              <span className="text-base font-bold font-mono text-amber-400">
                {((cloudBrain.epsilon ?? 0.2) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Global Human Placement Frequency Heatmap */}
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold text-zinc-200">
                  Global Player Habit Heatmap
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                Learned from all players
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
              Every move made by any player in this app is aggregated into the cloud brain below. The AI uses this distribution to anticipate player openings and block favorite traps:
            </p>
            <div className="grid grid-cols-3 gap-1.5 w-36 mx-auto">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
                const count = cloudBrain.positionStats?.[idx] || 0;
                return (
                  <div
                    key={idx}
                    className="h-9 rounded bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-[10px] font-mono text-zinc-300"
                    title={`Cell #${idx}: Selected ${count} times by players worldwide`}
                  >
                    <span className="text-[9px] text-zinc-500">#{idx}</span>
                    <span className={`font-bold ${count > 0 ? 'text-sky-400' : 'text-zinc-600'}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {evaluation && (
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
              <span className="font-semibold text-zinc-200 block mb-1">
                Cloud Brain Heuristic
              </span>
              <p className="text-[11px] text-zinc-400">
                {evaluation.explanation}
              </p>
              {evaluation.predictedHumanMove !== undefined && (
                <div className="mt-1.5 text-[11px] text-amber-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Predicted global player move: <strong className="font-mono text-amber-200">Cell #{evaluation.predictedHumanMove}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
