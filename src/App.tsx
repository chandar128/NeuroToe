/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BoardState,
  CollectiveAiBrain,
  GameMode,
  GameStatus,
  MoveEvaluation,
  PlayerSymbol,
  UniversalScores,
  Winner,
} from './types';
import { Header } from './components/Header';
import { ScoreBoard } from './components/ScoreBoard';
import { ModeSelector } from './components/ModeSelector';
import { CharacterSelection } from './components/CharacterSelection';
import { GameBoard } from './components/GameBoard';
import { AiInspector } from './components/AiInspector';
import { checkWin, getClassicAiMove, getWinningLine, getAvailableMoves } from './ai/minimaxAI';
import { collectiveAi } from './ai/collectiveAI';
import {
  subscribeToUniversalScores,
  subscribeToCollectiveAiBrain,
  recordUniversalGameOutcome,
  getCachedUniversalScores,
  saveCachedUniversalScores,
  getCachedCollectiveBrain,
  DEFAULT_UNIVERSAL_SCORES,
  DEFAULT_COLLECTIVE_BRAIN,
} from './services/cloudSync';
import { sound } from './utils/audio';

export default function App() {
  // Game Setup & Status (Modes: 'medium', 'minmax', 'ai')
  const [gameMode, setGameMode] = useState<GameMode>('medium');
  const [gameStatus, setGameStatus] = useState<GameStatus>('CHARACTER_SELECTION');

  // Player & Symbol State
  const [humanSymbol, setHumanSymbol] = useState<PlayerSymbol>('X');
  const [aiSymbol, setAiSymbol] = useState<PlayerSymbol>('O');
  const [currentTurn, setCurrentTurn] = useState<PlayerSymbol>('X'); // X always goes first!

  // Board State
  const [board, setBoard] = useState<BoardState>(['', '', '', '', '', '', '', '', '']);
  const [winner, setWinner] = useState<Winner>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Inspector & Telemetry
  const [aiEvaluation, setAiEvaluation] = useState<MoveEvaluation | null>(null);
  const [showInspector, setShowInspector] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Universal Cloud Scores & Collective AI Brain (Loads from Cache or Cloud Instantly)
  const [universalScores, setUniversalScores] = useState<UniversalScores>(getCachedUniversalScores);
  const [cloudBrain, setCloudBrain] = useState<CollectiveAiBrain>(getCachedCollectiveBrain);

  // Pending Match Outcome ref: syncs win/loss as soon as Continue or Switch Side is clicked
  const pendingMatchRef = useRef<{
    mode: GameMode;
    winner: Winner;
    humanSymbol: PlayerSymbol;
    aiSymbol: PlayerSymbol;
  } | null>(null);

  // Commit pending outcome and sync to cloud
  const commitPendingOutcome = useCallback(() => {
    const pending = pendingMatchRef.current;
    if (!pending || !pending.winner) return;

    const { mode, winner: winResult, humanSymbol: hSym, aiSymbol: aSym } = pending;
    pendingMatchRef.current = null;

    // Immediately update local universal score state and cache
    setUniversalScores((prev) => {
      const next: UniversalScores = {
        medium: { ...prev.medium },
        minmax: { ...prev.minmax },
        ai: { ...prev.ai },
      };
      if (mode === 'medium') {
        if (winResult === 'draw') next.medium.draws += 1;
        else if (winResult === hSym) next.medium.human += 1;
        else next.medium.computer += 1;
        next.medium.totalGames += 1;
      } else if (mode === 'minmax') {
        if (winResult === 'draw') next.minmax.draws += 1;
        else if (winResult === hSym) next.minmax.human += 1;
        else next.minmax.minmax += 1;
        next.minmax.totalGames += 1;
      } else {
        if (winResult === 'draw') next.ai.draws += 1;
        else if (winResult === hSym) next.ai.human += 1;
        else next.ai.ai += 1;
        next.ai.totalGames += 1;
      }
      saveCachedUniversalScores(next);
      return next;
    });

    // 1. Record Universal Global Score in Cloud Firestore
    recordUniversalGameOutcome(mode, winResult, hSym).catch((err) =>
      console.warn('Universal score record err:', err)
    );

    // 2. Update the collective cloud brain memory across all finished matches so telemetry updates immediately
    collectiveAi
      .finalizeMatch(winResult, aSym)
      .then((updatedBrain) => {
        setCloudBrain(updatedBrain);
      })
      .catch((err) => console.warn('Collective AI memory sync err:', err));
  }, []);

  // Flush pending outcome on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      commitPendingOutcome();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [commitPendingOutcome]);

  // 1. Subscribe to Universal Global Scores in Cloud
  useEffect(() => {
    const unsub = subscribeToUniversalScores((scores) => {
      setUniversalScores(scores);
      setIsCloudConnected(true);
    });
    return unsub;
  }, []);

  // 2. Subscribe to Collective AI Brain in Cloud
  useEffect(() => {
    const unsub = subscribeToCollectiveAiBrain((brain) => {
      setCloudBrain(brain);
      collectiveAi.syncFromCloud(brain);
      setIsCloudConnected(true);
    });
    return unsub;
  }, []);

  // Update Move Evaluation whenever board or mode changes
  const updateAiEvaluation = useCallback(() => {
    if (winner) {
      setAiEvaluation(null);
      return;
    }

    let evalRes: MoveEvaluation;
    if (gameMode === 'medium') {
      evalRes = getClassicAiMove(board, aiSymbol, 'Medium');
    } else if (gameMode === 'minmax') {
      evalRes = getClassicAiMove(board, aiSymbol, 'MinMax');
    } else {
      evalRes = collectiveAi.getMove(board, aiSymbol);
    }
    setAiEvaluation(evalRes);
  }, [board, aiSymbol, gameMode, winner]);

  useEffect(() => {
    updateAiEvaluation();
  }, [updateAiEvaluation]);

  // Handle Game End: Record pending outcome (to sync when Continue or Switch Side is clicked)
  const handleGameEnd = useCallback(
    (winResult: Winner, finalBoard: BoardState) => {
      setWinner(winResult);
      setGameStatus('GAME_OVER');

      if (winResult === 'X' || winResult === 'O') {
        const line = getWinningLine(finalBoard);
        setWinningLine(line);
      } else {
        setWinningLine(null);
      }

      // Audio feedback
      if (winResult === humanSymbol) {
        sound.playWin();
      } else if (winResult === aiSymbol) {
        sound.playLoss();
      } else {
        sound.playDraw();
      }

      // Store pending outcome for sync on button action
      pendingMatchRef.current = {
        mode: gameMode,
        winner: winResult,
        humanSymbol,
        aiSymbol,
      };
    },
    [aiSymbol, humanSymbol, gameMode]
  );

  // AI Move Execution with realistic thinking delay
  const aiMoveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const executeAiMove = useCallback(
    (currentBoard: BoardState) => {
      const available = getAvailableMoves(currentBoard);
      if (available.length === 0 || winner) return;

      setIsAiThinking(true);

      if (aiMoveTimerRef.current) clearTimeout(aiMoveTimerRef.current);

      aiMoveTimerRef.current = setTimeout(() => {
        let chosenMove: number = available[0];
        let evalResult: MoveEvaluation;

        if (gameMode === 'medium') {
          evalResult = getClassicAiMove(currentBoard, aiSymbol, 'Medium');
          chosenMove = evalResult.bestMove;
        } else if (gameMode === 'minmax') {
          evalResult = getClassicAiMove(currentBoard, aiSymbol, 'MinMax');
          chosenMove = evalResult.bestMove;
        } else {
          evalResult = collectiveAi.getMove(currentBoard, aiSymbol);
          chosenMove = evalResult.bestMove;
        }

        setAiEvaluation(evalResult);

        if (chosenMove >= 0 && currentBoard[chosenMove] === '') {
          const nextBoard = [...currentBoard];
          nextBoard[chosenMove] = aiSymbol;
          setBoard(nextBoard);
          sound.playMark(aiSymbol);

          // Check if AI won
          if (checkWin(nextBoard, aiSymbol)) {
            setIsAiThinking(false);
            handleGameEnd(aiSymbol, nextBoard);
            return;
          }

          // Check if draw
          if (!nextBoard.includes('')) {
            setIsAiThinking(false);
            handleGameEnd('draw', nextBoard);
            return;
          }

          setCurrentTurn(humanSymbol);
        }

        setIsAiThinking(false);
      }, 350);
    },
    [aiSymbol, humanSymbol, gameMode, winner, handleGameEnd]
  );

  // Trigger AI move when it becomes AI's turn
  useEffect(() => {
    if (
      gameStatus === 'PLAYING' &&
      currentTurn === aiSymbol &&
      !winner &&
      !isAiThinking
    ) {
      executeAiMove(board);
    }
  }, [gameStatus, currentTurn, aiSymbol, winner, isAiThinking, board, executeAiMove]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (aiMoveTimerRef.current) clearTimeout(aiMoveTimerRef.current);
    };
  }, []);

  // Handle Human Player Click
  const handleCellClick = (index: number) => {
    if (
      gameStatus !== 'PLAYING' ||
      currentTurn !== humanSymbol ||
      board[index] !== '' ||
      winner ||
      isAiThinking
    ) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = humanSymbol;
    setBoard(nextBoard);
    sound.playMark(humanSymbol);

    // Record human move in collective AI model to learn human habits from all players
    collectiveAi.recordHumanMove(index, nextBoard);

    // Check human win
    if (checkWin(nextBoard, humanSymbol)) {
      handleGameEnd(humanSymbol, nextBoard);
      return;
    }

    // Check draw
    if (!nextBoard.includes('')) {
      handleGameEnd('draw', nextBoard);
      return;
    }

    // Switch turn to AI / Computer / MinMax
    setCurrentTurn(aiSymbol);
  };

  // Reset Round / Continue
  const handleStartRound = (hSym: PlayerSymbol, aSym: PlayerSymbol) => {
    if (aiMoveTimerRef.current) clearTimeout(aiMoveTimerRef.current);

    setHumanSymbol(hSym);
    setAiSymbol(aSym);
    setBoard(['', '', '', '', '', '', '', '', '']);
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
    setCurrentTurn('X'); // X always goes first!
    setGameStatus('PLAYING');

    // If opponent is X, opponent moves first
    if (aSym === 'X') {
      const initialBoard: BoardState = ['', '', '', '', '', '', '', '', ''];
      setTimeout(() => {
        executeAiMove(initialBoard);
      }, 250);
    }
  };

  // Called when Switch Side is clicked: syncs score immediately, then swaps sides
  const handleSwitchSide = () => {
    commitPendingOutcome();
    handleStartRound(aiSymbol, humanSymbol);
  };

  // Called when Continue is clicked: syncs score immediately, then starts next round with same symbol
  const handleContinue = () => {
    commitPendingOutcome();
    handleStartRound(humanSymbol, aiSymbol);
  };

  const handleRestart = () => {
    commitPendingOutcome();
    if (aiMoveTimerRef.current) clearTimeout(aiMoveTimerRef.current);
    setBoard(['', '', '', '', '', '', '', '', '']);
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
    setGameStatus('CHARACTER_SELECTION');
  };

  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleModeChange = (newMode: GameMode) => {
    commitPendingOutcome();
    setGameMode(newMode);
    if (gameStatus === 'PLAYING' || gameStatus === 'GAME_OVER') {
      handleStartRound(humanSymbol, aiSymbol);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col justify-between selection:bg-red-500/20">
      <div>
        {/* Top Bar with Medium, MinMax, AI Mode tabs */}
        <Header
          gameMode={gameMode}
          setGameMode={handleModeChange}
          showInspector={showInspector}
          setShowInspector={setShowInspector}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onNewGame={handleContinue}
          isCloudConnected={isCloudConnected}
        />

        {/* Main Game Stage */}
        <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center">
          {/* Prominent Accessible Mode Switcher */}
          <ModeSelector
            gameMode={gameMode}
            onSelectMode={handleModeChange}
          />

          {gameStatus === 'CHARACTER_SELECTION' ? (
            <CharacterSelection
              onSelect={(symbol) => {
                const aSym = symbol === 'X' ? 'O' : 'X';
                handleStartRound(symbol, aSym);
              }}
            />
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Universal Global Scoreboard (Human vs Computer, Human vs MinMax, Human vs AI) */}
              <ScoreBoard
                gameMode={gameMode}
                universalScores={universalScores}
                playerSymbol={humanSymbol}
                aiSymbol={aiSymbol}
                cloudBrainEpisodes={cloudBrain.episodesTrained}
              />

              {/* Game Arena Board with Brightness Fade Out & Over-the-Board Action Buttons on Game End */}
              <GameBoard
                board={board}
                onCellClick={handleCellClick}
                winningLine={winningLine}
                winner={winner}
                isAiThinking={isAiThinking}
                isHumanTurn={currentTurn === humanSymbol}
                humanSymbol={humanSymbol}
                aiSymbol={aiSymbol}
                aiEvaluation={aiEvaluation}
                showBrainOverlay={showInspector}
                disabled={isAiThinking || !!winner}
                gameMode={gameMode}
                onContinue={handleContinue}
                onSwitchSide={handleSwitchSide}
              />

              {/* AI Brain Telemetry and Cloud Memory Inspector */}
              {showInspector && (
                <AiInspector
                  gameMode={gameMode}
                  evaluation={aiEvaluation}
                  aiSymbol={aiSymbol}
                  humanSymbol={humanSymbol}
                  cloudBrain={cloudBrain}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NeuroToe Arena · Universal Multiplayer Scores & Cloud Learning AI</span>
          <div className="flex items-center gap-3">
            <span>Medium (Computer)</span>
            <span aria-hidden="true">·</span>
            <span>MinMax Mode</span>
            <span aria-hidden="true">·</span>
            <span>Cloud Synced AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
