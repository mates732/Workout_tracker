CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activation_level_enum') THEN
    CREATE TYPE activation_level_enum AS ENUM ('primary', 'secondary', 'stabilizer');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level_enum') THEN
    CREATE TYPE difficulty_level_enum AS ENUM ('beginner', 'intermediate', 'advanced');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type_enum') THEN
    CREATE TYPE media_type_enum AS ENUM ('video', 'gif', 'image');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  muscle_group TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS movement_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS exercise_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name TEXT NOT NULL UNIQUE
);

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS primary_muscle_id UUID REFERENCES muscles(id),
  ADD COLUMN IF NOT EXISTS movement_pattern_id UUID REFERENCES movement_patterns(id),
  ADD COLUMN IF NOT EXISTS equipment_type_id UUID REFERENCES equipment(id),
  ADD COLUMN IF NOT EXISTS difficulty_level difficulty_level_enum DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS is_compound BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE exercises
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

ALTER TABLE exercises
  ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'exercises_slug_key'
  ) THEN
    ALTER TABLE exercises ADD CONSTRAINT exercises_slug_key UNIQUE (slug);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS exercise_muscle_map (
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_id UUID NOT NULL REFERENCES muscles(id),
  activation_level activation_level_enum NOT NULL,
  PRIMARY KEY (exercise_id, muscle_id, activation_level)
);

CREATE TABLE IF NOT EXISTS exercise_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  equipment UUID REFERENCES equipment(id),
  grip_type TEXT,
  stance_type TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS exercise_tag_map (
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES exercise_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (exercise_id, tag_id)
);

CREATE TABLE IF NOT EXISTS exercise_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  media_type media_type_enum NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT
);

CREATE TABLE IF NOT EXISTS exercise_ai_metadata (
  exercise_id UUID PRIMARY KEY REFERENCES exercises(id) ON DELETE CASCADE,
  fatigue_score SMALLINT NOT NULL CHECK (fatigue_score BETWEEN 1 AND 10),
  skill_requirement SMALLINT NOT NULL CHECK (skill_requirement BETWEEN 1 AND 10),
  injury_risk SMALLINT NOT NULL CHECK (injury_risk BETWEEN 1 AND 10),
  recommended_rep_range INT4RANGE NOT NULL,
  movement_pattern UUID REFERENCES movement_patterns(id)
);

CREATE TABLE IF NOT EXISTS user_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  primary_muscle UUID NOT NULL REFERENCES muscles(id),
  equipment UUID REFERENCES equipment(id),
  movement_pattern UUID REFERENCES movement_patterns(id),
  difficulty_level difficulty_level_enum NOT NULL DEFAULT 'beginner',
  notes TEXT,
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE TABLE IF NOT EXISTS user_favorite_exercises (
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('system', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id, source_type)
);

CREATE TABLE IF NOT EXISTS user_recent_exercises (
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('system', 'user')),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id, source_type)
);

CREATE OR REPLACE VIEW exercise_catalog_v AS
SELECT
  e.id,
  e.name,
  e.slug,
  e.primary_muscle_id AS primary_muscle,
  e.movement_pattern_id AS movement_pattern,
  e.equipment_type_id AS equipment,
  e.difficulty_level,
  e.description,
  FALSE AS is_user_exercise,
  NULL::UUID AS owner_user_id,
  e.created_at,
  e.updated_at
FROM exercises e
UNION ALL
SELECT
  ue.id,
  ue.name,
  ue.slug,
  ue.primary_muscle,
  ue.movement_pattern,
  ue.equipment,
  ue.difficulty_level,
  ue.notes AS description,
  TRUE AS is_user_exercise,
  ue.user_id AS owner_user_id,
  ue.created_at,
  ue.updated_at
FROM user_exercises ue;

CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm ON exercises USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_exercises_name_trgm ON user_exercises USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises(primary_muscle_id);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_exercises_pattern ON exercises(movement_pattern_id);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_exercises_compound ON exercises(is_compound);
CREATE INDEX IF NOT EXISTS idx_exercises_hot_filter ON exercises(movement_pattern_id, equipment_type_id, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_exercise_muscle_map_lookup ON exercise_muscle_map(muscle_id, activation_level, exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_tag_map_lookup ON exercise_tag_map(tag_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_recent_exercises ON user_recent_exercises(user_id, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites ON user_favorite_exercises(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_exercises_private ON user_exercises(user_id, created_at DESC) WHERE is_private = TRUE;
