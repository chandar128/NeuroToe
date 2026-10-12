export type PlayerSymbol = 'X' | 'O';
export type CellValue = 'X' | 'O' | '';
export type BoardState = CellValue[];

// The 3 required modes (Easy mode is removed)
export type GameMode = 'medium' | 'minmax' | 'ai';
export type ClassicDifficulty = 'Medium' | 'MinMax';

export type GameStatus = 'CHARACTER_SELECTION' | 'PLAYING' | 'GAME_OVER';
export type Winner = 'X' | 'O' | 'draw' | null;

// Score labels strictly match user instructions:
// - Medium mode: Human vs Computer
// - MinMax mode: Human vs MinMax
// - AI mode: Human vs AI
export interface UniversalScores {
  medium: {
    human: number;
    computer: number;
    draws: number;
    totalGames: number;
  };
  minmax: {
    human: number;
    minmax: number;
    draws: number;
    totalGames: number;
  };
  ai: {
    human: number;
    ai: number;
    draws: number;
    totalGames: number;
  };
}

export interface MoveLogEntry {
  player: 'human' | 'ai';
  symbol: PlayerSymbol;
  move: number;
  board: BoardState;
  timestamp: number;
}

export interface CollectiveAiBrain {
  id: string;
  episodesTrained: number;
  epsilon: number;
  positionStats: Record<number, number>;
  qTable: Record<string, Record<number, number>>;
  humanPatterns: Record<string, number[]>;
  totalGamesLearned: number;
  updatedAt: string;
}

export interface StrategicAiData {
  humanPatterns: Record<string, Record<string, number[]>>;
  aiPatterns: Record<string, Record<string, [number, number][]>>;
  positionStats: Record<string, Record<number, number>>;
  epsilon: number;
  totalGamesLearned: number;
}

export interface QLearningAiData {
  qTable: Record<string, Record<number, number>>;
  epsilon: number;
  episodesTrained: number;
}

export interface MoveEvaluation {
  bestMove: number;
  scores: Record<number, number>;
  predictedHumanMove?: number;
  explanation: string;
  depthOrConfidence?: number;
}
