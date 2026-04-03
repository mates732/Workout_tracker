export type WgerExercise = {
  id: number;
  name: string;
};

type WgerPagedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function fetchExercises(query: string): Promise<WgerExercise[]> {
  const url =
    'https://wger.de/api/v2/exercise/?language=2&limit=20&search=' + encodeURIComponent(query ?? '');

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`WGER request failed (${res.status})`);
  }

  const data = (await res.json()) as WgerPagedResponse<unknown>;
  const results = Array.isArray((data as WgerPagedResponse<unknown>).results)
    ? (data as WgerPagedResponse<unknown>).results
    : [];

  return results
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const candidate = item as Record<string, unknown>;
      const id = candidate.id;
      const name = candidate.name;
      if (typeof id !== 'number' || typeof name !== 'string') {
        return null;
      }
      return { id, name } satisfies WgerExercise;
    })
    .filter((item): item is WgerExercise => item !== null);
}
