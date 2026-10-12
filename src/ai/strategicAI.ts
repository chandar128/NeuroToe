import { BoardState, MoveEvaluation, MoveLogEntry, PlayerSymbol, StrategicAiData } from '../types';
import { checkWin, getAvailableMoves } from './minimaxAI';

const STORAGE_KEY = 'neurotoe_strategic_ai_data';

export class StrategicAI {
  public data: StrategicAiData;
  public currentGame: MoveLogEntry[] = [];
  private learnRate: number = 0.3;
  private decayFactor: number = 0.95;
  private epsilonDecay: number = 0.98;

  constructor() {
    this.data = this.loadKnowledge();
  }

  private loadKnowledge(): StrategicAiData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.humanPatterns && parsed.aiPatterns && parsed.positionStats) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load strategic knowledge:', e);
    }

    return {
      humanPatterns: { X: {}, O: {} },
      aiPatterns: { X: {}, O: {} },
      positionStats: {
        X: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
        O: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 }
      },
      epsilon: 0.85,
      totalGamesLearned: 0
    };
  }

  public saveKnowledge() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save strategic knowledge:', e);
    }
  }

  public resetKnowledge() {
    this.data = {
      humanPatterns: { X: {}, O: {} },
      aiPatterns: { X: {}, O: {} },
      positionStats: {
        X: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
        O: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 }
      },
      epsilon: 0.85,
      totalGamesLearned: 0
    };
    this.currentGame = [];
    this.saveKnowledge();
  }

  public recordMove(player: 'human' | 'ai', move: number, board: BoardState, symbol: PlayerSymbol) {
    if (move < 0 || move >= 9) return;
    this.currentGame.push({
      player,
      symbol,
      move,
      board: [...board],
      timestamp: Date.now()
    });

    if (player === 'human') {
      if (!this.data.positionStats[symbol]) {
        this.data.positionStats[symbol] = {};
      }
      this.data.positionStats[symbol][move] = (this.data.positionStats[symbol][move] || 0) + 1;
    }
  }

  public stateSimilarity(s1: BoardState, s2: BoardState): number {
    let matches = 0;
    for (let i = 0; i < 9; i++) {
      if (s1[i] === s2[i]) matches++;
    }
    return matches / 9;
  }

  public stateKey(board: BoardState): string {
    return board.map(c => c === '' ? '_' : c).join('');
  }

  public keyToBoard(key: string): BoardState {
    return key.split('').map(c => c === '_' ? '' : c as 'X' | 'O');
  }

  public predictHumanMove(board: BoardState, humanSymbol: PlayerSymbol): number {
    const emptyCells = getAvailableMoves(board);
    if (emptyCells.length === 0) return -1;

    const patterns = this.data.humanPatterns[humanSymbol] || {};
    const patternKeys = Object.keys(patterns);

    const similarStates: string[] = [];
    for (const key of patternKeys) {
      const storedBoard = this.keyToBoard(key);
      if (this.stateSimilarity(board, storedBoard) > 0.7) {
        similarStates.push(key);
      }
    }

    if (similarStates.length > 0) {
      const nextMoves: number[] = [];
      for (const st of similarStates) {
        const movesList = patterns[st] || [];
        nextMoves.push(...movesList);
      }

      // Filter only moves that are currently empty on board
      const validMoves = nextMoves.filter(m => board[m] === '');
      if (validMoves.length > 0) {
        const counts: Record<number, number> = {};
        for (const m of validMoves) counts[m] = (counts[m] || 0) + 1;
        let mostFrequent = validMoves[0];
        let maxCount = 0;
        for (const m in counts) {
          if (counts[m] > maxCount) {
            maxCount = counts[m];
            mostFrequent = Number(m);
          }
        }
        return mostFrequent;
      }
    }

    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  public getMove(board: BoardState, aiSymbol: PlayerSymbol): MoveEvaluation {
    const emptySpots = getAvailableMoves(board);
    if (emptySpots.length === 0) {
      return { bestMove: -1, scores: {}, explanation: 'No available moves' };
    }

    const humanSymbol: PlayerSymbol = aiSymbol === 'X' ? 'O' : 'X';
    const scores: Record<number, number> = {};
    emptySpots.forEach(s => { scores[s] = 0; });

    // Immediate win opportunity (standard tactical sanity)
    for (const spot of emptySpots) {
      const temp = [...board];
      temp[spot] = aiSymbol;
      if (checkWin(temp, aiSymbol)) {
        scores[spot] = 100;
        return {
          bestMove: spot,
          scores,
          explanation: 'Immediate lethal checkmate move executed'
        };
      }
    }

    // 1. Opening strategy if board is completely empty
    if (emptySpots.length === 9) {
      const stats = this.data.positionStats[humanSymbol] || {};
      const moves = Object.keys(stats).map(Number);
      if (moves.length > 0) {
        let commonStart = 4; // Center
        let maxCount = -1;
        for (const m of moves) {
          if (stats[m] > maxCount) {
            maxCount = stats[m];
            commonStart = m;
          }
        }
        const chosen = emptySpots.includes(commonStart) ? commonStart : 4;
        scores[chosen] = 50;
        return {
          bestMove: chosen,
          scores,
          explanation: `Strategic opening counters human player habit (cell #${chosen})`
        };
      }
      const openers = [0, 2, 4, 6, 8];
      const pick = openers[Math.floor(Math.random() * openers.length)];
      scores[pick] = 20;
      return {
        bestMove: pick,
        scores,
        explanation: 'Standard positional corner/center opening'
      };
    }

    // 2. Predict human move and block human win
    const predictedHumanMove = this.predictHumanMove(board, humanSymbol);
    if (predictedHumanMove !== -1 && board[predictedHumanMove] === '') {
      const temp = [...board];
      temp[predictedHumanMove] = humanSymbol;
      if (checkWin(temp, humanSymbol)) {
        scores[predictedHumanMove] = 80;
        return {
          bestMove: predictedHumanMove,
          scores,
          predictedHumanMove,
          explanation: `Predicted human win at cell #${predictedHumanMove} and intercepted!`
        };
      }
    }

    // Standard immediate human threat block
    for (const spot of emptySpots) {
      const temp = [...board];
      temp[spot] = humanSymbol;
      if (checkWin(temp, humanSymbol)) {
        scores[spot] = 75;
        return {
          bestMove: spot,
          scores,
          predictedHumanMove,
          explanation: 'Direct human winning threat blocked'
        };
      }
    }

    // 3. Pattern-based move matching AI patterns
    const patternMove = this.patternBasedMove(board, aiSymbol);
    const isExploration = Math.random() < this.data.epsilon;

    if (patternMove !== -1 && !isExploration) {
      scores[patternMove] = 40;
      return {
        bestMove: patternMove,
        scores,
        predictedHumanMove,
        explanation: `Historical winning pattern matched (${Math.round((1 - this.data.epsilon) * 100)}% confidence exploitation)`
      };
    }

    // Fallback: Choose highest heuristic or random
    const randomPick = emptySpots[Math.floor(Math.random() * emptySpots.length)];
    scores[randomPick] = 10;
    return {
      bestMove: randomPick,
      scores,
      predictedHumanMove,
      explanation: isExploration
        ? `Epsilon-greedy exploration (${Math.round(this.data.epsilon * 100)}% exploratory randomness)`
        : 'Heuristic positional placement'
    };
  }

  private patternBasedMove(board: BoardState, aiSymbol: PlayerSymbol): number {
    const patterns = this.data.aiPatterns[aiSymbol] || {};
    const keys = Object.keys(patterns);
    const similarKeys: string[] = [];

    for (const key of keys) {
      const stored = this.keyToBoard(key);
      if (this.stateSimilarity(board, stored) > 0.6) {
        similarKeys.push(key);
      }
    }

    if (similarKeys.length > 0) {
      const candidateScores: Record<number, number> = {};
      for (const k of similarKeys) {
        const movesWithRewards = patterns[k] || [];
        for (const [m, r] of movesWithRewards) {
          if (board[m] === '') {
            candidateScores[m] = (candidateScores[m] || 0) + r;
          }
        }
      }

      let bestMove = -1;
      let highestVal = -Infinity;
      for (const mStr in candidateScores) {
        const m = Number(mStr);
        if (candidateScores[m] > highestVal) {
          highestVal = candidateScores[m];
          bestMove = m;
        }
      }
      if (bestMove !== -1) return bestMove;
    }

    return -1;
  }

  public updateStrategy(result: 'win' | 'loss' | 'draw') {
    if (this.currentGame.length === 0) return;

    try {
      let blocks = 0;
      let nearWins = 0;
      const moveCount = this.currentGame.length;
      const aiSymbol = this.currentGame.find(m => m.player === 'ai')?.symbol || 'O';
      const humanSymbol: PlayerSymbol = aiSymbol === 'X' ? 'O' : 'X';

      for (const move of this.currentGame) {
        if (move.player === 'ai') {
          // Check if move blocked human
          const tempBlock = [...move.board];
          tempBlock[move.move] = humanSymbol;
          if (checkWin(tempBlock, humanSymbol)) blocks++;

          // Check if move created near win
          const tempWin = [...move.board];
          tempWin[move.move] = aiSymbol;
          if (checkWin(tempWin, aiSymbol)) nearWins++;
        }
      }

      const reward = this.calculateReward(result, moveCount, blocks, nearWins);

      for (const entry of this.currentGame) {
        const symbol = entry.symbol;
        const key = this.stateKey(entry.board);

        if (entry.player === 'ai') {
          if (!this.data.aiPatterns[symbol]) this.data.aiPatterns[symbol] = {};
          if (!this.data.aiPatterns[symbol][key]) this.data.aiPatterns[symbol][key] = [];
          this.data.aiPatterns[symbol][key].push([entry.move, reward]);
        } else {
          if (!this.data.humanPatterns[symbol]) this.data.humanPatterns[symbol] = {};
          if (!this.data.humanPatterns[symbol][key]) this.data.humanPatterns[symbol][key] = [];
          this.data.humanPatterns[symbol][key].push(entry.move);
        }
      }

      // Decay old patterns
      for (const sym of ['X', 'O']) {
        const symPatterns = this.data.aiPatterns[sym] || {};
        for (const st in symPatterns) {
          symPatterns[st] = symPatterns[st].map(([m, r]: [number, number]): [number, number] => [m, r * this.decayFactor]);
        }
      }

      // Decay epsilon exploration rate
      this.data.epsilon = Math.max(0.1, this.data.epsilon * this.epsilonDecay);
      this.data.totalGamesLearned++;
      this.saveKnowledge();
    } catch (e) {
      console.warn('Error updating strategic AI:', e);
    } finally {
      this.currentGame = [];
    }
  }

  private calculateReward(result: 'win' | 'loss' | 'draw', moves: number, blocks: number, nearWins: number): number {
    const baseRewards = { win: 10, draw: 5, loss: -5 };
    return (baseRewards[result] - moves * 0.2 + blocks * 2 + nearWins * 1.5) * this.learnRate;
  }
}

export const strategicAi = new StrategicAI();
