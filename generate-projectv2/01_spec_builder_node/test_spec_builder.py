"""
Test Harness for Node 1: Spec Builder
Run this to see the orchestrator's thought process in real-time
"""

import json
import time
import sys
import os

# Add shared infrastructure to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared_infrastructure'))

from data_structures import Seed
from spec_builder_node import SpecBuilderNode

def print_separator(title: str):
    """Print a visual separator for test sections"""
    print("\n" + "="*60)
    print(f" {title} ".center(60))
    print("="*60 + "\n")

def test_spec_builder():
    """Run comprehensive tests of the Spec Builder node"""
    
    print_separator("🚀 SPEC BUILDER NODE TEST HARNESS")
    print("Watch the orchestrator's thoughts as it processes different seeds...\n")
    
    # Initialize the node
    spec_builder = SpecBuilderNode()
    
    # Test cases with different complexity levels
    test_seeds = [
        {
            "name": "Simple Math - Fractions",
            "seed": Seed(topic="fractions", grade_band="6-8")
        },
        {
            "name": "Complex Science Project", 
            "seed": Seed(topic="design experiment to test water quality", grade_band="9-12")
        },
        {
            "name": "Elementary ELA",
            "seed": Seed(topic="persuasive writing about school lunch", grade_band="3-5")
        },
        {
            "name": "Custom Constraints",
            "seed": Seed(
                topic="algebra word problems", 
                grade_band="6-8",
                constraints={"no_money_examples": True, "visual_aids_required": True}
            )
        },
        {
            "name": "Edge Case - Unusual Topic",
            "seed": Seed(topic="quantum physics for kindergarten", grade_band="K-2")
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_seeds, 1):
        print_separator(f"TEST {i}: {test_case['name']}")
        
        print(f"Input Seed:")
        print(f"  Topic: '{test_case['seed'].topic}'")
        print(f"  Grade Band: {test_case['seed'].grade_band}")
        print(f"  Constraints: {test_case['seed'].constraints}")
        print("\n🧠 ORCHESTRATOR THOUGHTS:\n")
        
        # Process the seed and capture the result
        start_time = time.time()
        result = spec_builder.process(test_case['seed'])
        end_time = time.time()
        
        results.append({
            "test_name": test_case['name'],
            "result": result,
            "execution_time": end_time - start_time
        })
        
        print(f"\n📋 RESULT SUMMARY:")
        if result.state.value == "completed":
            spec = result.output
            print(f"  ✅ Status: {result.state.value.upper()}")
            print(f"  📚 Subject: {spec.subject}")
            print(f"  🎯 Skills: {', '.join(spec.skills)}")
            print(f"  ⏱️  Time: {spec.time_minutes} minutes")
            print(f"  🛡️  Guards: {len(spec.guards)} safety rules")
            print(f"  ⚡ Processing Time: {result.duration_ms:.1f}ms")
        else:
            print(f"  ❌ Status: {result.state.value.upper()}")
            print(f"  🚨 Error: {result.error}")
        
        print(f"\n💭 Thought Summary: {result.thoughts_summary['total_thoughts']} thoughts logged")
        
        # Pause between tests for readability
        if i < len(test_seeds):
            print("\nPress Enter to continue to next test...")
            input()
    
    # Final summary
    print_separator("📊 TEST SUMMARY")
    
    successful_tests = sum(1 for r in results if r['result'].state.value == 'completed')
    total_tests = len(results)
    
    print(f"Tests Run: {total_tests}")
    print(f"Successful: {successful_tests}")
    print(f"Failed: {total_tests - successful_tests}")
    print(f"Success Rate: {(successful_tests/total_tests)*100:.1f}%")
    
    print(f"\n⚡ Performance Summary:")
    avg_time = sum(r['execution_time'] for r in results) / len(results)
    print(f"  Average Processing Time: {avg_time*1000:.1f}ms")
    
    fastest = min(results, key=lambda x: x['execution_time'])
    slowest = max(results, key=lambda x: x['execution_time'])
    print(f"  Fastest: {fastest['test_name']} ({fastest['execution_time']*1000:.1f}ms)")
    print(f"  Slowest: {slowest['test_name']} ({slowest['execution_time']*1000:.1f}ms)")

def test_individual_seed():
    """Test a single custom seed - useful for debugging"""
    
    print_separator("🔍 INDIVIDUAL SEED TEST")
    
    # Get custom input
    topic = input("Enter a topic: ").strip()
    grade_band = input("Enter grade band (K-2, 3-5, 6-8, 9-12): ").strip()
    
    if not topic or not grade_band:
        print("❌ Invalid input. Using default seed.")
        seed = Seed(topic="fractions", grade_band="6-8")
    else:
        seed = Seed(topic=topic, grade_band=grade_band)
    
    print(f"\n🧠 Processing your seed: '{seed.topic}' for {seed.grade_band}")
    print("="*50)
    
    spec_builder = SpecBuilderNode()
    result = spec_builder.process(seed)
    
    print(f"\n📋 Final Result:")
    if result.state.value == "completed":
        spec = result.output
        print(json.dumps({
            "subject": spec.subject,
            "grade_band": spec.grade_band,
            "skills": spec.skills,
            "time_minutes": spec.time_minutes,
            "guards": spec.guards,
            "schema_version": spec.schema_version
        }, indent=2))
    else:
        print(f"❌ Processing failed: {result.error}")

if __name__ == "__main__":
    print("🤖 Spec Builder Node Test Harness")
    print("Choose test mode:")
    print("1. Run all test cases")
    print("2. Test individual seed")
    
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == "2":
        test_individual_seed()
    else:
        test_spec_builder()
    
    print("\n🎉 Testing complete! Check the thought logs above to see how the orchestrator reasoned through each decision.")