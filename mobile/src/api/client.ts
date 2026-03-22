/**
 * API client for the Workout Tracker backend.
 *
 * On a physical device, localhost refers to the phone itself — not the dev
 * machine.  Set EXPO_PUBLIC_API_URL to your computer's LAN IP (e.g.
 * http://192.168.1.10:8000) so the phone can reach the server.
 *
 * Usage example:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.10:8000 npx expo start
 */
const API_BASE: string =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export type Workout = {
  name: string;
  user_id: string;
  total_volume: number;
};

export async function createWorkout(
  userId: string,
  name: string,
  token: string
): Promise<Workout> {
  const res = await fetch(`${API_BASE}/workouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId, name }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<Workout>;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
