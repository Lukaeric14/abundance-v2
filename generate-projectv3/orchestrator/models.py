from __future__ import annotations

from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field


class WorldConstraints(BaseModel):
    gradeBand: Optional[str] = None
    durationMin: int = Field(default=30, ge=5, le=180)


class World(BaseModel):
    title: str
    summary: Optional[str] = None
    constraints: WorldConstraints = Field(default_factory=WorldConstraints)


class TeacherObjective(BaseModel):
    text: str


class Role(BaseModel):
    id: str
    title: str
    objective: str


class NarrativeArtifact(BaseModel):
    world: World
    teacherObjective: TeacherObjective
    roles: List[Role]


class NodeOutput(BaseModel):
    kind: Literal["narrative", "steps", "sharedData"]
    content: Dict[str, Any]


class OrchestratorControls(BaseModel):
    start_from: Optional[str] = None
    stop_after: Optional[str] = None


class OrchestratorState(BaseModel):
    run_id: str
    project_id: str
    chat_id: str
    seed: Dict[str, Any] = Field(default_factory=dict)
    bundle: Dict[str, Any] = Field(default_factory=dict)
    thoughts: List[str] = Field(default_factory=list)
    flags: Dict[str, Any] = Field(default_factory=dict)
    controls: Dict[str, Any] = Field(default_factory=dict)

    current_phase: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()


