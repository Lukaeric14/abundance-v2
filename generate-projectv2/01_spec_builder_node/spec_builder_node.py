"""
Node 1: Spec Builder - Simple passthrough
"""

import sys
import os

# Add shared infrastructure to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared_infrastructure'))

from base_node import BaseNode
from data_structures import Seed, Spec

class SpecBuilderNode(BaseNode):
    
    def __init__(self):
        super().__init__("SpecBuilder")
    
    def _process_logic(self, seed: Seed) -> Spec:
        return Spec(
            subject='math',
            grade_band=seed.grade_band,
            skills=['problem_solving', 'collaboration'],
            time_minutes=seed.constraints.get('duration_min', 45),
            guards={'safe_content': True},
            schema_version="0.1"
        )