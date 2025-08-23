"""
Base Node Class for Multi-Agent Architecture
Provides common functionality and thought logging for all nodes
"""

import time
from abc import ABC, abstractmethod
from typing import Any, Dict
from thought_logger import ThoughtLogger
import env_loader  # noqa: F401  Ensure env is loaded globally for all nodes
from data_structures import NodeResult, NodeState

class BaseNode(ABC):
    """Abstract base class for all processing nodes"""
    
    def __init__(self, node_name: str, config: Dict[str, Any] = None):
        self.node_name = node_name
        self.config = config or {}
        self.thoughts = ThoughtLogger(node_name)
        
    @abstractmethod
    def _process_logic(self, input_data: Any) -> Any:
        """
        Core processing logic - must be implemented by each node
        This is where the actual work happens
        """
        pass
    
    def process(self, input_data: Any) -> NodeResult:
        """
        Main processing method with orchestrator thought logging
        Wraps the core logic with timing, error handling, and thoughts
        """
        start_time = time.time()
        
        try:
            self.thoughts.info(f"Node {self.node_name} starting execution")
            self.thoughts.analyzing(f"Input received", {"input_type": type(input_data).__name__})
            
            # Execute the core logic
            result = self._process_logic(input_data)
            
            duration_ms = (time.time() - start_time) * 1000
            
            self.thoughts.success(f"Node {self.node_name} completed successfully")
            self.thoughts.info(f"Execution time: {duration_ms:.2f}ms")
            
            return NodeResult(
                node_name=self.node_name,
                state=NodeState.COMPLETED,
                output=result,
                thoughts_summary=self.thoughts.get_thoughts_summary(),
                duration_ms=duration_ms
            )
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            
            self.thoughts.error(f"Node {self.node_name} failed: {str(e)}")
            
            return NodeResult(
                node_name=self.node_name,
                state=NodeState.FAILED,
                output=None,
                thoughts_summary=self.thoughts.get_thoughts_summary(),
                duration_ms=duration_ms,
                error=str(e)
            )
    
    def validate_input(self, input_data: Any, expected_type: type) -> bool:
        """Helper method for input validation with thought logging"""
        if not isinstance(input_data, expected_type):
            self.thoughts.error(
                f"Invalid input type. Expected {expected_type.__name__}, got {type(input_data).__name__}"
            )
            return False
        
        self.thoughts.validating(f"Input validation passed for type {expected_type.__name__}")
        return True