import { BoardState, CollectiveAiBrain, MoveEvaluation, PlayerSymbol } from '../types';
import { checkWin, getAvailableMoves, WINNING_COMBINATIONS } from './minimaxAI';
import { pushAiLearningToCloud, DEFAULT_COLLECTIVE_BRAIN } from '../services/cloudSync';

// Dihedral group D4 symmetry permutation tables
const SYMMETRY_MAPS: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8], // 0: Identity
  [6, 3, 0, 7, 4, 1, 8, 5, 2], // 1: Rotate 90 deg CW
  [8, 7, 6, 5, 4, 3, 2, 1, 0], // 2: Rotate 180 deg
  [2, 5, 8, 1, 4, 7, 0, 3, 6], // 3: Rotate 270 deg CW
  [2, 1, 0, 5, 4, 3, 8, 7, 6], // 4: Reflect horizontal
  [6, 7, 8, 3, 4, 5, 0, 1, 2], // 5: Reflect vertical
  [0, 3, 6, 1, 4, 7, 2, 5, 8], // 6: Reflect diagonal
  [8, 5, 2, 7, 4, 1, 6, 3, 0], // 7: Reflect anti-diagonal
];

export class CollectiveLearningAI {
  public brain: CollectiveAiBrain = { ...DEFAULT_COLLECTIVE_BRAIN };
  public localSessionEpisodes: number = 0;
  private currentGameHumanMoves: number[] = [];
  private currentGameQEntries: Record<string, Record<number, number>> = {};
  private currentGamePatterns: Record<string, number[]> = {};

  public syncFromCloud(cloudBrain: CollectiveAiBrain) {
    this.brain = { ...cloudBrain };
  }

  public recordHumanMove(cell: number, board: BoardState) {
    this.currentGameHumanMoves.push(cell);
    const key = board.map((c) => (c === '' ? '_' : c)).join('');
    if (!this.currentGamePatterns[key]) {
      this.currentGamePatterns[key] = [];
    }
    this.currentGamePatterns[key].push(cell);
  }

  public getCanonicalState(
    board: BoardState,
    aiSymbol: PlayerSymbol
  ): { stateKey: string; bestSymIndex: number; canonicalBoard: number[] } {
    const normalized = board.map((cell) => {
      if (cell === aiSymbol) return 1;
      if (cell === '') return 0;
      return -1;
    });

    let minKey = '';
    let bestIndex = 0;
    let bestBoard: number[] = normalized;

    for (let sym = 0; sym < SYMMETRY_MAPS.length; sym++) {
      const map = SYMMETRY_MAPS[sym];
      const symBoard = map.map((idx) => normalized[idx]);
      const key = symBoard.map((v) => (v === 1 ? 'X' : v === -1 ? 'O' : '_')).join('');
      if (minKey === '' || key < minKey) {
        minKey = key;
        bestIndex = sym;
        bestBoard = symBoard;
      }
    }

    return { stateKey: minKey, bestSymIndex: bestIndex, canonicalBoard: bestBoard };
  }

  public predictHumanMove(board: BoardState, humanSymbol: PlayerSymbol): number {
    const emptyCells = getAvailableMoves(board);
    if (emptyCells.length === 0) return -1;

    const boardKey = board.map((c) => (c === '' ? '_' : c)).join('');
    const patterns = this.brain.humanPatterns || {};

    if (patterns[boardKey] && patterns[boardKey].length > 0) {
      const recorded = patterns[boardKey].filter((m) => board[m] === '');
      if (recorded.length > 0) {
        // Return most common move chosen by all human players in this board state
        const counts: Record<number, number> = {};
        for (const m of recorded) counts[m] = (counts[m] || 0) + 1;
        let bestM = recorded[0];
        let maxC = 0;
        for (const m in counts) {
          if (counts[m] > maxC) {
            maxC = counts[m];
            bestM = Number(m);
          }
        }
        return bestM;
      }
    }

    // Secondary fallback: global position frequencies
    const stats = this.brain.positionStats || {};
    let bestCell = emptyCells[0];
    let maxFreq = -1;
    for (const cell of emptyCells) {
      const freq = stats[cell] || 0;
      if (freq > maxFreq) {
        maxFreq = freq;
        bestCell = cell;
      }
    }
    return bestCell;
  }

  public getMove(board: BoardState, aiSymbol: PlayerSymbol): MoveEvaluation {
    const available = getAvailableMoves(board);
    if (available.length === 0) {
      return { bestMove: -1, scores: {}, explanation: 'Board complete' };
    }

    const humanSymbol: PlayerSymbol = aiSymbol === 'X' ? 'O' : 'X';
    const scores: Record<number, number> = {};
    available.forEach((c) => {
      scores[c] = 0;
    });

    // 1. Tactical Immediate Win Check
    for (const spot of available) {
      const temp = [...board];
      temp[spot] = aiSymbol;
      if (checkWin(temp, aiSymbol)) {
        scores[spot] = 100;
        return {
          bestMove: spot,
          scores,
          explanation: 'Immediate lethal checkmate move executed from learned policy',
        };
      }
    }

    // 2. Predict human win threat using collective cloud pattern memory
    const predictedHumanMove = this.predictHumanMove(board, humanSymbol);
    if (predictedHumanMove !== -1 && board[predictedHumanMove] === '') {
      const temp = [...board];
      temp[predictedHumanMove] = humanSymbol;
      if (checkWin(temp, humanSymbol)) {
        scores[predictedHumanMove] = 85;
        return {
          bestMove: predictedHumanMove,
          scores,
          predictedHumanMove,
          explanation: `Anticipated global player checkmate at cell #${predictedHumanMove} and intercepted!`,
        };
      }
    }

    // 3. Immediate tactical threat block
    for (const spot of available) {
      const temp = [...board];
      temp[spot] = humanSymbol;
      if (checkWin(temp, humanSymbol)) {
        scores[spot] = 80;
        return {
          bestMove: spot,
          scores,
          predictedHumanMove,
          explanation: 'Immediate defensive block executed against human winning line',
        };
      }
    }

    // 4. Reinforcement Learning via Canonical Cloud Q-Table
    const { stateKey, bestSymIndex } = this.getCanonicalState(board, aiSymbol);
    const symMap = SYMMETRY_MAPS[bestSymIndex];
    const qTable = this.brain.qTable || {};
    const stateActions = qTable[stateKey] || {};

    for (const move of available) {
      const canonicalMove = symMap[move];
      const qVal = stateActions[canonicalMove] ?? 0;
      scores[move] = Number(qVal.toFixed(2));
    }

    const isExploration = Math.random() < this.brain.epsilon;
    let chosenMove = available[0];

    if (isExploration) {
      chosenMove = available[Math.floor(Math.random() * available.length)];
    } else {
      let maxQ = -Infinity;
      const candidates: number[] = [];
      for (const move of available) {
        const canonicalMove = symMap[move];
        const qVal = stateActions[canonicalMove] ?? 0;
        if (qVal > maxQ) {
          maxQ = qVal;
          candidates.length = 0;
          candidates.push(move);
        } else if (Math.abs(qVal - maxQ) < 0.001) {
          candidates.push(move);
        }
      }
      chosenMove = candidates[Math.floor(Math.random() * candidates.length)];
    }

    const canonicalAction = symMap[chosenMove];
    const currentQ = stateActions[canonicalAction] ?? 0;

    // Track Q-entry for batch cloud synchronization
    if (!this.currentGameQEntries[stateKey]) {
      this.currentGameQEntries[stateKey] = {};
    }
    this.currentGameQEntries[stateKey][canonicalAction] = currentQ;

    const explanation = isExploration
      ? `Global exploratory action (ε = ${(this.brain.epsilon * 100).toFixed(0)}%)`
      : `Optimal policy move (Q = ${currentQ.toFixed(2)}) derived from cloud memory`;

    return {
      bestMove: chosenMove,
      scores,
      predictedHumanMove,
      explanation,
      depthOrConfidence: currentQ,
    };
  }

  /**
   * Called when match completes: updates cloud memory, trains habit heatmap, and synchronizes.
   */
  public async finalizeMatch(winner: 'X' | 'O' | 'draw', aiSymbol: PlayerSymbol): Promise<CollectiveAiBrain> {
    const outcome = winner === aiSymbol ? 1.0 : winner === 'draw' ? 0.3 : -1.0;

    // Apply terminal reward to current game states
    for (const st in this.currentGameQEntries) {
      for (const act in this.currentGameQEntries[st]) {
        const old = this.currentGameQEntries[st][act] || 0;
        this.currentGameQEntries[st][act] = Number((old + 0.1 * (outcome - old)).toFixed(3));
      }
    }

    this.localSessionEpisodes++;

    // Push to Firebase Cloud Database & local persistent cache!
    const updatedBrain = await pushAiLearningToCloud(
      1,
      this.currentGameHumanMoves,
      this.currentGameQEntries,
      this.currentGamePatterns,
      this.brain.epsilon
    );

    this.brain = { ...updatedBrain };

    // Reset local buffers
    this.currentGameHumanMoves = [];
    this.currentGameQEntries = {};
    this.currentGamePatterns = {};

    return updatedBrain;
  }
}

export const collectiveAi = new CollectiveLearningAI();
