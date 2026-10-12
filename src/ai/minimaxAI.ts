import { BoardState, ClassicDifficulty, MoveEvaluation, PlayerSymbol } from '../types';

export const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function checkWin(board: BoardState, symbol: PlayerSymbol): boolean {
  return WINNING_COMBINATIONS.some(combo =>
    combo.every(idx => board[idx] === symbol)
  );
}

export function getWinningLine(board: BoardState): number[] | null {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return combo;
    }
  }
  return null;
}

export function getAvailableMoves(board: BoardState): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') {
      moves.push(i);
    }
  }
  return moves;
}

/**
 * Minimax with Alpha-Beta pruning, matching Pygame GameAI script exactly
 */
export function minimax(
  board: BoardState,
  isMaximizing: boolean,
  aiSymbol: PlayerSymbol,
  alpha: number,
  beta: number,
  depth: number = 0
): number {
  const humanSymbol: PlayerSymbol = aiSymbol === 'X' ? 'O' : 'X';

  if (checkWin(board, aiSymbol)) return 10 - depth;
  if (checkWin(board, humanSymbol)) return depth - 10;
  if (!board.includes('')) return 0;

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        const newBoard = [...board];
        newBoard[i] = aiSymbol;
        const score = minimax(newBoard, false, aiSymbol, alpha, beta, depth + 1);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        const newBoard = [...board];
        newBoard[i] = humanSymbol;
        const score = minimax(newBoard, true, aiSymbol, alpha, beta, depth + 1);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
    }
    return minScore;
  }
}

export function evaluateMinimaxMoves(
  board: BoardState,
  aiSymbol: PlayerSymbol
): MoveEvaluation {
  const emptyCells = getAvailableMoves(board);
  const scores: Record<number, number> = {};
  let bestScore = -Infinity;
  let bestMove = emptyCells.length > 0 ? emptyCells[0] : -1;

  for (const cell of emptyCells) {
    const temp = [...board];
    temp[cell] = aiSymbol;
    const score = minimax(temp, false, aiSymbol, -Infinity, Infinity, 0);
    scores[cell] = score;

    if (score > bestScore) {
      bestScore = score;
      bestMove = cell;
    }
  }

  const explanation =
    bestScore > 0
      ? `Forced victory path found (Eval: +${bestScore})`
      : bestScore === 0
      ? 'Optimal neutral play (Guarantees at least a Draw)'
      : `Defensive mitigation (Eval: ${bestScore})`;

  return {
    bestMove,
    scores,
    explanation,
    depthOrConfidence: bestScore
  };
}

export function getClassicAiMove(
  board: BoardState,
  aiSymbol: PlayerSymbol,
  difficulty: ClassicDifficulty
): MoveEvaluation {
  const humanSymbol: PlayerSymbol = aiSymbol === 'X' ? 'O' : 'X';
  const emptyCells = getAvailableMoves(board);

  if (emptyCells.length === 0) {
    return { bestMove: -1, scores: {}, explanation: 'No moves available' };
  }

  // 1. Medium: Win if possible, block opponent if threatened, else random
  if (difficulty === 'Medium') {
    const scores: Record<number, number> = {};

    // Check AI win
    for (const cell of emptyCells) {
      const temp = [...board];
      temp[cell] = aiSymbol;
      if (checkWin(temp, aiSymbol)) {
        scores[cell] = 10;
        return {
          bestMove: cell,
          scores,
          explanation: 'Immediate winning line detected'
        };
      }
    }

    // Block human win
    for (const cell of emptyCells) {
      const temp = [...board];
      temp[cell] = humanSymbol;
      if (checkWin(temp, humanSymbol)) {
        scores[cell] = 8;
        return {
          bestMove: cell,
          scores,
          explanation: 'Immediate human win threat blocked'
        };
      }
    }

    // Take center cell if available (classic medium strategic play)
    if (emptyCells.includes(4)) {
      scores[4] = 5;
      return {
        bestMove: 4,
        scores,
        explanation: 'Controlled center square to maintain board balance'
      };
    }

    // Otherwise pick a balanced strategic move
    const corners = [0, 2, 6, 8].filter(c => emptyCells.includes(c));
    const candidateMove = corners.length > 0 && Math.random() < 0.6
      ? corners[Math.floor(Math.random() * corners.length)]
      : emptyCells[Math.floor(Math.random() * emptyCells.length)];

    emptyCells.forEach(cell => { scores[cell] = 0; });
    scores[candidateMove] = 2;
    return {
      bestMove: candidateMove,
      scores,
      explanation: 'Positional tactical move'
    };
  }

  // 3. MinMax: Alpha-Beta pruned optimal game theory
  return evaluateMinimaxMoves(board, aiSymbol);
}
