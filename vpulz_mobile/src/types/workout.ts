export type WorkoutSplit = 'legs' | 'arms' | 'chest' | 'back';

export type WorkoutSet = {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
  note?: string;
};

export type WorkoutExercise = {
  id: string;
  wgerExerciseId?: string;
  name: string;
  notes?: string;
  muscles: string[];
  equipment: string[];
  expanded: boolean;
  sets: WorkoutSet[];
};

export type WorkoutTemplate = {
  id: string;
  split: WorkoutSplit;
  name: string;
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
};

export type Workout = {
  id: string;
  date: string;
  split: WorkoutSplit;
  exercises: {
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }[];
};

export type Routine = {
  id: string;
  name: string;
  workoutIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type SplitDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type TrainingSplitDayAssignment = {
  day: SplitDay;
  workoutId: string | null;
};

export type TrainingSplit = {
  id: string;
  name: string;
  days: TrainingSplitDayAssignment[];
  createdAt: string;
  updatedAt: string;
};

export type WorkoutHistoryEntry = {
  id: string;
  workoutId: string;
  workoutName: string;
  split: WorkoutSplit;
  durationSec: number;
  completedAt: string;
  exerciseCount: number;
  setCount: number;
};

export type WorkoutSessionStatus = 'active' | 'finished';

export type WorkoutSession = {
  id: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  completedSets: number;
  totalSets: number;
  status: WorkoutSessionStatus;
};

export type CalendarItemType = 'manual' | 'split' | 'routine';

export type CalendarItem = {
  id: string;
  date: string;
  workoutId: string;
  type: CalendarItemType;
};

export type Exercise = {
  id: string;
  name: string;
  description: string;
  muscles: string[];
  equipment: string[];
  instructions: string;
  imageUrl?: string | null;
};
