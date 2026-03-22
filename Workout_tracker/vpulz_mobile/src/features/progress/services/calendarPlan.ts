import type { CalendarDayState, TrainingSplit } from '../../settings/state/settings.types';

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const SPLIT_SEQUENCE: Record<TrainingSplit, string[]> = {
  ppl: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'],
  full_body: ['Full Body', 'Full Body', 'Full Body'],
  custom: ['Custom Session'],
};

export function buildWeeklyTemplate(split: TrainingSplit, customRoutines: string[] = []): string[] {
  if (split === 'custom') {
    const cleaned = customRoutines.map((item) => item.trim()).filter(Boolean);
    return cleaned.length ? cleaned : ['Custom Session'];
  }

  return SPLIT_SEQUENCE[split];
}

export function generateTwoWeekPlan(
  split: TrainingSplit,
  workoutDaysPerWeek: number,
  customRoutines: string[] = []
): { entries: Record<string, CalendarDayState>; planOverrides: Record<string, string> } {
  const entries: Record<string, CalendarDayState> = {};
  const planOverrides: Record<string, string> = {};

  const sequence = buildWeeklyTemplate(split, customRoutines);
  let sequenceIndex = 0;

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayOffset);
    const dayOfWeek = date.getDay();
    const iso = toISODate(date);

    const slotsPerWeek = Math.max(1, Math.min(7, workoutDaysPerWeek));
    const shouldTrain = ((dayOffset % 7) * slotsPerWeek) / 7 < slotsPerWeek;

    if (!shouldTrain) {
      continue;
    }

    const weekendPenalty = dayOfWeek === 0 ? 0.5 : 0;
    if (((dayOffset % 7) + weekendPenalty) > slotsPerWeek - 1) {
      continue;
    }

    entries[iso] = 'planned';
    planOverrides[iso] = sequence[sequenceIndex % sequence.length];
    sequenceIndex += 1;
  }

  return { entries, planOverrides };
}
