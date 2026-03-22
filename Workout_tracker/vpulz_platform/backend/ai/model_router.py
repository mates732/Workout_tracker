from __future__ import annotations


def choose_model(question: str) -> str:
    q = question.lower()
    complex_markers = ["why", "stuck", "analyze", "program", "predict"]
    if any(marker in q for marker in complex_markers) or len(q) > 80:
        return "reasoning"
    return "fast"
