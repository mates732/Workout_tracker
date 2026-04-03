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
  // exerciseinfo returns nested objects for category/muscles/equipment
  category?: number | { id: number; name?: string } | { id: number; name?: string; name_en?: string };
  muscles?: Array<number | { id: number; name?: string; name_en?: string }>;
  muscles_secondary?: Array<number | { id: number; name?: string; name_en?: string }>;
  equipment?: Array<number | { id: number; name?: string }>;
  images?: Array<{ id: number; image: string }>;
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

// simple in-memory cache for lookup endpoints
const lookupCache: Record<string, Map<number, string>> = {};

async function fetchLookup(endpoint: 'muscle' | 'equipment' | 'exercisecategory'): Promise<Map<number, string>> {
  if (lookupCache[endpoint]) return lookupCache[endpoint];
  try {
    const res = await fetchWithTimeout(`${WGER_API_BASE}/${endpoint}/?limit=200`);
    if (!res.ok) return new Map();
    const payload = (await res.json()) as { results?: any[] };
    const m = new Map<number, string>();
    if (Array.isArray(payload.results)) {
      for (const r of payload.results) {
        const id = Number(r.id ?? r.pk ?? 0);
        const name = String(r.name_en || r.name || r.title || id || '');
        if (id) m.set(id, name);
      }
    }
    lookupCache[endpoint] = m;
    return m;
  } catch (e) {
    return new Map();
  }
}

function mapWgerExercise(item: WgerExercise, muscleMap: Map<number, string>, equipmentMap: Map<number, string>, categoryMap: Map<number, string>): ExerciseLibraryItem {
  const resolveCategory = () => {
    if (!item) return 'general';
    if (typeof item.category === 'object' && item.category) return (item.category as any).name || String((item.category as any).id || 'general');
    if (typeof item.category === 'number') return categoryMap.get(item.category) || `category-${item.category}`;
    return 'general';
  };

  const resolvePrimaryMuscle = () => {
    const list = item.muscles ?? item.muscles_secondary ?? [];
    if (!Array.isArray(list) || list.length === 0) return 'general';
    const first = list[0];
    if (typeof first === 'object') return (first as any).name_en || (first as any).name || String((first as any).id);
    return muscleMap.get(Number(first)) || `muscle-${first}`;
  };

  const resolveEquipment = () => {
    if (!Array.isArray(item.equipment) || item.equipment.length === 0) return 'mixed';
    const first = item.equipment[0];
    if (typeof first === 'object') return (first as any).name || String((first as any).id);
    return equipmentMap.get(Number(first)) || `equipment-${first}`;
  };

  const resolveGif = () => {
    try {
      const images = (item as any).images;
      if (Array.isArray(images) && images.length) return String(images[0].image || images[0].url || '');
    } catch {
      // ignore
    }
    return undefined;
  };

  return {
    id: item.id,
    name: item.name,
    bodyPart: resolveCategory(),
    equipment: resolveEquipment(),
    target: resolvePrimaryMuscle(),
    gifUrl: resolveGif(),
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
  // fetch lookup tables in parallel to map ids to human names
  const [muscleMap, equipmentMap, categoryMap] = await Promise.all([
    fetchLookup('muscle'),
    fetchLookup('equipment'),
    fetchLookup('exercisecategory'),
  ]);

  const limit = 200;
  let offset = 0;
  const allItems: WgerExercise[] = [];

  while (true) {
    const response = await fetchWithTimeout(`${WGER_API_BASE}/exerciseinfo/?language=2&limit=${limit}&offset=${offset}`);
    if (!response.ok) {
      throw new Error('Failed to fetch exercise library');
    }

    const payload = (await response.json()) as WgerListResponse<WgerExercise> & { next?: string } & { count?: number };
    const items = Array.isArray(payload.results) ? payload.results : [];
    allItems.push(...items);

    if (!payload.next || items.length === 0) {
      break;
    }

    offset += limit;
  }

  return allItems.map((it) => mapWgerExercise(it, muscleMap, equipmentMap, categoryMap));
}
