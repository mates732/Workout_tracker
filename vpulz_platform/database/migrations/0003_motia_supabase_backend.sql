CREATE SCHEMA IF NOT EXISTS app_core;

CREATE TABLE IF NOT EXISTS app_core.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_core.workouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_core.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  duration INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_core.exercises (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT exercises_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS app_core.workout_exercises (
  id UUID PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES app_core.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES app_core.exercises(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workout_exercises_unique_order UNIQUE (workout_id, order_index)
);

CREATE TABLE IF NOT EXISTS app_core.sets (
  id UUID PRIMARY KEY,
  workout_exercise_id UUID NOT NULL REFERENCES app_core.workout_exercises(id) ON DELETE CASCADE,
  weight NUMERIC(8,2) NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'normal',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sets_type_valid CHECK (type IN ('W', 'normal', 'D', 'F'))
);

CREATE TABLE IF NOT EXISTS app_core.training_plans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_core.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT training_plan_per_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS app_core.calendar_entries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_core.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT calendar_status_valid CHECK (status IN ('planned', 'completed', 'sick')),
  CONSTRAINT calendar_entry_per_day UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON app_core.workouts (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON app_core.workout_exercises (workout_id, order_index);
CREATE INDEX IF NOT EXISTS idx_sets_workout_exercise ON app_core.sets (workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON app_core.calendar_entries (user_id, date DESC);
