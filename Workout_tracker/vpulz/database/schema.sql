CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  goal TEXT NOT NULL,
  experience TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE workouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP,
  total_volume NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  movement_pattern TEXT,
  primary_muscle TEXT,
  equipment TEXT
);

CREATE TABLE sets (
  id UUID PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES workouts(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  weight NUMERIC(8,2) NOT NULL,
  reps INT NOT NULL,
  rpe NUMERIC(3,1),
  notes TEXT
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

CREATE TABLE progress_metrics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  recorded_on DATE NOT NULL,
  estimated_1rm NUMERIC(8,2),
  weekly_volume NUMERIC(12,2),
  consistency_score NUMERIC(5,2)
);

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768)
);
