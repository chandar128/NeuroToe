import { BoardState, MoveEvaluation, PlayerSymbol, QLearningAiData } from '../types';
import { checkWin, getAvailableMoves, WINNING_COMBINATIONS } from './minimaxAI';

const STORAGE_KEY = 'neurotoe_qlearning_data';
const ALPHA = 0.1; // Learning rate
const GAMMA = 0.9; // Discount factor

// Dihedral group D4 symmetry permutation tables
const SYMMETRY_MAPS: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8], // 0: Identity
  [6, 3, 0, 7, 4, 1, 8, 5, 2], // 1: Rotate 90 deg CW
  [8, 7, 6, 5, 4, 3, 2, 1, 0], // 2: Rotate 180 deg
  [2, 5, 8, 1, 4, 7, 0, 3, 6], // 3: Rotate 270 deg CW
  [2, 1, 0, 5, 4, 3, 8, 7, 6], // 4: Reflect horizontal
  [6, 7, 8, 3, 4, 5, 0, 1, 2], // 5: Reflect vertical
  [0, 3, 6, 1, 4, 7, 2, 5, 8], // 6: Reflect diagonal
  [8, 5, 2, 7, 4, 1, 6, 3, 0]  // 7: Reflect anti-diagonal
];

export class QLearningAI {
  public data: QLearningAiData;
  public lastState: string | null = null;
  public lastAction: number | null = null;

  constructor() {
    this.data = this.loadKnowledge();
    // If empty Q-table, run initial bootstrap so it starts intelligent
    if (Object.keys(this.data.qTable).length < 20) {
      this.bootstrapSelfPlay(250);
    }
  }

  private loadKnowledge(): QLearningAiData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.qTable) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load Q-learning knowledge:', e);
    }

    return {
      qTable: {},
      epsilon: 0.15,
      episodesTrained: 0
    };
  }

  public saveKnowledge() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save Q-learning knowledge:', e);
    }
  }

  public resetKnowledge() {
    this.data = {
      qTable: {},
      epsilon: 0.8,
      episodesTrained: 0
    };
    this.lastState = null;
    this.lastAction = null;
    this.saveKnowledge();
  }

  /**
   * Generates canonical state from board normalized to AI perspective.
   * AI = 1, Human = -1, Empty = 0
   */
  public getCanonicalState(board: BoardState, aiSymbol: PlayerSymbol): { stateKey: string; bestSymIndex: number; canonicalBoard: number[] } {
    const normalized = board.map(cell => {
      if (cell === aiSymbol) return 1;
      if (cell === '') return 0;
      return -1;
    });

    let minKey = '';
    let bestIndex = 0;
    let bestBoard: number[] = normalized;

    for (let sym = 0; sym < SYMMETRY_MAPS.length; sym++) {
      const map = SYMMETRY_MAPS[sym];
      const symBoard = map.map(idx => normalized[idx]);
      const key = symBoard.map(v => (v === 1 ? 'X' : v === -1 ? 'O' : '_')).join('');
      if (minKey === '' || key < minKey) {
        minKey = key;
        bestIndex = sym;
        bestBoard = symBoard;
      }
    }

    return { stateKey: minKey, bestSymIndex: bestIndex, canonicalBoard: bestBoard };
  }

  /**
   * Computes the intermediate heuristic reward from Python script:
   * 2-in-a-row AI = +0.2, 2-in-a-row Human = -0.3
   */
  public calculateIntermediateReward(board: BoardState, aiSymbol: PlayerSymbol): number {
    const humanSymbol: PlayerSymbol = aiSymbol === 'X' ? 'O' : 'X';
    let reward = 0;

    for (const line of WINNING_COMBINATIONS) {
      const values = line.map(idx => board[idx]);
      const aiCount = values.filter(v => v === aiSymbol).length;
      const humanCount = values.filter(v => v === humanSymbol).length;

      if (aiCount === 2 && humanCount === 0) {
        reward += 0.2;
      } else if (humanCount === 2 && aiCount === 0) {
        reward -= 0.3;
      }
    }

    return reward;
  }

  /**
   * Choose move using Epsilon-Greedy on the Q-table
   */
  public chooseMove(board: BoardState, aiSymbol: PlayerSymbol): MoveEvaluation {
    const available = getAvailableMoves(board);
    if (available.length === 0) {
      return { bestMove: -1, scores: {}, explanation: 'Board full' };
    }

    const { stateKey, bestSymIndex } = this.getCanonicalState(board, aiSymbol);
    const symMap = SYMMETRY_MAPS[bestSymIndex];
    // Inverse map for transforming canonical actions back to original board space
    const invMap: number[] = new Array(9);
    for (let i = 0; i < 9; i++) {
      invMap[symMap[i]] = i;
    }

    if (!this.data.qTable[stateKey]) {
      this.data.qTable[stateKey] = {};
    }
    const stateActions = this.data.qTable[stateKey];

    const scores: Record<number, number> = {};
    for (const move of available) {
      const canonicalMove = symMap[move];
      scores[move] = Number((stateActions[canonicalMove] ?? 0).toFixed(3));
    }

    const isExploration = Math.random() < this.data.epsilon;
    let chosenMove = available[0];

    if (isExploration) {
      chosenMove = available[Math.floor(Math.random() * available.length)];
    } else {
      let bestQ = -Infinity;
      const candidateMoves: number[] = [];

      for (const move of available) {
        const canonicalMove = symMap[move];
        const qVal = stateActions[canonicalMove] ?? 0;
        if (qVal > bestQ) {
          bestQ = qVal;
          candidateMoves.length = 0;
          candidateMoves.push(move);
        } else if (Math.abs(qVal - bestQ) < 0.0001) {
          candidateMoves.push(move);
        }
      }

      chosenMove = candidateMoves[Math.floor(Math.random() * candidateMoves.length)];
    }

    const canonicalAction = symMap[chosenMove];
    const chosenQ = (stateActions[canonicalAction] ?? 0).toFixed(2);

    const explanation = isExploration
      ? `Exploratory move (epsilon = ${(this.data.epsilon * 100).toFixed(0)}%)`
      : `Exploitation of highest Q-value (${chosenQ}) on canonical state`;

    return {
      bestMove: chosenMove,
      scores,
      explanation,
      depthOrConfidence: stateActions[canonicalAction] ?? 0
    };
  }

  public recordMove(board: BoardState, move: number, aiSymbol: PlayerSymbol) {
    const { stateKey, bestSymIndex } = this.getCanonicalState(board, aiSymbol);
    const symMap = SYMMETRY_MAPS[bestSymIndex];
    this.lastState = stateKey;
    this.lastAction = symMap[move];
  }

  /**
   * Bellman Q-Learning Update:
   * Q(s, a) = Q(s, a) + ALPHA * (reward + GAMMA * max(Q(s', a')) - Q(s, a))
   */
  public updateQValues(
    reward: number,
    newBoard: BoardState,
    aiSymbol: PlayerSymbol,
    availableMoves: number[]
  ) {
    if (this.lastState !== null && this.lastAction !== null) {
      const { stateKey: newStateKey, bestSymIndex } = this.getCanonicalState(newBoard, aiSymbol);
      const symMap = SYMMETRY_MAPS[bestSymIndex];

      const nextStateActions = this.data.qTable[newStateKey] || {};
      let maxFutureQ = 0;

      if (availableMoves.length > 0) {
        maxFutureQ = Math.max(
          ...availableMoves.map(m => nextStateActions[symMap[m]] ?? 0)
        );
      }

      if (!this.data.qTable[this.lastState]) {
        this.data.qTable[this.lastState] = {};
      }

      const oldQ = this.data.qTable[this.lastState][this.lastAction] ?? 0;
      const newQ = oldQ + ALPHA * (reward + GAMMA * maxFutureQ - oldQ);
      this.data.qTable[this.lastState][this.lastAction] = newQ;
    }
  }

  /**
   * Terminal Q-Update when match concludes
   */
  public finalUpdate(reward: number) {
    if (this.lastState !== null && this.lastAction !== null) {
      if (!this.data.qTable[this.lastState]) {
        this.data.qTable[this.lastState] = {};
      }
      const oldQ = this.data.qTable[this.lastState][this.lastAction] ?? 0;
      this.data.qTable[this.lastState][this.lastAction] = oldQ + ALPHA * (reward - oldQ);
    }
    this.lastState = null;
    this.lastAction = null;
    this.data.epsilon = Math.max(0.05, this.data.epsilon * 0.997);
    this.data.episodesTrained++;
    this.saveKnowledge();
  }

  /**
   * Bootstrap self-play episodes to initialize knowledge
   */
  public bootstrapSelfPlay(episodes: number) {
    for (let ep = 0; ep < episodes; ep++) {
      let b: BoardState = ['', '', '', '', '', '', '', '', ''];
      let currentTurn: PlayerSymbol = 'X';
      const aiSym: PlayerSymbol = 'X';
      const oppSym: PlayerSymbol = 'O';

      while (true) {
        const available = getAvailableMoves(b);
        if (available.length === 0) {
          // Draw
          this.finalUpdate(0.3);
          break;
        }

        if (currentTurn === aiSym) {
          const evalRes = this.chooseMove(b, aiSym);
          const move = evalRes.bestMove;
          this.recordMove(b, move, aiSym);

          b[move] = aiSym;
          const interReward = this.calculateIntermediateReward(b, aiSym);
          const nextAvail = getAvailableMoves(b);
          this.updateQValues(interReward, b, aiSym, nextAvail);

          if (checkWin(b, aiSym)) {
            this.finalUpdate(1.0);
            break;
          }
          currentTurn = oppSym;
        } else {
          // Opponent move (random / heuristic mix)
          const move = available[Math.floor(Math.random() * available.length)];
          b[move] = oppSym;

          if (checkWin(b, oppSym)) {
            this.finalUpdate(-1.0);
            break;
          }
          currentTurn = aiSym;
        }
      }
    }
    this.saveKnowledge();
  }
}

export const qLearningAi = new QLearningAI();
