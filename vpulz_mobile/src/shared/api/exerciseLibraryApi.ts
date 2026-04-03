import type { ExerciseItem } from './workoutApi';

type WgerImage = {
  image?: string;
};

type WgerVideo = {
  video?: string;
};

type WgerCategory = {
  name?: string;
};

type WgerEquipment = {
  name?: string;
};

type WgerExercise = {
  id?: number;
  name?: string;
  description?: string;
  category?: WgerCategory;
  equipment?: WgerEquipment[];
  images?: WgerImage[];
  videos?: WgerVideo[];
};

type WgerResponse = {
  results?: WgerExercise[];
};

const DEFAULT_BASE_URL = 'https://wger.de/api/v2';
const EXERCISE_SEARCH_LIMIT = 80;
const REQUEST_TIMEOUT_MS = 12000;
const EXERCISE_PAGE_LIMIT = 200;
const EXERCISE_CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

let cachedExerciseItems: ExerciseItem[] | null = null;
let cachedAt = 0;

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value: string | undefined, fallback: string): string {
  const next = typeof value === 'string' ? value.trim() : '';
  return next || fallback;
}

function normalizeMedia(values: Array<string | undefined>): string[] {
  return values
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item): item is string => Boolean(item));
}

function toExerciseItem(row: WgerExercise): ExerciseItem | null {
  if (!row.id || !row.name) {
    return null;
  }

  const images = normalizeMedia((row.images ?? []).map((item) => item.image));
  const videos = normalizeMedia((row.videos ?? []).map((item) => item.video));
  const instructions = stripHtml(row.description ?? '');

  return {
    id: row.id,
    name: normalizeText(row.name, 'Unknown exercise'),
    muscle_group: normalizeText(row.category?.name, 'General'),
    equipment: normalizeText((row.equipment ?? []).map((item) => item.name).filter(Boolean).join(', '), 'Unknown'),
    instructions,
    image_url: images[0] ?? null,
    image_urls: images,
    video_url: videos[0] ?? null,
    video_urls: videos,
    source: 'internet',
  };
}

function matchesFilters(item: ExerciseItem, query?: string, muscleGroup?: string): boolean {
  const normalizedQuery = query?.trim().toLowerCase() ?? '';
  const normalizedMuscle = muscleGroup?.trim().toLowerCase() ?? '';

  const matchesQuery =
    !normalizedQuery ||
    item.name.toLowerCase().includes(normalizedQuery) ||
    item.muscle_group.toLowerCase().includes(normalizedQuery) ||
    item.equipment.toLowerCase().includes(normalizedQuery) ||
    item.instructions.toLowerCase().includes(normalizedQuery);

  const matchesMuscle = !normalizedMuscle || item.muscle_group.toLowerCase().includes(normalizedMuscle);

  return matchesQuery && matchesMuscle;
}

async function requestWger(path: string): Promise<WgerResponse> {
  const baseUrl = process.env.EXPO_PUBLIC_EXERCISE_LIBRARY_API_BASE?.trim() || DEFAULT_BASE_URL;
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const url = `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
          'User-Agent': 'vpulz-mobile/1.0',
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const msg = `Exercise library request failed (${response.status}) ${text}`;
      console.warn(msg);
      throw new Error(msg);
    }

    return (await response.json()) as WgerResponse;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAllWgerExerciseItems(): Promise<ExerciseItem[]> {
  const now = Date.now();
  if (cachedExerciseItems && now - cachedAt < EXERCISE_CACHE_TTL_MS) {
    return cachedExerciseItems;
  }

  const allRows: WgerExercise[] = [];
  let offset = 0;

  while (true) {
    try {
      const resp = await requestWger(`/exerciseinfo/?language=2&limit=${EXERCISE_PAGE_LIMIT}&offset=${offset}`);
      const rows = Array.isArray(resp.results) ? resp.results : [];
      allRows.push(...rows);
      if (!resp || !resp.results || rows.length === 0 || !((resp as any).next)) {
        break;
      }
      offset += EXERCISE_PAGE_LIMIT;
    } catch (e: unknown) {
      console.warn('Failed to fetch WGER exercise page', e);
      // surface the error to caller so UI can show retry/fallback
      throw e;
    }
  }

  const mapped: ExerciseItem[] = allRows
    .map(toExerciseItem)
    .filter((item): item is ExerciseItem => item !== null);

  cachedExerciseItems = mapped;
  cachedAt = Date.now();
  return mapped;
}

export async function searchInternetExerciseLibrary(
  query?: string,
  muscleGroup?: string,
  limit = 30
): Promise<ExerciseItem[]> {
  const all = await fetchAllWgerExerciseItems();
  const filtered = all.filter((item) => matchesFilters(item, query, muscleGroup));
  if (typeof limit === 'number' && limit > 0) {
    return filtered.slice(0, Math.max(1, limit));
  }
  return filtered;
}
