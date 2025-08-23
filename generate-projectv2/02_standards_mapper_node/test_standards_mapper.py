"""
Test Harness for Node 2: Standards Mapper
Runs with fallback path by default (no API key).
"""

import sys
import os

# Add shared infrastructure and node to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared_infrastructure'))
sys.path.append(os.path.dirname(__file__))

from data_structures import Seed, Spec, StandardTarget
from standards_mapper_node import StandardsMapperNode


def print_separator(title: str):
    print("\n" + "=" * 60)
    print(f" {title} ".center(60))
    print("=" * 60 + "\n")


def run_basic_tests():
    print_separator("🚀 STANDARDS MAPPER NODE TEST HARNESS")

    node = StandardsMapperNode()

    seed = Seed(topic="fractions and area problems", grade_band="6-8")
    spec = Spec(
        subject="math",
        grade_band="6-8",
        skills=["problem_solving", "collaboration"],
        time_minutes=45,
        guards={"safe_content": True},
        schema_version="0.1",
    )

    result = node.process((seed, spec))

    print("\n📋 RESULT SUMMARY:")
    assert result.state.value == "completed", f"Node failed: {result.error}"
    standards = result.output
    assert isinstance(standards, list) and len(standards) >= 1
    for st in standards:
        assert isinstance(st, StandardTarget)
        assert st.code and st.description and st.evidence_note
    print(f"  ✅ {len(standards)} standard(s) returned")
    print(f"  Codes: {[s.code for s in standards]}")


if __name__ == "__main__":
    run_basic_tests()


