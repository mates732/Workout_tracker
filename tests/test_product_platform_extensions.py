from datetime import datetime

from workout_tracker.core.models import ExerciseDefinition, ExerciseType, SetLog, WorkoutHistoryEntry
from workout_tracker.services.coaching_engine import daily_coaching_brief
from workout_tracker.services.digital_twin import optimize_next_week_program, predict_strength_gain, simulate_training_response
from workout_tracker.services.equipment_manager import detect_available_equipment, filter_exercises_by_equipment
from workout_tracker.services.exercise_intelligence import classify_exercise_stimulus, suggest_execution_cues
from workout_tracker.services.export import export_workouts_csv, export_workouts_json, generate_progress_report
from workout_tracker.services.gamification import GamificationProfile, achievement_badges, award_xp, update_streak
from workout_tracker.services.habits import HabitStatus, habit_completion_rate, habit_feedback, track_habit_completion
from workout_tracker.services.mobility import mobility_recommendations
from workout_tracker.services.notifications import goal_milestone_notification, recovery_reminder, workout_reminder
from workout_tracker.services.rest_timer import extend_rest, skip_rest, start_rest_timer
from workout_tracker.ui.components import dashboard, workout_card
from workout_tracker.ui.theme import get_theme


def test_theme_components_and_notifications():
    dark = get_theme("dark")
    light = get_theme("light")
    assert dark.primary.c500.startswith("#")
    assert light.gradient_primary.startswith("linear-gradient")
    assert dashboard().name == "dashboard"
    assert workout_card().layout == "card"

    now = datetime.utcnow()
    assert workout_reminder(now).title
    assert recovery_reminder(12).send_at > now
    assert "50%" in goal_milestone_notification("Bench Goal", "50%").message


def test_digital_twin_and_coaching_flow():
    state = simulate_training_response(volume=10000, intensity=7.5, frequency=4)
    assert state.strength_index > 0
    assert predict_strength_gain(10000, 7.5, 4) >= 0

    optimized = optimize_next_week_program(12000, 8.5, 5)
    assert optimized["frequency"] >= 2

    brief = daily_coaching_brief(7.5, 4.0, 7500, 60, "increasing")
    assert 0 <= brief["readiness"] <= 100


def test_equipment_exercise_mobility_and_habits():
    exercises = [
        ExerciseDefinition("Bench Press", ["chest"], ExerciseType.COMPOUND, movement_pattern="push", equipment="barbell", category="compound"),
        ExerciseDefinition("Push Up", ["chest"], ExerciseType.COMPOUND, movement_pattern="push", equipment="none", category="compound"),
    ]
    available = detect_available_equipment(["dumbbell", "none"])
    filtered = filter_exercises_by_equipment(exercises, available)
    assert any(item.name == "Push Up" for item in filtered)

    profile = classify_exercise_stimulus(exercises[0])
    assert profile["primary_focus"] == "chest"
    assert suggest_execution_cues(exercises[0])

    recs = mobility_recommendations(["back", "shoulders"], {"back": 8.0})
    assert recs

    habit = HabitStatus(name="Hydration", target_per_week=7)
    track_habit_completion(habit, True)
    assert habit_completion_rate(habit) > 0
    assert habit_feedback(habit)


def test_export_gamification_and_rest_timer():
    history = [WorkoutHistoryEntry(date=datetime.utcnow(), duration_minutes=50, exercises={"Bench": [SetLog(1, 80, 8, 8)]})]
    assert "total_volume" in export_workouts_json(history)
    assert "date" in export_workouts_csv(history)
    assert "Sessions:" in generate_progress_report(history)

    profile = GamificationProfile()
    award_xp(profile, 85)
    update_streak(profile, True)
    assert profile.level >= 1
    assert isinstance(achievement_badges(profile), list)

    timer = start_rest_timer(90)
    extend_rest(timer, 30)
    assert timer.remaining_seconds == 120
    skip_rest(timer)
    assert timer.remaining_seconds == 0
