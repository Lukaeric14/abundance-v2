"""
Node 1: Spec Builder
Transforms a basic seed into a concrete, constrained specification
"""

import re
import sys
import os
from typing import Dict, List

# Add shared infrastructure to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared_infrastructure'))

from base_node import BaseNode
from data_structures import Seed, Spec

class SpecBuilderNode(BaseNode):
    """
    Spec Builder Node - First node in the pipeline
    Purpose: Turn Seed into a concrete, constrained spec all nodes can trust
    """
    
    def __init__(self):
        super().__init__("SpecBuilder")
        
        # Subject detection patterns
        self.subject_patterns = {
            'math': ['fraction', 'algebra', 'geometry', 'calculate', 'equation', 'number', 'math', 'arithmetic'],
            'science': ['experiment', 'hypothesis', 'observation', 'biology', 'chemistry', 'physics', 'lab'],
            'ela': ['writing', 'reading', 'literature', 'essay', 'story', 'grammar', 'language'],
            'social_studies': ['history', 'geography', 'government', 'culture', 'society', 'civilization']
        }
        
        # Grade band constraints
        self.grade_constraints = {
            'K-2': {'max_time': 30, 'vocab_level': 'basic', 'complexity': 'simple'},
            '3-5': {'max_time': 45, 'vocab_level': 'elementary', 'complexity': 'moderate'},
            '6-8': {'max_time': 60, 'vocab_level': 'intermediate', 'complexity': 'complex'},
            '9-12': {'max_time': 90, 'vocab_level': 'advanced', 'complexity': 'sophisticated'}
        }
    
    def _process_logic(self, seed: Seed) -> Spec:
        """Core spec building logic - simple passthrough with minimal enhancement"""
        
        if not self.validate_input(seed, Seed):
            raise ValueError("Invalid seed input")
        
        # Simple subject detection (just use 'math' as default)
        subject = 'math'
        
        # Keep it simple - just extract basic skills
        skills = ['problem_solving', 'collaboration']
        
        # Use the time from constraints if provided, otherwise default to 45
        time_minutes = seed.constraints.get('duration_min', 45)
        
        # Minimal guards
        guards = {
            'grade_band': seed.grade_band,
            'safe_content': True
        }
        
        spec = Spec(
            subject=subject,
            grade_band=seed.grade_band,
            skills=skills,
            time_minutes=time_minutes,
            guards=guards,
            schema_version="0.1"
        )
        
        return spec
    
    def _detect_subject(self, topic: str) -> str:
        """Analyze topic to determine subject area"""
        
        self.thoughts.deciding("Analyzing topic to determine subject area...")
        
        topic_lower = topic.lower()
        subject_scores = {}
        
        # Score each subject based on keyword matches
        for subject, keywords in self.subject_patterns.items():
            score = sum(1 for keyword in keywords if keyword in topic_lower)
            if score > 0:
                subject_scores[subject] = score
                self.thoughts.processing(f"Subject '{subject}' scored {score} points")
        
        if not subject_scores:
            self.thoughts.deciding("No clear subject match found, defaulting to 'math' for structured learning")
            return 'math'
        
        best_subject = max(subject_scores, key=subject_scores.get)
        confidence = subject_scores[best_subject]
        
        self.thoughts.deciding(
            f"Determined subject: '{best_subject}' with confidence score {confidence}", 
            {"subject_scores": subject_scores}
        )
        
        return best_subject
    
    def _extract_skills(self, topic: str, subject: str) -> List[str]:
        """Extract target skills from topic and subject area"""
        
        self.thoughts.processing(f"Extracting target skills for {subject} topic...")
        
        skills = []
        topic_lower = topic.lower()
        
        # Subject-specific skill extraction
        if subject == 'math':
            skills = self._extract_math_skills(topic_lower)
        elif subject == 'science':
            skills = self._extract_science_skills(topic_lower)
        elif subject == 'ela':
            skills = self._extract_ela_skills(topic_lower)
        elif subject == 'social_studies':
            skills = self._extract_social_studies_skills(topic_lower)
        
        # Ensure we always have at least one skill
        if not skills:
            skills = [f"foundational_{subject}"]
            self.thoughts.warning(f"No specific skills detected, using foundational skill for {subject}")
        
        self.thoughts.processing(f"Identified {len(skills)} target skills", {"skills": skills})
        
        return skills
    
    def _extract_math_skills(self, topic: str) -> List[str]:
        """Extract math-specific skills"""
        skills = []
        
        if 'fraction' in topic:
            skills.extend(['fraction_operations', 'rational_numbers', 'equivalent_fractions'])
        if any(word in topic for word in ['add', 'subtract', 'multiply', 'divide']):
            skills.append('arithmetic_operations')
        if any(word in topic for word in ['graph', 'plot', 'chart']):
            skills.append('data_representation')
        if any(word in topic for word in ['equation', 'solve', 'variable']):
            skills.append('algebraic_thinking')
        
        return skills
    
    def _extract_science_skills(self, topic: str) -> List[str]:
        """Extract science-specific skills"""
        skills = ['scientific_method']  # Always include this
        
        if any(word in topic for word in ['experiment', 'test', 'hypothesis']):
            skills.append('experimental_design')
        if any(word in topic for word in ['observe', 'measure', 'data']):
            skills.append('data_collection')
        if any(word in topic for word in ['conclude', 'analyze', 'interpret']):
            skills.append('data_analysis')
            
        return skills
    
    def _extract_ela_skills(self, topic: str) -> List[str]:
        """Extract ELA-specific skills"""
        skills = []
        
        if any(word in topic for word in ['write', 'essay', 'composition']):
            skills.append('written_communication')
        if any(word in topic for word in ['read', 'comprehension', 'analyze']):
            skills.append('reading_comprehension')
        if any(word in topic for word in ['persuade', 'argue', 'convince']):
            skills.append('persuasive_writing')
            
        return skills
    
    def _extract_social_studies_skills(self, topic: str) -> List[str]:
        """Extract social studies-specific skills"""
        skills = []
        
        if any(word in topic for word in ['history', 'past', 'timeline']):
            skills.append('historical_analysis')
        if any(word in topic for word in ['geography', 'location', 'map']):
            skills.append('geographic_reasoning')
        if any(word in topic for word in ['government', 'citizen', 'democracy']):
            skills.append('civic_understanding')
            
        return skills
    
    def _calculate_time_allocation(self, topic: str, grade_band: str, skills: List[str]) -> int:
        """Determine appropriate time allocation"""
        
        self.thoughts.deciding(f"Calculating time allocation for {grade_band} complexity...")
        
        # Base time from grade band constraints
        constraints = self.grade_constraints.get(grade_band, self.grade_constraints['6-8'])
        base_time = constraints['max_time']
        
        # Adjust based on complexity indicators
        complexity_multiplier = 1.0
        
        # More skills = more time needed
        if len(skills) > 3:
            complexity_multiplier += 0.2
            self.thoughts.processing(f"High skill count ({len(skills)}) increases time requirement")
        
        # Complex topics need more time
        if any(word in topic.lower() for word in ['analyze', 'synthesize', 'evaluate', 'create']):
            complexity_multiplier += 0.3
            self.thoughts.processing("High-order thinking skills detected, increasing time allocation")
        
        # Calculate final time, ensuring it fits grade band limits
        calculated_time = int(base_time * complexity_multiplier)
        final_time = min(calculated_time, constraints['max_time'])
        
        self.thoughts.deciding(
            f"Time allocation: {final_time} minutes (base: {base_time}, multiplier: {complexity_multiplier:.1f})"
        )
        
        return final_time
    
    def _build_safety_guards(self, seed: Seed, subject: str) -> Dict[str, any]:
        """Build safety and content guards"""
        
        self.thoughts.processing("Building content safety guards...")
        
        guards = {
            'subject_area': subject,
            'vocabulary_level': self.grade_constraints[seed.grade_band]['vocab_level'],
            'complexity_level': self.grade_constraints[seed.grade_band]['complexity'],
            'content_restrictions': [
                'age_appropriate_only',
                'no_sensitive_topics', 
                'educational_context_required'
            ],
            'safety_flags': []
        }
        
        # Add custom constraints from seed
        if seed.constraints:
            guards.update(seed.constraints)
            self.thoughts.processing(f"Added {len(seed.constraints)} custom constraints from seed")
        
        # Subject-specific guards
        if subject == 'math':
            guards['math_constraints'] = ['real_world_context', 'appropriate_number_ranges']
        elif subject == 'science':
            guards['science_constraints'] = ['safe_experiments_only', 'age_appropriate_concepts']
        
        self.thoughts.validating(f"Safety guards configured", {"guards_count": len(guards)})
        
        return guards
    
    def _construct_spec(self, subject: str, grade_band: str, skills: List[str], 
                       time_minutes: int, guards: Dict) -> Spec:
        """Construct the final spec object"""
        
        self.thoughts.processing("Assembling final specification...")
        
        spec = Spec(
            subject=subject,
            grade_band=grade_band,
            skills=skills,
            time_minutes=time_minutes,
            guards=guards,
            schema_version="0.1"
        )
        
        # Final validation
        self._validate_spec(spec)
        
        self.thoughts.validating("Spec validation complete", {
            "subject": spec.subject,
            "grade_band": spec.grade_band,
            "skills_count": len(spec.skills),
            "time_minutes": spec.time_minutes,
            "schema_version": spec.schema_version
        })
        
        return spec
    
    def _validate_spec(self, spec: Spec) -> None:
        """Validate the constructed spec"""
        
        self.thoughts.validating("Running spec validation checks...")
        
        # Required field validation
        required_fields = ['subject', 'grade_band', 'skills', 'time_minutes', 'guards']
        for field in required_fields:
            if not hasattr(spec, field) or getattr(spec, field) is None:
                raise ValueError(f"Spec missing required field: {field}")
        
        # Business logic validation
        if spec.time_minutes <= 0:
            raise ValueError("Time allocation must be positive")
        
        if len(spec.skills) == 0:
            raise ValueError("Spec must include at least one skill")
        
        if spec.subject not in self.subject_patterns.keys():
            self.thoughts.warning(f"Unusual subject detected: {spec.subject}")
        
        self.thoughts.validating("All validation checks passed")