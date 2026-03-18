# ui/components.py
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class UIComponent:
    name: str
    title: str
    description: str
    layout: str


@dataclass(frozen=True)
class ScreenBlueprint:
    name: str
    intent_question: str
    structure: tuple[str, ...]
    constraints: tuple[str, ...]


def home_headline() -> UIComponent:
    return UIComponent("home_headline", "Home Headline", "Single-line prompt answering what the user should do now.", "text_block")


def dominant_primary_action() -> UIComponent:
    return UIComponent(
        "dominant_primary_action",
        "Dominant Primary Action",
        "Single CTA occupying 40-60% of viewport height: Start/Continue Workout.",
        "hero_action",
    )


def quiet_context_item() -> UIComponent:
    return UIComponent(
        "quiet_context_item",
        "Quiet Context Item",
        "Low-contrast secondary context line (max two items) such as today's plan or last workout summary.",
        "meta_row",
    )


def exercise_row() -> UIComponent:
    return UIComponent(
        "exercise_row",
        "Exercise Row",
        "Cardless row with name, small gray last-performance metadata, and inline editable sets.",
        "list_row",
    )


def searchable_list() -> UIComponent:
    return UIComponent(
        "searchable_list",
        "Searchable List",
        "Always-visible search bar, flat list results, filters hidden behind one control.",
        "search_list",
    )


def settings_row() -> UIComponent:
    return UIComponent("settings_row", "Settings Row", "Single list row for profile/settings destinations.", "list_row")


def edge_ai_coach_button() -> UIComponent:
    return UIComponent(
        "edge_ai_coach_button",
        "Edge AI Coach Button",
        "50% opacity floating circle constrained to screen edges so it never blocks primary content.",
        "edge_fab",
    )


def home_decision_screen() -> ScreenBlueprint:
    return ScreenBlueprint(
        name="home_decision",
        intent_question="What should the user do right now?",
        structure=(
            "Top 20%: one-line headline.",
            "Middle 55%: dominant primary action.",
            "Bottom 25%: at most two quiet context items.",
        ),
        constraints=(
            "No dashboard grids.",
            "No more than one dominant action.",
            "Secondary context must not compete with CTA.",
        ),
    )


def workout_tool_screen() -> ScreenBlueprint:
    return ScreenBlueprint(
        name="workout_tool",
        intent_question="Which set do I log next?",
        structure=(
            "Vertical exercise list only.",
            "Each exercise row includes inline set inputs for weight and reps.",
            "Bottom actions: + Add Exercise and Finish Workout.",
        ),
        constraints=(
            "No cards, shadows, or popups for set editing.",
            "Keep only essential actions prominent.",
        ),
    )


def exercise_library_screen() -> ScreenBlueprint:
    return ScreenBlueprint(
        name="exercise_library",
        intent_question="What exercise am I looking for?",
        structure=(
            "Top fixed search bar.",
            "Single scrolling list beneath search.",
            "One filter button revealing all filters on demand.",
        ),
        constraints=(
            "No faceted filter walls.",
            "No visual cards in results.",
        ),
    )


def profile_settings_screen() -> ScreenBlueprint:
    return ScreenBlueprint(
        name="profile_settings",
        intent_question="What account or progress area do I manage?",
        structure=(
            "Plain list sections: Progress, Body Metrics, Goals, Workout History.",
            "Optional inline value previews as muted metadata.",
        ),
        constraints=(
            "No dashboard cards.",
            "Treat this screen as settings architecture.",
        ),
    )


def bottom_navigation() -> UIComponent:
    return UIComponent("bottom_navigation", "Bottom Navigation", "Max 4 tabs: Home, Workout, Progress, Profile.", "tab_bar")


def visual_system_rules() -> tuple[str, ...]:
    return (
        "Background must be #000000 or near-black.",
        "Text colors limited to white and neutral grays.",
        "Use only one accent color across all screens.",
        "Large spacing is mandatory; dense stacking is prohibited.",
    )


def spacing_scale() -> dict[str, int]:
    return {"xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32, "xxl": 48, "hero": 64}


def regression_guardrails() -> tuple[str, ...]:
    return (
        "Every screen must have one explicit primary action.",
        "If a screen has more than three visual emphasis levels, it fails review.",
        "Any new widget must map to an existing reusable component.",
        "If users cannot answer 'what now?' within one second, redesign is required.",
    )


def dashboard() -> UIComponent:
    """Backward-compatible alias for the restructured home decision screen."""
    return UIComponent("home_decision", "Home Decision", "Decision-first home screen with one dominant action.", "screen")


def workout_card() -> UIComponent:
    """Backward-compatible alias for dominant action component."""
    return UIComponent("dominant_primary_action", "Dominant Primary Action", "Large CTA replacing dashboard card stacks.", "hero_action")
