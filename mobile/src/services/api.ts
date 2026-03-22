import Constants from 'expo-constants';
import { Workout, WorkoutLog } from '../types';

/**
 * Resolve the backend API base URL.
 *
 * Priority order:
 *   1. EXPO_PUBLIC_API_URL environment variable (set in .env)
 *   2. `extra.apiUrl` from app.json / app.config.js
 *   3. Fallback to localhost for development
 *
 * When testing on a physical device both the phone and the development
 * machine must be on the same Wi-Fi network.  Replace "localhost" with
 * the LAN IP address of your machine (e.g. 192.168.x.x) either via the
 * .env file or in app.json → expo.extra.apiUrl.
 */
function resolveApiUrl(): string {
  const envUrl = (process.env as Record<string, string | undefined>).EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const extraUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (extraUrl) return extraUrl.replace(/\/$/, '');

  return 'http://localhost:8000';
}

const BASE_URL = resolveApiUrl();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getWorkouts(): Promise<Workout[]> {
    return request<Workout[]>('/workouts');
  },

  getWorkout(id: string): Promise<Workout> {
    return request<Workout>(`/workouts/${id}`);
  },

  logWorkout(workoutId: string, notes?: string): Promise<WorkoutLog> {
    return request<WorkoutLog>('/logs', {
      method: 'POST',
      body: JSON.stringify({ workout_id: workoutId, notes }),
    });
  },

  getWorkoutHistory(): Promise<WorkoutLog[]> {
    return request<WorkoutLog[]>('/logs');
  },
};

export { BASE_URL };
