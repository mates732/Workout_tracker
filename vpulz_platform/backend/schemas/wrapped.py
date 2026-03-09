from __future__ import annotations

from pydantic import BaseModel, Field


class WrappedRequest(BaseModel):
    period: str = Field(default="monthly", pattern="^(weekly|bi-weekly|monthly)$")


class WrappedSlide(BaseModel):
    order: int
    title: str
    body: str
    metric_key: str
    metric_value: str
    share_caption: str


class WrappedResponse(BaseModel):
    period: str
    metrics: dict
    ai_commentary: list[str]
    slides: list[WrappedSlide]
