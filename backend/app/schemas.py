"""Pydantic 响应模型。"""
from pydantic import BaseModel, Field


class AcupointBrief(BaseModel):
    id: str
    name: str
    relative_x: float | None = None
    relative_y: float | None = None
    relative_z: float | None = None
    body_part: str | None = None
    symptoms: str | None = None


class Acupoint(AcupointBrief):
    location: str | None = None
    massage: str | None = None
    contraindications: str | None = None
    efficacy: str | None = None
    source: str | None = None


class SearchResponse(BaseModel):
    query: str
    count: int
    results: list[Acupoint]


class CategoryGroup(BaseModel):
    body_part: str
    count: int
    points: list[dict] = Field(default_factory=list)