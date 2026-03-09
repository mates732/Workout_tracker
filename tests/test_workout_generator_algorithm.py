from workout_tracker import ExerciseDefinition, ExerciseType, ExperienceLevel, Goal, UserProfile
from workout_tracker.ai.workout_generator import AIWorkoutGenerator, ExerciseStat
from workout_tracker.services.exercise_database import ExerciseDatabase


def test_generator_implements_split_volume_order_and_blocks():
    generator = AIWorkoutGenerator()
    profile = UserProfile(
        user_id="u1",
        goal=Goal.STRENGTH,
        experience=ExperienceLevel.ADVANCED,
        workout_duration_minutes=75,
        equipment=["barbell", "dumbbell"],
        preferred_split="auto",
        weekly_frequency=5,
        target_muscles=["chest", "back"],
        current_phase="build",
    )
    pool = [
        ExerciseDefinition("Barbell Bench Press", ["chest"], ExerciseType.COMPOUND, category="compound", equipment="barbell"),
        ExerciseDefinition("Weighted Pull Up", ["back"], ExerciseType.COMPOUND, category="compound", equipment="barbell"),
        ExerciseDefinition("Incline Press", ["chest"], ExerciseType.HYPERTROPHY, category="secondary_compound", equipment="dumbbell"),
        ExerciseDefinition("Cable Fly", ["chest"], ExerciseType.ISOLATION, category="isolation", equipment="cable"),
        ExerciseDefinition("Face Pull", ["back"], ExerciseType.ISOLATION, category="isolation", equipment="dumbbell"),
        ExerciseDefinition("Plank", ["core"], ExerciseType.HYPERTROPHY, category="core", equipment="none"),
    ]

    workout = generator.generate(profile, pool, {"Barbell Bench Press": ExerciseStat(100, 5)})

    assert workout.split == "push_pull_legs"
    assert workout.warmup and workout.cooldown
    assert workout.exercises[0].exercise.category == "compound"
    assert workout.exercises[-1].exercise.category in {"isolation", "core"}
    assert workout.exercises[0].rep_min == 3
    assert workout.exercises[0].rep_max == 6
    assert workout.exercises[0].rest_seconds >= 120


def test_csv_database_contains_500_plus_exercises_and_can_be_loaded():
    db = ExerciseDatabase()
    loaded = db.load_from_csv("data/exercises.csv")

    assert len(loaded) >= 500
    assert loaded[0].name
    assert loaded[0].movement_pattern
