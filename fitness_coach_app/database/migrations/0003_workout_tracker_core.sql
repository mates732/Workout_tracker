CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_status ON workout_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_start ON workout_sessions(user_id, start_time);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id BIGINT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  ordering INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_workout_exercises_workout_exercise UNIQUE (workout_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_ordering ON workout_exercises(workout_id, ordering);

CREATE TABLE IF NOT EXISTS set_logs (
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

CREATE INDEX IF NOT EXISTS idx_set_logs_workout_exercise_created ON set_logs(workout_exercise_id, created_at);
CREATE INDEX IF NOT EXISTS idx_set_logs_user_exercise_created ON set_logs(user_id, exercise_id, created_at);

