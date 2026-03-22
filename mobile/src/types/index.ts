export interface Workout {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
  created_at: string;
  duration_minutes?: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  muscle_group?: string;
  equipment?: string;
}

export interface WorkoutSet {
  set_number: number;
  reps?: number;
  weight_kg?: number;
  duration_seconds?: number;
  rest_seconds?: number;
}

export interface WorkoutLog {
  id: string;
  workout_id: string;
  workout_name: string;
  logged_at: string;
  duration_minutes?: number;
  notes?: string;
}

export type RootStackParamList = {
  Home: undefined;
  WorkoutList: undefined;
  WorkoutDetail: { workoutId: string };
  LogWorkout: { workoutId: string };
  WorkoutHistory: undefined;
};
