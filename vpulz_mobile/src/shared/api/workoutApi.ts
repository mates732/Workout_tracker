export type ConnectionConfig = {
  baseUrl: string;
  token: string;
  userId: string;
};


export type SetType = 'normal' | 'warmup' | 'pr' | 'drop' | 'failure';

// New: Note type for sets and exercises
export type Note = {
  text: string;
  created_at: string;
  updated_at?: string;
};

export type WorkoutStatus = 'active' | 'finished';

export interface WorkoutSession {
  id: string;

  user_id: string;
  status: WorkoutStatus;
  start_time: string;
  end_time: string | null;
}

export interface LoggedSet {
  id: string;
  workout_id: string;
  workout_exercise_id: string;
  exercise_id: number;
  weight: number;
  reps: number;
  rpe: number;
  duration: number;
  completed: boolean;
  set_type?: SetType;
  volume: number;
  created_at: string;
  updated_at: string;
  note?: Note | null;
}

export interface WorkoutExerciseState {
  id: string;
  workout_id: string;
  exercise_id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  ordering: number;
  sets: LoggedSet[];
}

export interface WorkoutState extends WorkoutSession {
  exercises: WorkoutExerciseState[];
}

export interface ExerciseItem {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  instructions: string;
  image_url?: string | null;
  image_urls?: string[];
  video_url?: string | null;
  video_urls?: string[];
  source?: 'backend' | 'internet';
}

export interface SetFeedback {
  difference_weight: number | null;
  difference_reps: number | null;
  pr: boolean;
}

export interface SetSuggestion {
  next_weight_kg: number;
  next_reps: number;
  result: 'success' | 'fail';
  trend: 'up' | 'down' | 'flat';
  action: 'increase' | 'hold' | 'reduce';
  context: {
    workout_state: {
      workout_id: string;
      total_sets: number;
      exercise_sets: number;
    };
    fatigue_failed_sets: number;
    consistency_score: number;
    consistency: 'high' | 'medium' | 'low';
  };
  adjustments: string[];
}

export interface SetResponse {
  set: LoggedSet;
  feedback: SetFeedback;
  suggestion: SetSuggestion;
  exercise?: {
    id: string;
    exercise_id: number;
    name: string;
  };
  workout?: WorkoutSession;
}

export interface ProgressResponse {
  exercise_id: number;
  exercise_name: string;
  user_id: string;
  weight_over_time: Array<{
    timestamp: string;
    weight: number;
  }>;
  volume_trend: Array<{
    timestamp: string;
    volume: number;
  }>;
}

export interface SetLogPayload {
  workout_id: string;
  weight: number;
  reps: number;
  rpe: number;
  duration: number;
  completed: boolean;
  set_type?: SetType;
  workout_exercise_id?: string;
  exercise_id?: number;
  exercise_name?: string;
}

export interface SetPatchPayload {
  weight?: number;
  reps?: number;
  rpe?: number;
  duration?: number;
  completed?: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PATCH';

type RequestOptions = {
  method?: HttpMethod;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
};

const REQUEST_TIMEOUT_MS = 12000;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | undefined>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

function asApiMessage(errorPayload: unknown): string {
  if (typeof errorPayload === 'object' && errorPayload !== null && 'detail' in errorPayload) {
    const detail = (errorPayload as Record<string, unknown>).detail;
    if (typeof detail === 'string') {
      return detail;
    }
  }
  return 'Request failed';
}

async function request<T>(config: ConnectionConfig, path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(config.baseUrl, path, options.query);
  const method = options.method ?? 'GET';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    const isAbortError =
      (typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name?: string }).name === 'AbortError') ||
      false;

    if (isAbortError) {
      throw new ApiError('Request timed out. Check backend URL and connectivity.', 0, { url });
    }

    throw new ApiError('Network request failed. Check backend URL and connectivity.', 0, {
      cause: error instanceof Error ? error.message : 'unknown',
      url,
    });
  } finally {
    clearTimeout(timeout);
  }

  const textPayload = await response.text();
  const jsonPayload = textPayload ? (JSON.parse(textPayload) as unknown) : null;

  if (!response.ok) {
    throw new ApiError(asApiMessage(jsonPayload), response.status, jsonPayload);
  }

  return jsonPayload as T;
}

export async function startWorkoutSession(
  config: ConnectionConfig,
  userId: string
): Promise<{ resumed: boolean; workout: WorkoutSession }> {
  return request(config, '/workout/start', {
    method: 'POST',
    body: { user_id: userId },
  });
}

export async function finishWorkoutSession(
  config: ConnectionConfig,
  workoutId: string
): Promise<{ workout: WorkoutSession }> {
  return request(config, `/workout/${workoutId}/finish`, {
    method: 'POST',
  });
}

export async function getActiveWorkout(
  config: ConnectionConfig,
  userId: string
): Promise<{ workout: WorkoutSession | null }> {
  return request(config, '/workout/active', {
    query: { user_id: userId },
  });
}

export async function getWorkoutState(
  config: ConnectionConfig,
  workoutId: string
): Promise<{ workout: WorkoutState }> {
  return request(config, `/workout/${workoutId}`);
}

export async function searchExercises(
  config: ConnectionConfig,
  query?: string,
  muscleGroup?: string,
  limit = 25
): Promise<{ count: number; exercises: ExerciseItem[] }> {
  return request(config, '/exercises', {
    query: {
      query,
      muscle_group: muscleGroup,
      limit,
    },
  });
}

export async function addExerciseToWorkout(
  config: ConnectionConfig,
  workoutId: string,
  payload: {
    exercise_id?: number;
    exercise_name?: string;
  }
): Promise<{ exercise: WorkoutExerciseState; workout: WorkoutSession }> {
  return request(config, `/workout/${workoutId}/exercise`, {
    method: 'POST',
    body: payload,
  });
}

export async function logSet(config: ConnectionConfig, payload: SetLogPayload): Promise<SetResponse> {
  return request(config, '/set', {
    method: 'POST',
    body: payload,
  });
}

export async function updateSet(
  config: ConnectionConfig,
  setId: string,
  payload: SetPatchPayload
): Promise<SetResponse> {
  return request(config, `/set/${setId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function getExerciseProgress(
  config: ConnectionConfig,
  exerciseId: number,
  userId?: string
): Promise<ProgressResponse> {
  return request(config, `/progress/${exerciseId}`, {
    query: { user_id: userId },
  });
}
