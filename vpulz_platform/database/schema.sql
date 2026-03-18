CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  goal TEXT NOT NULL,
  level TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  movement_pattern TEXT,
  primary_muscle TEXT,
  equipment TEXT
);

CREATE TABLE workouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  total_volume NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES workouts(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  order_index INT NOT NULL
);

CREATE TABLE sets (
  id UUID PRIMARY KEY,
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id),
  weight NUMERIC(8,2) NOT NULL,
  reps INT NOT NULL,
  rpe NUMERIC(3,1),
  notes TEXT,
  logged_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE routines (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  split TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE routine_exercises (
  id UUID PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES routines(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  order_index INT NOT NULL
);

CREATE TABLE personal_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  pr_type TEXT NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  achieved_at TIMESTAMP NOT NULL
);

CREATE TABLE progress_metrics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  recorded_on DATE NOT NULL,
  estimated_1rm NUMERIC(8,2),
  weekly_volume NUMERIC(12,2),
  consistency_score NUMERIC(5,2),
  strength_score INT
);

CREATE TABLE ai_insights (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  insight_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768)
);
