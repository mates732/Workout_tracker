from workout_tracker import ExerciseDefinition, ExerciseType, FitnessPlatform
from workout_tracker.core.models import SetLog, WorkoutPrescription
from workout_tracker.services.fatigue_autoregulation import (
    AutoregulationService,
    MuscleFatigueModel,
    ReadinessSignals,
)


def test_muscle_fatigue_points_and_decay_model():
    model = MuscleFatigueModel()
    exercises = [
        ExerciseDefinition("Bench Press", ["chest"], ExerciseType.COMPOUND, category="compound"),
        ExerciseDefinition("Fly", ["chest"], ExerciseType.ISOLATION, category="isolation"),
    ]
    logs = {
        "Bench Press": [SetLog(1, 80, 8, 8), SetLog(2, 80, 8, 9)],
        "Fly": [SetLog(1, 20, 12, 8)],
    }

    fatigue = model.score_workout_fatigue(exercises, logs)
    assert fatigue["chest"] == 7
    assert model.decay("chest", elapsed_hours=24, current_score=7) == 3.5


def test_autoregulation_adjusts_weight_volume_and_intensity():
    service = AutoregulationService()
    prescription = WorkoutPrescription(
        exercise=ExerciseDefinition("Bench Press", ["chest"], ExerciseType.COMPOUND, category="compound"),
        sets=5,
        rep_min=3,
        rep_max=6,
        target_rpe=8.5,
        rest_seconds=180,
        suggested_weight_kg=100,
    )

    aggressive = ReadinessSignals(0.99, 7.0, 0.9, 8.0, 3.0)
    easier_next = service.adjust_next_workout([prescription], aggressive)[0]
    assert easier_next.suggested_weight_kg > 100

    constrained = ReadinessSignals(0.7, 9.2, 0.5, 5.5, 8.0)
    deload_next = service.adjust_next_workout([prescription], constrained)[0]
    assert deload_next.suggested_weight_kg < 100
    assert deload_next.sets == 4
    assert deload_next.target_rpe < 8.5


def test_platform_can_apply_readiness_to_generated_workout():
    platform = FitnessPlatform()
    assert platform.autoregulation is not None
