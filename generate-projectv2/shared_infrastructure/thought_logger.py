"""
Orchestrator Thought Stream Logger
Provides real-time console output of AI reasoning for transparency and debugging
"""

import time
from datetime import datetime
from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any
import json

class ThoughtType(Enum):
    ANALYZING = "🔍"
    PLANNING = "📋" 
    DECIDING = "🤔"
    PROCESSING = "⚙️"
    VALIDATING = "✅"
    WARNING = "⚠️"
    ERROR = "❌"
    SUCCESS = "🎉"
    INFO = "ℹ️"

@dataclass
class Thought:
    timestamp: datetime
    node_name: str
    thought_type: ThoughtType
    message: str
    data: Optional[Dict[str, Any]] = None
    duration_ms: Optional[float] = None

class ThoughtLogger:
    def __init__(self, node_name: str, verbose: bool = True):
        self.node_name = node_name
        self.verbose = verbose
        self.start_time = time.time()
        self.thoughts = []
        
        # Color codes for console output
        self.colors = {
            'BLUE': '\033[94m',
            'GREEN': '\033[92m', 
            'YELLOW': '\033[93m',
            'RED': '\033[91m',
            'PURPLE': '\033[95m',
            'CYAN': '\033[96m',
            'WHITE': '\033[97m',
            'BOLD': '\033[1m',
            'END': '\033[0m'
        }
    
    def _log_thought(self, thought_type: ThoughtType, message: str, data: Optional[Dict] = None):
        """Core thought logging method"""
        thought = Thought(
            timestamp=datetime.now(),
            node_name=self.node_name,
            thought_type=thought_type,
            message=message,
            data=data,
            duration_ms=(time.time() - self.start_time) * 1000
        )
        
        self.thoughts.append(thought)
        
        if self.verbose:
            self._console_output(thought)
    
    def _console_output(self, thought: Thought):
        """Format and output thought to console"""
        timestamp = thought.timestamp.strftime("%H:%M:%S.%f")[:-3]
        
        # Color mapping for different thought types
        color_map = {
            ThoughtType.ANALYZING: self.colors['CYAN'],
            ThoughtType.PLANNING: self.colors['BLUE'],
            ThoughtType.DECIDING: self.colors['YELLOW'],
            ThoughtType.PROCESSING: self.colors['PURPLE'],
            ThoughtType.VALIDATING: self.colors['GREEN'],
            ThoughtType.WARNING: self.colors['YELLOW'],
            ThoughtType.ERROR: self.colors['RED'],
            ThoughtType.SUCCESS: self.colors['GREEN'],
            ThoughtType.INFO: self.colors['WHITE']
        }
        
        color = color_map.get(thought.thought_type, self.colors['WHITE'])
        
        # Format the console output
        output = (
            f"{color}{self.colors['BOLD']}"
            f"[{timestamp}] {thought.thought_type.value} "
            f"{self.node_name}: {thought.message}"
            f"{self.colors['END']}"
        )
        
        print(output)
        
        # If there's structured data, print it indented
        if thought.data:
            data_str = json.dumps(thought.data, indent=2)
            indented_data = '\n'.join(f"    {line}" for line in data_str.split('\n'))
            print(f"{self.colors['WHITE']}{indented_data}{self.colors['END']}")
    
    # Convenience methods for different thought types
    def analyzing(self, message: str, data: Optional[Dict] = None):
        self._log_thought(ThoughtType.ANALYZING, message, data)
    
    def planning(self, message: str, data: Optional[Dict] = None):
        self._log_thought(ThoughtType.PLANNING, message, data)
    
    def deciding(self, message: str, data: Optional[Dict] = None):
        self._log_thought(ThoughtType.DECIDING, message, data)
    
    def processing(self, message: str, data: Optional[Dict] = None):
        self._log_thought(ThoughtType.PROCESSING, message, data)
    
    def validating(self, message: str, data: Optional[Dict] = None):
        self._log_thought(ThoughtType.VALIDATING, message, data)
    
    def warning(self, message: str, data: Optional[Dict] = None):
        self._log_thought(ThoughtType.WARNING, message, data)
    
    def error(self, message: str, data: Optional[Dict] = None):
        self._log_thought(ThoughtType.ERROR, message, data)
    
    def success(self, message: str, data: Optional[Dict] = None):
        self._log_thought(ThoughtType.SUCCESS, message, data)
    
    def info(self, message: str, data: Optional[Dict] = None):
        self._log_thought(ThoughtType.INFO, message, data)
    
    def get_thoughts_summary(self) -> Dict:
        """Return structured summary of all thoughts for debugging"""
        return {
            'node_name': self.node_name,
            'total_thoughts': len(self.thoughts),
            'duration_ms': (time.time() - self.start_time) * 1000,
            'thoughts': [
                {
                    'timestamp': t.timestamp.isoformat(),
                    'type': t.thought_type.name,
                    'message': t.message,
                    'data': t.data
                }
                for t in self.thoughts
            ]
        }