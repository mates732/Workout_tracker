-- VPULZ extended ecosystem schema for AI + social + growth systems

CREATE TABLE strength_twin_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  model_version TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE strength_twin_scenarios (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  scenario_name TEXT NOT NULL,
  frequency_delta NUMERIC(5,2),
  volume_delta NUMERIC(5,2),
  bodyweight_delta NUMERIC(5,2),
  rep_range TEXT,
  split_type TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE strength_twin_forecasts (
  id UUID PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES strength_twin_scenarios(id),
  horizon TEXT NOT NULL,
  bench_est_1rm NUMERIC(8,2),
  squat_est_1rm NUMERIC(8,2),
  deadlift_est_1rm NUMERIC(8,2),
  ohp_est_1rm NUMERIC(8,2),
  confidence NUMERIC(5,2)
);

CREATE TABLE training_dna_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  volume_tolerance TEXT,
  intensity_tolerance TEXT,
  recovery_speed TEXT,
  fatigue_pattern TEXT,
  optimal_frequency TEXT,
  archetype TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE lift_weakness_signals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  lift_name TEXT NOT NULL,
  weakness_type TEXT NOT NULL,
  confidence NUMERIC(5,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE corrective_recommendations (
  id UUID PRIMARY KEY,
  weakness_signal_id UUID NOT NULL REFERENCES lift_weakness_signals(id),
  exercise_name TEXT NOT NULL,
  dosage TEXT NOT NULL
);

CREATE TABLE companion_decisions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  workout_id UUID REFERENCES workouts(id),
  decision_type TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE hero_timeline_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_payload JSONB,
  event_date DATE NOT NULL
);

CREATE TABLE strength_benchmarks (
  id UUID PRIMARY KEY,
  cohort_key TEXT NOT NULL,
  lift_name TEXT NOT NULL,
  p50 NUMERIC(8,2),
  p75 NUMERIC(8,2),
  p90 NUMERIC(8,2),
  computed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_percentiles (
  user_id UUID NOT NULL REFERENCES users(id),
  lift_name TEXT NOT NULL,
  percentile NUMERIC(5,2) NOT NULL,
  computed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lift_name)
);

CREATE TABLE rivalries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  rival_user_id UUID NOT NULL REFERENCES users(id),
  lift_name TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE leaderboards (
  id UUID PRIMARY KEY,
  scope TEXT NOT NULL,
  scope_value TEXT NOT NULL,
  lift_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  score NUMERIC(10,2) NOT NULL,
  rank INT NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE quests (
  id UUID PRIMARY KEY,
  cadence TEXT NOT NULL,
  title TEXT NOT NULL,
  objective_type TEXT NOT NULL,
  objective_value NUMERIC(10,2),
  xp_reward INT NOT NULL
);

CREATE TABLE user_quest_progress (
  user_id UUID NOT NULL REFERENCES users(id),
  quest_id UUID NOT NULL REFERENCES quests(id),
  progress NUMERIC(10,2) NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, quest_id)
);

CREATE TABLE user_levels (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  xp BIGINT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT 'Gym Apprentice',
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE share_cards (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  card_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE challenge_links (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  code TEXT UNIQUE NOT NULL,
  lift_name TEXT,
  target_value NUMERIC(8,2),
  expires_at TIMESTAMP
);

CREATE TABLE injury_risk_signals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  risk_score NUMERIC(5,2) NOT NULL,
  risk_factors JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE adaptive_deload_recommendations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  recommended BOOLEAN NOT NULL,
  rationale TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
