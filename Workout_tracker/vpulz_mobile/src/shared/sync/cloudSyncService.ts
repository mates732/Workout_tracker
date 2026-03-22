import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SettingsState } from '../../features/settings/state/settings.types';
import type { TrackerSessionSnapshot } from '../../features/workout/workoutTracker.types';
import { getSupabaseClient } from './supabaseClient';

const TABLE_NAME = 'user_sync_state';
const PENDING_SYNC_STORAGE_KEY = 'vpulz.sync.pending.v1';

type SyncRow = {
  user_id: string;
  settings_json?: SettingsState | null;
  tracker_json?: TrackerSessionSnapshot | null;
  user_data_json?: Record<string, unknown> | null;
  workouts_json?: Array<Record<string, unknown>> | null;
  sets_json?: Array<Record<string, unknown>> | null;
  updated_at?: string;
};

type SyncPatch = {
  settings_json?: SettingsState;
  tracker_json?: TrackerSessionSnapshot;
  user_data_json?: Record<string, unknown>;
  workouts_json?: Array<Record<string, unknown>>;
  sets_json?: Array<Record<string, unknown>>;
};

type PendingSyncQueue = Record<string, SyncPatch>;

async function loadPendingQueue(): Promise<PendingSyncQueue> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_SYNC_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as PendingSyncQueue;
  } catch {
    return {};
  }
}

async function savePendingQueue(queue: PendingSyncQueue): Promise<void> {
  await AsyncStorage.setItem(PENDING_SYNC_STORAGE_KEY, JSON.stringify(queue));
}

async function enqueuePendingPatch(userId: string, patch: SyncPatch): Promise<void> {
  const queue = await loadPendingQueue();
  const existing = queue[userId] ?? {};
  queue[userId] = {
    ...existing,
    ...patch,
  };
  await savePendingQueue(queue);
}

async function upsertUserPatch(userId: string, patch: SyncPatch): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from(TABLE_NAME).upsert(
    {
      user_id: userId,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  return !error;
}

function buildUserDataPayload(settings: SettingsState): Record<string, unknown> {
  return {
    profile: settings.profile,
    goals: settings.goals,
    app: settings.app,
    privacy: settings.privacy,
    premium: settings.premium,
  };
}

function buildWorkoutsPayload(snapshot: TrackerSessionSnapshot): Array<Record<string, unknown>> {
  return snapshot.workoutHistory.map((entry) => ({
    workout_id: entry.workoutId,
    date: entry.date,
    duration_minutes: entry.durationMinutes,
    total_volume: entry.totalVolume,
    total_sets: entry.totalSets,
    personal_record: entry.personalRecord ?? null,
    insight: entry.insight ?? null,
  }));
}

function buildSetsPayload(snapshot: TrackerSessionSnapshot): Array<Record<string, unknown>> {
  const setEventsFromQueue = snapshot.pendingQueue
    .filter((action) => action.type === 'log_set' || action.type === 'patch_set')
    .map((action) => ({
      source: 'pending_queue',
      action_id: action.id,
      workout_id: action.workoutId,
      event_type: action.type,
      created_at: action.createdAt,
      payload: action.payload,
    }));

  const draftSetEvents = Object.values(snapshot.drafts).flatMap((draft) =>
    Object.entries(draft.exercises).map(([exerciseId, exerciseDraft]) => ({
      source: 'draft',
      workout_id: draft.workoutId,
      exercise_id: exerciseId,
      updated_at: draft.updatedAt,
      set: {
        weight: exerciseDraft.nextSet.weight,
        reps: exerciseDraft.nextSet.reps,
        rpe: exerciseDraft.nextSet.rpe,
        note: exerciseDraft.nextSet.note,
      },
    }))
  );

  return [...setEventsFromQueue, ...draftSetEvents];
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    return null;
  }

  return data.user.id;
}

export async function flushQueuedSyncForUser(userId: string): Promise<void> {
  const queue = await loadPendingQueue();
  const patch = queue[userId];
  if (!patch) {
    return;
  }

  const success = await upsertUserPatch(userId, patch);
  if (!success) {
    return;
  }

  delete queue[userId];
  await savePendingQueue(queue);
}

export async function pullUserData(
  userId: string
): Promise<{ settings: SettingsState | null; tracker: TrackerSessionSnapshot | null; userData: Record<string, unknown> | null }> {
  await flushQueuedSyncForUser(userId);

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { settings: null, tracker: null, userData: null };
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('settings_json, tracker_json, user_data_json, workouts_json, sets_json')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) {
    return { settings: null, tracker: null, userData: null };
  }

  return {
    settings: (data as SyncRow).settings_json ?? null,
    tracker: (data as SyncRow).tracker_json ?? null,
    userData: (data as SyncRow).user_data_json ?? null,
  };
}

export async function pushSettings(userId: string, settings: SettingsState): Promise<void> {
  const success = await upsertUserPatch(userId, {
    settings_json: settings,
    user_data_json: buildUserDataPayload(settings),
  });
  if (success) {
    return;
  }

  await enqueuePendingPatch(userId, {
    settings_json: settings,
    user_data_json: buildUserDataPayload(settings),
  });
}

export async function pushTrackerSnapshot(userId: string, snapshot: TrackerSessionSnapshot): Promise<void> {
  const success = await upsertUserPatch(userId, {
    tracker_json: snapshot,
    workouts_json: buildWorkoutsPayload(snapshot),
    sets_json: buildSetsPayload(snapshot),
  });
  if (success) {
    return;
  }

  await enqueuePendingPatch(userId, {
    tracker_json: snapshot,
    workouts_json: buildWorkoutsPayload(snapshot),
    sets_json: buildSetsPayload(snapshot),
  });
}

export async function pushTrackerSnapshotForCurrentUser(snapshot: TrackerSessionSnapshot): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return;
  }

  await pushTrackerSnapshot(userId, snapshot);
}
