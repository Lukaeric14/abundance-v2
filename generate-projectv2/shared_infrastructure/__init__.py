"""
Shared Infrastructure for Multi-Agent Project Generation System
"""

from .thought_logger import ThoughtLogger, ThoughtType, Thought
from .data_structures import (
    Seed, Spec, StandardTarget, World, TeacherObjective, Role,
    GlobalSteps, SharedData, IndividualBrief, FinalBundle,
    NodeState, NodeResult
)
from .base_node import BaseNode

__all__ = [
    'ThoughtLogger', 'ThoughtType', 'Thought',
    'Seed', 'Spec', 'StandardTarget', 'World', 'TeacherObjective', 'Role',
    'GlobalSteps', 'SharedData', 'IndividualBrief', 'FinalBundle',
    'NodeState', 'NodeResult',
    'BaseNode'
]