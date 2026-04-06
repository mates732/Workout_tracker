import type { Exercise } from '../../types/workout';

type ExerciseQuery = {
  query?: string;
  muscle?: string;
  equipment?: string;
  limit?: number;
  offset?: number;
};

type CacheEntry = {
  expiresAt: number;
  data: Exercise[];
};

const CACHE_TTL_MS = 1000 * 60 * 15;
const REQUEST_TIMEOUT_MS = 9000;
const DEFAULT_LIMIT = 60;
const DEFAULT_API_BASE = '';
const FALLBACK_WGER_BASE = 'https://wger.de/api/v2';

const cache = new Map<string, CacheEntry>();

function normalizeString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeString(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCacheKey(params: ExerciseQuery): string {
  const parts = [
    params.query?.trim().toLowerCase() ?? '',
    params.muscle?.trim().toLowerCase() ?? '',
    params.equipment?.trim().toLowerCase() ?? '',
    String(params.limit ?? DEFAULT_LIMIT),
    String(params.offset ?? 0),
  ];
  return parts.join('|');
}

function buildUrl(baseUrl: string, path: string, params: Record<string, string>): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value.length) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Request failed (${response.status}) ${body}`);
    }

    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

function mapBackendExercise(row: unknown): Exercise | null {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const item = row as Record<string, unknown>;
  const idRaw = item.id ?? item.exercise_id ?? item.wger_id;
  const name = normalizeString(item.name, 'Unnamed exercise');

  if (!idRaw || !name) {
    return null;
  }

  const description = normalizeString(item.description, '');
  const instructionsRaw = normalizeString(item.instructions, description);
  const muscles =
    normalizeArray(item.muscles).length > 0
      ? normalizeArray(item.muscles)
      : normalizeArray(item.muscle_group).length > 0
      ? normalizeArray(item.muscle_group)
      : normalizeArray(item.primary_muscle);
  const equipment =
    normalizeArray(item.equipment).length > 0
      ? normalizeArray(item.equipment)
      : normalizeArray(item.equipment_type);

  const imageUrl =
    normalizeString(item.image_url) ||
    normalizeString(item.image) ||
    normalizeString(item.thumbnail) ||
    null;

  return {
    id: String(idRaw),
    name,
    description: stripHtml(description),
    muscles,
    equipment,
    instructions: stripHtml(instructionsRaw),
    imageUrl,
  };
}

function extractRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const response = payload as Record<string, unknown>;

  if (Array.isArray(response.results)) {
    return response.results;
  }

  if (Array.isArray(response.exercises)) {
    return response.exercises;
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function mapWgerFallbackExercise(row: unknown): Exercise | null {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const item = row as Record<string, unknown>;
  const id = item.id;
  const name = normalizeString(item.name);
  if (typeof id !== 'number' || !name) {
    return null;
  }

  const muscles = normalizeArray(item.muscles);
  const equipment = normalizeArray(item.equipment);
  const description = stripHtml(normalizeString(item.description));

  return {
    id: String(id),
    name,
    description,
    muscles,
    equipment,
    instructions: description,
    imageUrl: null,
  };
}

function applyClientFilters(list: Exercise[], params: ExerciseQuery): Exercise[] {
  const query = params.query?.trim().toLowerCase() ?? '';
  const muscle = params.muscle?.trim().toLowerCase() ?? '';
  const equipment = params.equipment?.trim().toLowerCase() ?? '';

  return list.filter((exercise) => {
    const haystack = `${exercise.name} ${exercise.description} ${exercise.instructions} ${exercise.muscles.join(' ')} ${exercise.equipment.join(' ')}`.toLowerCase();

    const queryMatch = !query || haystack.includes(query);
    const muscleMatch = !muscle || exercise.muscles.some((item) => item.toLowerCase().includes(muscle));
    const equipmentMatch = !equipment || exercise.equipment.some((item) => item.toLowerCase().includes(equipment));

    return queryMatch && muscleMatch && equipmentMatch;
  });
}

export async function fetchWgerExercises(params: ExerciseQuery = {}): Promise<Exercise[]> {
  const key = buildCacheKey(params);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const envBaseUrl =
    typeof globalThis === 'object' &&
    globalThis &&
    'process' in globalThis &&
    typeof (globalThis as { process?: { env?: Record<string, unknown> } }).process === 'object'
      ? normalizeString((globalThis as { process?: { env?: Record<string, unknown> } }).process?.env?.EXPO_PUBLIC_API_BASE)
      : '';

  const baseUrl = envBaseUrl || DEFAULT_API_BASE;
  const limit = String(params.limit ?? DEFAULT_LIMIT);
  const offset = String(Math.max(0, params.offset ?? 0));
  const query = normalizeString(params.query);
  const muscle = normalizeString(params.muscle);
  const equipment = normalizeString(params.equipment);

  try {
    if (baseUrl) {
      const endpointUrl = buildUrl(baseUrl, '/wger/search', {
        query,
        muscle,
        equipment,
        limit,
        offset,
      });

      const payload = await fetchJson(endpointUrl);
      const parsed = extractRows(payload)
        .map(mapBackendExercise)
        .filter((item): item is Exercise => item !== null);

      const filtered = applyClientFilters(parsed, params);
      const result = filtered.slice(0, Number(limit));

      cache.set(key, {
        expiresAt: now + CACHE_TTL_MS,
        data: result,
      });

      return result;
    }
  } catch {
    // Backend proxy may be unavailable in local mobile testing; fallback handles that path.
  }

  const fallbackUrl = buildUrl(FALLBACK_WGER_BASE, '/exerciseinfo/', {
    language: '2',
    limit,
    offset,
    search: query,
  });

  const fallbackPayload = await fetchJson(fallbackUrl);
  const fallbackRows = extractRows(fallbackPayload)
    .map(mapWgerFallbackExercise)
    .filter((item): item is Exercise => item !== null);

  const filteredFallback = applyClientFilters(fallbackRows, params).slice(0, Number(limit));

  cache.set(key, {
    expiresAt: now + CACHE_TTL_MS,
    data: filteredFallback,
  });

  return filteredFallback;
}

export function extractLibraryFilterOptions(exercises: Exercise[]): {
  muscles: string[];
  equipment: string[];
} {
  const muscleSet = new Set<string>();
  const equipmentSet = new Set<string>();

  exercises.forEach((exercise) => {
    exercise.muscles.forEach((muscle) => {
      if (muscle.trim()) {
        muscleSet.add(muscle.trim());
      }
    });

    exercise.equipment.forEach((item) => {
      if (item.trim()) {
        equipmentSet.add(item.trim());
      }
    });
  });

  return {
    muscles: Array.from(muscleSet).sort((a, b) => a.localeCompare(b)),
    equipment: Array.from(equipmentSet).sort((a, b) => a.localeCompare(b)),
  };
}

export function clearWgerCache(): void {
  cache.clear();
}
