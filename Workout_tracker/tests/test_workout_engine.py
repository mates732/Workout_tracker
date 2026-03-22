from workout_tracker.engine import ExerciseDefinition, ExerciseType, WorkoutEngine


def test_workout_flow_and_summary():
    engine = WorkoutEngine()
    exercises = [
        ExerciseDefinition("Bench Press", ["chest", "triceps"], ExerciseType.COMPOUND),
        ExerciseDefinition("Cable Fly", ["chest"], ExerciseType.ISOLATION),
    ]

    engine.start_workout(exercises)
    first = engine.log_set("Bench Press", weight_kg=80, reps=8, rpe=8)
    assert first.rest_seconds_started == 120

    second = engine.quick_log("Bench Press", base_weight_kg=80, base_reps=8, action="+2.5kg")
    assert second.weight_kg == 82.5

    engine.log_set("Cable Fly", weight_kg=20, reps=12, rpe=9)

    workout = engine.finalize_workout(online=True, duration_minutes=58)
    summary = engine.workout_summary(workout)

    assert summary["duration_minutes"] == 58
    assert summary["total_sets"] == 3
    assert summary["total_volume"] == 1540
    assert summary["new_prs"]


def test_suggestion_and_performance_history_and_sync():
    engine = WorkoutEngine()
    exercises = [ExerciseDefinition("Bench Press", ["chest", "triceps"], ExerciseType.COMPOUND)]

    engine.start_workout(exercises)
    engine.log_set("Bench Press", 80, 8, 8)
    engine.finalize_workout(online=False, duration_minutes=40)

    assert engine.suggest_next_weight("Bench Press") is None
    assert len(engine.offline_queue) == 1

    synced = engine.sync_offline_queue()
    assert synced == 1

    suggested = engine.suggest_next_weight("Bench Press")
    assert suggested == 82.5

    performance = engine.get_exercise_performance("Bench Press")
    assert performance["weight_progression"] == [80]
    assert performance["rep_progression"] == [8]
    assert performance["volume_progression"] == [640]


def test_superset_data_can_be_defined():
    exercise_a = ExerciseDefinition(
        "Dumbbell Bench Press",
        ["chest"],
        ExerciseType.HYPERTROPHY,
        superset_group="A",
    )
    exercise_b = ExerciseDefinition(
        "Dumbbell Row",
        ["back"],
        ExerciseType.HYPERTROPHY,
        superset_group="A",
    )

    assert exercise_a.superset_group == exercise_b.superset_group == "A"
