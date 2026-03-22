CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(6,2),
  age INT,
  gender TEXT,
  experience_level TEXT NOT NULL,
  goal TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE workouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  phase_id UUID,
  workout_type TEXT NOT NULL,
  duration_minutes INT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  equipment TEXT NOT NULL,
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT,
  difficulty TEXT,
  movement_pattern TEXT,
  instructions TEXT,
  video_url TEXT
);

CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES workouts(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  order_index INT NOT NULL,
  sets INT NOT NULL,
  rep_min INT NOT NULL,
  rep_max INT NOT NULL,
  target_rpe NUMERIC(3,1),
  rest_seconds INT,
  weight_kg NUMERIC(8,2),
  completed_sets INT DEFAULT 0
);

CREATE TABLE progress_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  weight NUMERIC(6,2),
  body_fat NUMERIC(4,2),
  steps INT,
  sleep_hours NUMERIC(4,2),
  notes TEXT
);

CREATE TABLE muscle_fatigue (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  muscle_group TEXT NOT NULL,
  fatigue_score NUMERIC(6,2) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
