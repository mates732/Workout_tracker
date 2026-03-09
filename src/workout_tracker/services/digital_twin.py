# services/digital_twin.py
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class TwinState:
    strength_index: float
    fatigue_index: float


def simulate_training_response(volume: float, intensity: float, frequency: int) -> TwinState:
    """Simulate weekly response from load variables."""
    if volume < 0 or intensity < 0 or frequency < 0:
        raise ValueError("volume, intensity and frequency must be non-negative")
    strength_index = (volume * 0.0025) + (intensity * 0.6) + (frequency * 1.2)
    fatigue_index = (volume * 0.0035) + (intensity * 0.8) + (frequency * 1.5)
    return TwinState(strength_index=round(strength_index, 2), fatigue_index=round(fatigue_index, 2))


def predict_strength_gain(volume: float, intensity: float, frequency: int) -> float:
    """Predict strength gain score for next microcycle."""
    state = simulate_training_response(volume, intensity, frequency)
    return round(max(0.0, state.strength_index - (state.fatigue_index * 0.35)), 2)


def predict_fatigue_accumulation(volume: float, intensity: float, frequency: int) -> float:
    """Predict fatigue accumulation score."""
    return simulate_training_response(volume, intensity, frequency).fatigue_index


def optimize_next_week_program(volume: float, intensity: float, frequency: int) -> dict[str, float | int]:
    """Adjust next-week program by simulated fatigue/strength response."""
    gain = predict_strength_gain(volume, intensity, frequency)
    fatigue = predict_fatigue_accumulation(volume, intensity, frequency)

    if fatigue > 55:
        return {"volume": round(volume * 0.85, 1), "intensity": round(intensity * 0.95, 2), "frequency": max(2, frequency - 1)}
    if gain > 18:
        return {"volume": round(volume * 1.05, 1), "intensity": round(intensity * 1.02, 2), "frequency": frequency}
    return {"volume": round(volume, 1), "intensity": round(intensity, 2), "frequency": frequency}
