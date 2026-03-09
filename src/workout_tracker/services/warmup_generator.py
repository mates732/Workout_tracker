# services/warmup_generator.py
from __future__ import annotations


def generate_warmup_sets(working_weight: float, working_sets: int) -> list[dict[str, int | float]]:
    """Generate warmup progression ramp sets.

    Args:
        working_weight: Planned top/working weight in kilograms.
        working_sets: Number of working sets (must be positive).

    Returns:
        List of warmup set dictionaries with `weight` and `reps`.
    """
    if working_weight <= 0:
        raise ValueError("working_weight must be positive")
    if working_sets <= 0:
        raise ValueError("working_sets must be positive")

    ramps = [0.25, 0.5, 0.7, 0.85]
    reps = [10, 8, 5, 3]

    warmups: list[dict[str, int | float]] = []
    for ratio, rep in zip(ramps, reps, strict=True):
        weight = max(20.0, round(working_weight * ratio, 1))
        warmups.append({"weight": weight, "reps": rep})

    # Fewer warmups for low working set counts / very light loads.
    if working_sets == 1 or working_weight < 40:
        return warmups[:2]
    if working_sets == 2 or working_weight < 60:
        return warmups[:3]
    return warmups
