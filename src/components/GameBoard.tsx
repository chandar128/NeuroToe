import React, { useState, useEffect } from 'react';
import { BoardState, GameMode, MoveEvaluation, PlayerSymbol, Winner } from '../types';
import { Trophy, Bot, Equal, RotateCcw, ArrowLeftRight } from 'lucide-react';

interface GameBoardProps {
  board: BoardState;
  onCellClick: (index: number) => void;
  winningLine: number[] | null;
  winner: Winner;
  isAiThinking: boolean;
  isHumanTurn: boolean;
  humanSymbol: PlayerSymbol;
  aiSymbol: PlayerSymbol;
  aiEvaluation: MoveEvaluation | null;
  showBrainOverlay: boolean;
  disabled: boolean;
  gameMode: GameMode;
  onContinue: () => void;
  onSwitchSide: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  winningLine,
  winner,
  isAiThinking,
  isHumanTurn,
  humanSymbol,
  aiSymbol,
  aiEvaluation,
  showBrainOverlay,
  disabled,
  gameMode,
  onContinue,
  onSwitchSide,
}) => {
  // Graceful reveal state: allow last move and winning strike line to be fully seen before fading
  const [showOverlay, setShowOverlay] = useState<boolean>(false);

  useEffect(() => {
    if (winner) {
      // 850ms delay lets player clearly watch the final move land & the strike line animate
      const timer = setTimeout(() => {
        setShowOverlay(true);
      }, 850);
      return () => clearTimeout(timer);
    } else {
      setShowOverlay(false);
    }
  }, [winner]);

  // Compute SVG winning line coordinates
  const getLineCoordinates = (line: number[]) => {
    const getCenter = (idx: number) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      return {
        x: (col * 33.333 + 16.666).toFixed(2),
        y: (row * 33.333 + 16.666).toFixed(2),
      };
    };

    const start = getCenter(line[0]);
    const end = getCenter(line[2]);
    return { start, end };
  };

  const lineCoords = winningLine ? getLineCoordinates(winningLine) : null;
  const winningColor = winner === 'X' ? '#ef4444' : winner === 'O' ? '#38bdf8' : '#e2e8f0';

  const opponentName =
    gameMode === 'medium' ? 'Computer' : gameMode === 'minmax' ? 'MinMax' : 'Collective AI';

  const isHumanWinner = winner === humanSymbol;
  const isOpponentWinner = winner === aiSymbol;
  const isDraw = winner === 'draw';

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Turn & Status Indicator Banner */}
      <div className="w-full flex items-center justify-between mb-3 px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-medium">Turn:</span>
          {winner ? (
            <span className="font-semibold text-emerald-400">Match Concluded</span>
          ) : isAiThinking ? (
            <span className="flex items-center gap-1.5 text-sky-400 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              {opponentName} ({aiSymbol}) thinking...
            </span>
          ) : isHumanTurn ? (
            <span className="flex items-center gap-1.5 font-semibold text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Your Turn ({humanSymbol})
            </span>
          ) : (
            <span className="text-zinc-400">Waiting for next action</span>
          )}
        </div>

        {/* Brain overlay indicator */}
        {showBrainOverlay && aiEvaluation && !winner && (
          <div className="text-[11px] text-zinc-500 font-mono">
            Brain Overlay Active
          </div>
        )}
      </div>

      {/* The 3x3 Board Arena */}
      <div className="relative aspect-square w-full max-w-[420px] bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-3 shadow-2xl shadow-black/80 select-none overflow-hidden">
        {/* Background Grid Lines & Interactive Cells with Dynamic Brightness Fade Out */}
        <div
          className={`relative w-full h-full transition-all duration-700 ease-in-out ${
            showOverlay
              ? 'filter brightness-[0.20] contrast-[0.80] opacity-40 pointer-events-none'
              : 'filter brightness-100 opacity-100'
          }`}
        >
          {/* Background Grid Lines */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
            {/* Vertical Divider 1 */}
            <div className="absolute top-0 bottom-0 left-1/3 w-[3px] -translate-x-1/2 bg-zinc-700/60 rounded-full" />
            {/* Vertical Divider 2 */}
            <div className="absolute top-0 bottom-0 left-2/3 w-[3px] -translate-x-1/2 bg-zinc-700/60 rounded-full" />
            {/* Horizontal Divider 1 */}
            <div className="absolute left-0 right-0 top-1/3 h-[3px] -translate-y-1/2 bg-zinc-700/60 rounded-full" />
            {/* Horizontal Divider 2 */}
            <div className="absolute left-0 right-0 top-2/3 h-[3px] -translate-y-1/2 bg-zinc-700/60 rounded-full" />
          </div>

          {/* 9 Interactive Cells */}
          <div className="relative grid grid-cols-3 grid-rows-3 w-full h-full gap-2">
            {board.map((cell, idx) => {
              const isWinningCell = winningLine?.includes(idx);
              const canClick = !disabled && isHumanTurn && cell === '' && !winner;
              const evalScore = aiEvaluation?.scores[idx];
              const isPredictedHuman = aiEvaluation?.predictedHumanMove === idx;

              return (
                <button
                  key={idx}
                  onClick={() => canClick && onCellClick(idx)}
                  disabled={!canClick}
                  aria-label={`Cell ${idx + 1}, ${cell ? cell : 'empty'}`}
                  className={`relative flex items-center justify-center rounded-xl transition-all duration-150 p-2 ${
                    canClick
                      ? 'hover:bg-zinc-850/80 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-400'
                      : 'cursor-default'
                  } ${isWinningCell ? 'bg-zinc-900/90' : ''}`}
                >
                  {/* Mark Render */}
                  {cell === 'X' && (
                    <div className="w-4/5 h-4/5 flex items-center justify-center animate-scale-in">
                      <svg
                        viewBox="0 0 100 100"
                        className={`w-full h-full stroke-red-500 fill-none drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] ${
                          isWinningCell ? 'stroke-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : ''
                        }`}
                        strokeWidth="13"
                        strokeLinecap="round"
                      >
                        <line x1="20" y1="20" x2="80" y2="80" className="animate-draw-line" />
                        <line x1="80" y1="20" x2="20" y2="80" className="animate-draw-line" style={{ animationDelay: '60ms' }} />
                      </svg>
                    </div>
                  )}

                  {cell === 'O' && (
                    <div className="w-4/5 h-4/5 flex items-center justify-center animate-scale-in">
                      <svg
                        viewBox="0 0 100 100"
                        className={`w-full h-full stroke-sky-400 fill-none drop-shadow-[0_0_8px_rgba(56,189,248,0.4)] ${
                          isWinningCell ? 'stroke-sky-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]' : ''
                        }`}
                        strokeWidth="13"
                      >
                        <circle cx="50" cy="50" r="30" className="animate-draw-circle" />
                      </svg>
                    </div>
                  )}

                  {/* Empty cell hover preview for human player */}
                  {canClick && !cell && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-20 transition-opacity">
                      {humanSymbol === 'X' ? (
                        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5 stroke-red-400 fill-none" strokeWidth="10" strokeLinecap="round">
                          <line x1="25" y1="25" x2="75" y2="75" />
                          <line x1="75" y1="25" x2="25" y2="75" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5 stroke-sky-400 fill-none" strokeWidth="10">
                          <circle cx="50" cy="50" r="26" />
                        </svg>
                      )}
                    </div>
                  )}

                  {/* AI Brain Overlay on empty cell */}
                  {showBrainOverlay && cell === '' && evalScore !== undefined && !winner && (
                    <div className="absolute bottom-1 right-1.5 pointer-events-none flex flex-col items-end">
                      {isPredictedHuman && (
                        <span className="text-[9px] text-amber-400 font-semibold uppercase tracking-tight">
                          Pred
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono tabular-nums font-semibold px-1 rounded ${
                          evalScore > 0
                            ? 'text-emerald-400 bg-emerald-950/60'
                            : evalScore < 0
                            ? 'text-red-400 bg-red-950/60'
                            : 'text-zinc-400 bg-zinc-900/60'
                        }`}
                      >
                        {evalScore > 0 ? `+${evalScore}` : evalScore}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Winning Strike-Through Line SVG overlay */}
          {lineCoords && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              <line
                x1={`${lineCoords.start.x}%`}
                y1={`${lineCoords.start.y}%`}
                x2={`${lineCoords.end.x}%`}
                y2={`${lineCoords.end.y}%`}
                stroke={winningColor}
                strokeWidth="8"
                strokeLinecap="round"
                className="animate-strike-line drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              />
            </svg>
          )}
        </div>

        {/* Match Concluded Over-the-Board Overlay: appears with smooth animation after showing last move */}
        {showOverlay && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-[3px] rounded-2xl animate-fade-in text-center">
            {/* Status Icon Badge */}
            <div className="mb-2">
              {isHumanWinner && (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-emerald-400 mx-auto">
                  <Trophy className="w-6 h-6 animate-bounce" />
                </div>
              )}
              {isOpponentWinner && (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/20 text-rose-400 mx-auto">
                  <Bot className="w-6 h-6" />
                </div>
              )}
              {isDraw && (
                <div className="w-12 h-12 rounded-2xl bg-zinc-700/30 border border-zinc-600/40 flex items-center justify-center shadow-lg text-zinc-300 mx-auto">
                  <Equal className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 text-white">
              {isHumanWinner ? 'VICTORY!' : isOpponentWinner ? 'DEFEAT' : 'MATCH TIED'}
            </h2>

            {/* Context Subtitle */}
            <p className="text-xs text-zinc-300 mb-5 max-w-[280px] leading-relaxed">
              {isHumanWinner && `You bested the ${opponentName} in ${gameMode.toUpperCase()} mode.`}
              {isOpponentWinner && `${opponentName} claimed the winning line.`}
              {isDraw && 'Equally matched battle — zero tactical concessions.'}
            </p>

            {/* Over-the-Board Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-[320px]">
              <button
                onClick={onContinue}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Continue ({humanSymbol})</span>
              </button>

              <button
                onClick={onSwitchSide}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Switch Side ({aiSymbol})</span>
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 mt-3 font-mono">
              Clicking either button will commit & sync the score to the cloud
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
