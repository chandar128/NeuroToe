import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CollectiveAiBrain, GameMode, UniversalScores, Winner } from '../types';

export const LOCAL_SCORES_KEY = 'neurotoe_universal_scores_cache';
export const LOCAL_BRAIN_KEY = 'neurotoe_collective_brain_cache';

export const DEFAULT_UNIVERSAL_SCORES: UniversalScores = {
  medium: { human: 0, computer: 0, draws: 0, totalGames: 0 },
  minmax: { human: 0, minmax: 0, draws: 0, totalGames: 0 },
  ai: { human: 0, ai: 0, draws: 0, totalGames: 0 },
};

export const DEFAULT_COLLECTIVE_BRAIN: CollectiveAiBrain = {
  id: 'collective_brain',
  episodesTrained: 0,
  epsilon: 0.25,
  positionStats: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
  qTable: {},
  humanPatterns: {},
  totalGamesLearned: 0,
  updatedAt: new Date().toISOString(),
};

/**
 * Loads cached universal scores from LocalStorage for instant zero-latency recovery on refresh.
 */
export function getCachedUniversalScores(): UniversalScores {
  try {
    const saved = localStorage.getItem(LOCAL_SCORES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.medium && parsed.minmax && parsed.ai) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached scores:', e);
  }
  return DEFAULT_UNIVERSAL_SCORES;
}

export function saveCachedUniversalScores(scores: UniversalScores): void {
  try {
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores));
  } catch (e) {
    console.warn('Failed to save scores cache:', e);
  }
}

export function getCachedCollectiveBrain(): CollectiveAiBrain {
  try {
    const saved = localStorage.getItem(LOCAL_BRAIN_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached brain:', e);
  }
  return DEFAULT_COLLECTIVE_BRAIN;
}

export function saveCachedCollectiveBrain(brain: CollectiveAiBrain): void {
  try {
    localStorage.setItem(LOCAL_BRAIN_KEY, JSON.stringify(brain));
  } catch (e) {
    console.warn('Failed to save brain cache:', e);
  }
}

/**
 * Real-time subscription to Universal Scores across all 3 game modes.
 * Ensures anyone who opens the website for the first time immediately sees the universal score.
 */
export function subscribeToUniversalScores(
  onUpdate: (scores: UniversalScores) => void
): () => void {
  const modes: GameMode[] = ['medium', 'minmax', 'ai'];
  // Seed with cached scores immediately (or 0s for first time visitor)
  const currentScores: UniversalScores = getCachedUniversalScores();
  onUpdate({ ...currentScores });

  const unsubs: (() => void)[] = [];

  modes.forEach((mode) => {
    const docPath = `scores/${mode}`;
    const docRef = doc(db, 'scores', mode);

    // Initial direct getDoc to populate immediately for first-time visitors
    getDoc(docRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const remoteHuman = Number(data.humanWins || 0);
          const remoteOpponent = Number(data.opponentWins || 0);
          const remoteDraws = Number(data.draws || 0);
          const remoteTotal = Number(data.totalGames || 0);

          if (mode === 'medium') {
            currentScores.medium = {
              human: Math.max(currentScores.medium.human, remoteHuman),
              computer: Math.max(currentScores.medium.computer, remoteOpponent),
              draws: Math.max(currentScores.medium.draws, remoteDraws),
              totalGames: Math.max(currentScores.medium.totalGames, remoteTotal),
            };
          } else if (mode === 'minmax') {
            currentScores.minmax = {
              human: Math.max(currentScores.minmax.human, remoteHuman),
              minmax: Math.max(currentScores.minmax.minmax, remoteOpponent),
              draws: Math.max(currentScores.minmax.draws, remoteDraws),
              totalGames: Math.max(currentScores.minmax.totalGames, remoteTotal),
            };
          } else if (mode === 'ai') {
            currentScores.ai = {
              human: Math.max(currentScores.ai.human, remoteHuman),
              ai: Math.max(currentScores.ai.ai, remoteOpponent),
              draws: Math.max(currentScores.ai.draws, remoteDraws),
              totalGames: Math.max(currentScores.ai.totalGames, remoteTotal),
            };
          }

          saveCachedUniversalScores(currentScores);
          onUpdate({ ...currentScores });
        }
      })
      .catch((err) => handleFirestoreError(err, OperationType.GET, docPath));

    // Real-time listener for live updates across players worldwide
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const remoteHuman = Number(data.humanWins || 0);
          const remoteOpponent = Number(data.opponentWins || 0);
          const remoteDraws = Number(data.draws || 0);
          const remoteTotal = Number(data.totalGames || 0);

          if (mode === 'medium') {
            currentScores.medium = {
              human: Math.max(currentScores.medium.human, remoteHuman),
              computer: Math.max(currentScores.medium.computer, remoteOpponent),
              draws: Math.max(currentScores.medium.draws, remoteDraws),
              totalGames: Math.max(currentScores.medium.totalGames, remoteTotal),
            };
          } else if (mode === 'minmax') {
            currentScores.minmax = {
              human: Math.max(currentScores.minmax.human, remoteHuman),
              minmax: Math.max(currentScores.minmax.minmax, remoteOpponent),
              draws: Math.max(currentScores.minmax.draws, remoteDraws),
              totalGames: Math.max(currentScores.minmax.totalGames, remoteTotal),
            };
          } else if (mode === 'ai') {
            currentScores.ai = {
              human: Math.max(currentScores.ai.human, remoteHuman),
              ai: Math.max(currentScores.ai.ai, remoteOpponent),
              draws: Math.max(currentScores.ai.draws, remoteDraws),
              totalGames: Math.max(currentScores.ai.totalGames, remoteTotal),
            };
          }

          saveCachedUniversalScores(currentScores);
          onUpdate({ ...currentScores });
        } else {
          // If cloud document does not exist yet, initialize it
          const cur =
            mode === 'medium'
              ? currentScores.medium
              : mode === 'minmax'
              ? currentScores.minmax
              : currentScores.ai;
          const oppWins =
            mode === 'medium'
              ? (cur as any).computer
              : mode === 'minmax'
              ? (cur as any).minmax
              : (cur as any).ai;
          const initPayload = {
            mode,
            humanWins: cur.human || 0,
            opponentWins: oppWins || 0,
            draws: cur.draws || 0,
            totalGames: cur.totalGames || 0,
            updatedAt: new Date().toISOString(),
          };
          setDoc(docRef, initPayload).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, docPath)
          );
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, docPath);
      }
    );

    unsubs.push(unsub);
  });

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Increment the universal score in the cloud when any match concludes.
 * Uses atomic increments so all players worldwide contribute accurately.
 */
export async function recordUniversalGameOutcome(
  mode: GameMode,
  winner: Winner,
  humanSymbol: 'X' | 'O'
): Promise<void> {
  const docPath = `scores/${mode}`;
  const docRef = doc(db, 'scores', mode);

  try {
    const isHuman = winner === humanSymbol;
    const isDraw = winner === 'draw';
    const isOpponent = !isDraw && !isHuman;

    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        mode,
        humanWins: isHuman ? 1 : 0,
        opponentWins: isOpponent ? 1 : 0,
        draws: isDraw ? 1 : 0,
        totalGames: 1,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const updateData: Record<string, any> = {
        totalGames: increment(1),
        updatedAt: new Date().toISOString(),
      };
      if (isHuman) updateData.humanWins = increment(1);
      else if (isDraw) updateData.draws = increment(1);
      else updateData.opponentWins = increment(1);

      await updateDoc(docRef, updateData);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Real-time subscription to the Collective AI Brain stored in Firestore.
 */
export function subscribeToCollectiveAiBrain(
  onUpdate: (brain: CollectiveAiBrain) => void
): () => void {
  const docPath = 'ai_memory/collective_brain';
  const docRef = doc(db, 'ai_memory', 'collective_brain');

  // Immediately notify with cached brain
  const cached = getCachedCollectiveBrain();
  onUpdate(cached);

  // Direct fetch for fast startup in parallel with listener
  getDoc(docRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const brain: CollectiveAiBrain = {
          id: 'collective_brain',
          episodesTrained: Math.max(cached.episodesTrained, Number(data.episodesTrained || 0)),
          epsilon: Number(data.epsilon ?? 0.2),
          positionStats: data.positionStats || cached.positionStats,
          qTable: { ...(cached.qTable || {}), ...(data.qTable || {}) },
          humanPatterns: { ...(cached.humanPatterns || {}), ...(data.humanPatterns || {}) },
          totalGamesLearned: Math.max(cached.totalGamesLearned, Number(data.totalGamesLearned || 0)),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        saveCachedCollectiveBrain(brain);
        onUpdate(brain);
      }
    })
    .catch((err) => handleFirestoreError(err, OperationType.GET, docPath));

  const unsub = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const brain: CollectiveAiBrain = {
          id: 'collective_brain',
          episodesTrained: Math.max(cached.episodesTrained, Number(data.episodesTrained || 0)),
          epsilon: Number(data.epsilon ?? 0.2),
          positionStats: data.positionStats || cached.positionStats,
          qTable: { ...(cached.qTable || {}), ...(data.qTable || {}) },
          humanPatterns: { ...(cached.humanPatterns || {}), ...(data.humanPatterns || {}) },
          totalGamesLearned: Math.max(cached.totalGamesLearned, Number(data.totalGamesLearned || 0)),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        saveCachedCollectiveBrain(brain);
        onUpdate(brain);
      } else {
        // Initialize brain document in cloud
        setDoc(docRef, cached).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, docPath)
        );
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  );

  return unsub;
}

/**
 * Push learned game memories to the collective cloud brain so all players contribute.
 */
export async function pushAiLearningToCloud(
  newEpisodes: number,
  humanMoves: number[],
  newQEntries: Record<string, Record<number, number>>,
  newPatterns: Record<string, number[]>,
  currentEpsilon: number
): Promise<CollectiveAiBrain> {
  const docPath = 'ai_memory/collective_brain';
  const docRef = doc(db, 'ai_memory', 'collective_brain');

  const existing = getCachedCollectiveBrain();

  const mergedPositions: Record<number, number> = {
    ...(existing.positionStats || DEFAULT_COLLECTIVE_BRAIN.positionStats),
  };
  for (const move of humanMoves) {
    mergedPositions[move] = (mergedPositions[move] || 0) + 1;
  }

  const mergedQTable: Record<string, Record<number, number>> = {
    ...(existing.qTable || {}),
  };
  for (const st in newQEntries) {
    if (!mergedQTable[st]) {
      mergedQTable[st] = {};
    }
    for (const act in newQEntries[st]) {
      const existingQ = mergedQTable[st][act] ?? 0;
      const newQ = newQEntries[st][act];
      mergedQTable[st][act] = Number((existingQ * 0.7 + newQ * 0.3).toFixed(3));
    }
  }

  const mergedPatterns: Record<string, number[]> = {
    ...(existing.humanPatterns || {}),
  };
  for (const pKey in newPatterns) {
    if (!mergedPatterns[pKey]) {
      mergedPatterns[pKey] = [];
    }
    mergedPatterns[pKey].push(...newPatterns[pKey]);
    if (mergedPatterns[pKey].length > 20) {
      mergedPatterns[pKey] = mergedPatterns[pKey].slice(-20);
    }
  }

  const updatedEpisodes = Number(existing.episodesTrained || 0) + newEpisodes;
  const updatedGames = Number(existing.totalGamesLearned || 0) + 1;
  const decayedEpsilon = Math.max(0.05, Math.min(1.0, currentEpsilon * 0.99));

  const updatedBrain: CollectiveAiBrain = {
    id: 'collective_brain',
    episodesTrained: updatedEpisodes,
    totalGamesLearned: updatedGames,
    epsilon: Number(decayedEpsilon.toFixed(3)),
    positionStats: mergedPositions,
    qTable: mergedQTable,
    humanPatterns: mergedPatterns,
    updatedAt: new Date().toISOString(),
  };

  saveCachedCollectiveBrain(updatedBrain);
  setDoc(docRef, updatedBrain).catch((error) => {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  });

  return updatedBrain;
}
