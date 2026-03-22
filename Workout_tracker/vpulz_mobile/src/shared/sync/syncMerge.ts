import type { TrackerSessionSnapshot, WorkoutHistoryEntry } from '../../features/workout/workoutTracker.types';

const EMPTY_SNAPSHOT: TrackerSessionSnapshot = {
  drafts: {},
  pendingQueue: [],
  favorites: [],
  recentExerciseIds: [],
  workoutHistory: [],
};

function dedupeWorkoutHistory(entries: WorkoutHistoryEntry[]): WorkoutHistoryEntry[] {
  const byId = new Map<string, WorkoutHistoryEntry>();
  for (const entry of entries) {
    const existing = byId.get(entry.workoutId);
    if (!existing) {
      byId.set(entry.workoutId, entry);
      continue;
    }

    const existingDate = Number(new Date(existing.date));
    const nextDate = Number(new Date(entry.date));
    byId.set(entry.workoutId, nextDate >= existingDate ? entry : existing);
  }

  return [...byId.values()].sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)));
}

function mergeUnique<T>(left: T[], right: T[]): T[] {
  return [...new Set([...left, ...right])];
}

export function mergeTrackerSnapshots(
  localSnapshot: TrackerSessionSnapshot | null | undefined,
  cloudSnapshot: TrackerSessionSnapshot | null | undefined
): TrackerSessionSnapshot {
  const local = localSnapshot ?? EMPTY_SNAPSHOT;
  const cloud = cloudSnapshot ?? EMPTY_SNAPSHOT;

  const merged: TrackerSessionSnapshot = {
    activeWorkoutId: cloud.activeWorkoutId ?? local.activeWorkoutId,
    drafts: {
      ...cloud.drafts,
      ...local.drafts,
    },
    pendingQueue: [...cloud.pendingQueue, ...local.pendingQueue],
    favorites: mergeUnique(local.favorites, cloud.favorites),
    recentExerciseIds: mergeUnique(local.recentExerciseIds, cloud.recentExerciseIds),
    workoutHistory: dedupeWorkoutHistory([...cloud.workoutHistory, ...local.workoutHistory]),
  };

  return merged;
}

export function hasTrackerData(snapshot: TrackerSessionSnapshot | null | undefined): boolean {
  if (!snapshot) {
    return false;
  }

  return (
    Boolean(snapshot.activeWorkoutId) ||
    Object.keys(snapshot.drafts).length > 0 ||
    snapshot.pendingQueue.length > 0 ||
    snapshot.favorites.length > 0 ||
    snapshot.recentExerciseIds.length > 0 ||
    snapshot.workoutHistory.length > 0
  );
}
