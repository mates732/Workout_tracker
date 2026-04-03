export type SetItem = {
  reps: number;
  weight?: number; // kg
  rpe?: number;
  restSec?: number;
};

export type Exercise = {
  id: string;
  name: string;
  sets: SetItem[];
  previousBestKg?: number;
  isHighlighted?: boolean;
  notes?: string;
};

export type Workout = {
  id: string;
  title: string;
  durationMin?: number;
  splitType?: string;
  exercises: Exercise[];
  previousPerformance?: {
    lastDate?: string;
    streak?: number;
    prToday?: boolean;
  };
};
