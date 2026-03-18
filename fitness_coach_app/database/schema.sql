CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE workouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  total_volume NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE exercises (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  muscle_group TEXT NOT NULL,
  equipment TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);

CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP
);

CREATE INDEX idx_workout_sessions_user_status ON workout_sessions(user_id, status);
CREATE INDEX idx_workout_sessions_user_start ON workout_sessions(user_id, start_time);

CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id BIGINT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  ordering INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_workout_exercises_workout_exercise UNIQUE (workout_id, exercise_id)
);

CREATE INDEX idx_workout_exercises_workout_ordering ON workout_exercises(workout_id, ordering);

CREATE TABLE set_logs (
  id UUID PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  exercise_id BIGINT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight DOUBLE PRECISION NOT NULL,
  reps INTEGER NOT NULL,
  rpe DOUBLE PRECISION NOT NULL,
  duration INTEGER NOT NULL DEFAULT 90,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_set_logs_workout_exercise_created ON set_logs(workout_exercise_id, created_at);
CREATE INDEX idx_set_logs_user_exercise_created ON set_logs(user_id, exercise_id, created_at);
