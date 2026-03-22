import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrackerSessionSnapshot } from '../../features/workout/workoutTracker.types';
import { pushTrackerSnapshotForCurrentUser } from '../sync/cloudSyncService';

const STORAGE_KEY = 'vpulz.tracker.snapshot.v1';

const EMPTY_SNAPSHOT: TrackerSessionSnapshot = {
  drafts: {},
  pendingQueue: [],
  favorites: [],
  recentExerciseIds: [],
  workoutHistory: [],
};

export async function loadTrackerSnapshot(): Promise<TrackerSessionSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_SNAPSHOT;
    }
    const parsed = JSON.parse(raw) as Partial<TrackerSessionSnapshot>;
    return {
      activeWorkoutId: parsed.activeWorkoutId,
      drafts: parsed.drafts ?? {},
      pendingQueue: parsed.pendingQueue ?? [],
      favorites: parsed.favorites ?? [],
      recentExerciseIds: parsed.recentExerciseIds ?? [],
      workoutHistory: parsed.workoutHistory ?? [],
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export async function saveTrackerSnapshot(snapshot: TrackerSessionSnapshot): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  void pushTrackerSnapshotForCurrentUser(snapshot).catch(() => undefined);
}

export async function clearTrackerSnapshot(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
