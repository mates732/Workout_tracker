// Public exercise library API client using wger
// https://wger.de/en/software/api

const WGER_API_BASE = 'https://wger.de/api/v2';
const DEFAULT_TIMEOUT_MS = 12000;

export type ExerciseLibraryItem = {
  id: number;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  gifUrl?: string;
};

type WgerExercise = {
  id: number;
  name: string;
  description?: string;
  category?: number;
  muscles?: number[];
  equipment?: number[];
};

type WgerListResponse<T> = {
  results: T[];
};

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function mapWgerExercise(item: WgerExercise): ExerciseLibraryItem {
  return {
    id: item.id,
    name: item.name,
    bodyPart: item.category ? `category-${item.category}` : 'general',
    equipment: item.equipment?.length ? `equipment-${item.equipment[0]}` : 'mixed',
    target: item.muscles?.length ? `muscle-${item.muscles[0]}` : 'general',
  };
}

export async function fetchExerciseTargets(): Promise<string[]> {
  const exercises = await fetchAllExercises();
  return Array.from(new Set(exercises.map((item) => item.target))).sort();
}

export async function fetchExercisesByTarget(target: string): Promise<ExerciseLibraryItem[]> {
  const all = await fetchAllExercises();
  const normalized = target.trim().toLowerCase();
  return all.filter((item) => item.target.toLowerCase().includes(normalized));
}

export async function fetchAllExercises(): Promise<ExerciseLibraryItem[]> {
  const response = await fetchWithTimeout(`${WGER_API_BASE}/exerciseinfo/?language=2&limit=200`);
  if (!response.ok) {
    throw new Error('Failed to fetch exercise library');
  }

  const payload = (await response.json()) as WgerListResponse<WgerExercise>;
  const items = Array.isArray(payload.results) ? payload.results : [];

  return items.map(mapWgerExercise);
}
