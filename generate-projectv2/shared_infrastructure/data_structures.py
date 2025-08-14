"""
Data Structures for the Multi-Agent Project Generation System
Based on the v2.md specification
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum

# Core data structures from v2.md specification

@dataclass
class Seed:
    """Initial input to start project generation"""
    topic: str
    grade_band: str
    constraints: Dict[str, Any] = field(default_factory=dict)

@dataclass 
class Spec:
    """Concrete specification that guides all downstream nodes"""
    subject: str
    grade_band: str
    skills: List[str]
    time_minutes: int
    guards: Dict[str, Any]
    schema_version: str = "0.1"

@dataclass
class StandardTarget:
    """Curriculum standard mapping"""
    code: str
    description: str
    evidence_note: str

@dataclass
class World:
    """Project setting and context"""
    theme: str  # 2-4 lines
    context: str
    constraints: List[str]

@dataclass
class TeacherObjective:
    """Single sentence teacher goal"""
    statement: str

@dataclass
class Role:
    """Student role definition"""
    name: str
    objective: str
    constraints: List[str]
    win_condition: str

@dataclass
class GlobalSteps:
    """Universal steps for all roles"""
    steps: List[Dict[str, str]]  # Each step has imperatives + expected artifacts

@dataclass
class SharedData:
    """Common variables and tables available to all roles"""
    knobs: Dict[str, Any]  # Difficulty/configuration parameters
    tables: Dict[str, List[Dict]]  # Named datasets

@dataclass
class IndividualBrief:
    """Role-specific data and steps"""
    role_name: str
    private_data: Dict[str, Any]
    individualized_steps: List[Dict[str, str]]

@dataclass
class FinalBundle:
    """Complete project package - final output"""
    world: World
    teacher_objective: TeacherObjective
    roles: List[Role]
    global_steps: GlobalSteps
    shared_data: SharedData
    individuals: List[IndividualBrief]
    standards: List[StandardTarget]
    schema_version: str = "0.1"

# Node processing states for orchestrator tracking
class NodeState(Enum):
    PENDING = "pending"
    PROCESSING = "processing" 
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class NodeResult:
    """Result from a node execution"""
    node_name: str
    state: NodeState
    output: Any
    thoughts_summary: Dict[str, Any]
    duration_ms: float
    error: Optional[str] = None