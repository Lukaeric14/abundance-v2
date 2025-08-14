# Node 1: Spec Builder Documentation

## Overview

The **Spec Builder** is the first node in the multi-agent project generation pipeline. It transforms a simple `Seed` (topic + grade band) into a comprehensive `Spec` that guides all downstream processing nodes.

## Purpose

- Convert user input into a structured, validated specification
- Establish constraints and safety guards for the entire pipeline
- Provide subject classification and skill targeting
- Set appropriate time allocations based on complexity and grade level

## Input/Output Contract

### Input: `Seed`
```python
@dataclass
class Seed:
    topic: str           # e.g., "fractions", "water quality experiment"
    grade_band: str      # "K-2", "3-5", "6-8", or "9-12"
    constraints: Dict    # Optional custom constraints
```

### Output: `Spec`
```python
@dataclass 
class Spec:
    subject: str         # "math", "science", "ela", "social_studies"
    grade_band: str      # Validated grade band
    skills: List[str]    # Target skills extracted from topic
    time_minutes: int    # Appropriate duration for activity
    guards: Dict         # Safety and content constraints
    schema_version: str  # "0.1"
```

## Orchestrator Thought Process

The Spec Builder demonstrates sophisticated reasoning through its thought stream. Here are examples of the orchestrator's internal monologue:

### Subject Detection Example
```
🔍 SpecBuilder: Analyzing topic to determine subject area...
⚙️ SpecBuilder: Subject 'math' scored 2 points
⚙️ SpecBuilder: Subject 'science' scored 1 points
🤔 SpecBuilder: Determined subject: 'math' with confidence score 2
```

### Time Allocation Reasoning
```
🤔 SpecBuilder: Calculating time allocation for 6-8 complexity...
⚙️ SpecBuilder: High skill count (4) increases time requirement
⚙️ SpecBuilder: High-order thinking skills detected, increasing time allocation
🤔 SpecBuilder: Time allocation: 60 minutes (base: 45, multiplier: 1.3)
```

### Safety Guard Construction
```
⚙️ SpecBuilder: Building content safety guards...
⚙️ SpecBuilder: Added 2 custom constraints from seed
✅ SpecBuilder: Safety guards configured
```

## Core Processing Logic

### 1. Subject Classification
Uses keyword matching against predefined patterns:
- **Math**: fraction, algebra, calculate, equation, number
- **Science**: experiment, hypothesis, biology, chemistry, physics
- **ELA**: writing, reading, literature, essay, grammar
- **Social Studies**: history, geography, government, culture

### 2. Skill Extraction
Subject-specific skill identification:
- **Math**: fraction_operations, arithmetic_operations, algebraic_thinking
- **Science**: scientific_method, experimental_design, data_collection
- **ELA**: written_communication, reading_comprehension, persuasive_writing
- **Social Studies**: historical_analysis, geographic_reasoning, civic_understanding

### 3. Time Calculation
Grade-based constraints with complexity adjustments:
- **K-2**: Max 30 minutes, basic vocabulary
- **3-5**: Max 45 minutes, elementary vocabulary  
- **6-8**: Max 60 minutes, intermediate vocabulary
- **9-12**: Max 90 minutes, advanced vocabulary

Multipliers applied for:
- High skill count (+20%)
- Complex thinking verbs (+30%)

### 4. Safety Guards
Automatic generation of:
- Age-appropriate content restrictions
- Vocabulary level constraints
- Subject-specific safety rules
- Custom constraint integration

## Validation Rules

The Spec Builder performs comprehensive validation:

1. **Required Fields**: All spec fields must be present and non-null
2. **Time Allocation**: Must be positive and within grade band limits
3. **Skills**: At least one skill must be identified
4. **Subject**: Must be recognized (warns for unusual subjects)
5. **Grade Band**: Must match supported values

## Error Handling

Graceful degradation with thought logging:
- Unknown subjects default to 'math'
- Missing skills default to foundational skills
- Invalid inputs raise clear validation errors
- All failures logged with reasoning

## Usage Examples

### Basic Usage
```python
from data_structures import Seed
from spec_builder_node import SpecBuilderNode

# Create node and seed
spec_builder = SpecBuilderNode()
seed = Seed(topic="fractions", grade_band="6-8")

# Process with full thought stream
result = spec_builder.process(seed)

if result.state == NodeState.COMPLETED:
    spec = result.output
    print(f"Generated spec for {spec.subject} with {len(spec.skills)} skills")
```

### Custom Constraints
```python
seed = Seed(
    topic="algebra word problems",
    grade_band="6-8", 
    constraints={
        "no_money_examples": True,
        "visual_aids_required": True
    }
)
```

## Performance Characteristics

- **Average Processing Time**: ~50-100ms
- **Memory Usage**: Minimal (stateless processing)
- **Deterministic**: Same seed produces same spec
- **Scalable**: No external dependencies or API calls

## Integration Points

### Upstream Dependencies
- None (first node in pipeline)

### Downstream Consumers
- **Standards Mapper**: Uses spec.subject and spec.skills
- **Objective Composer**: Uses spec.guards and spec.grade_band
- **All Other Nodes**: Reference spec.time_minutes for planning

## Monitoring and Observability

### Thought Stream Categories
- **🔍 Analyzing**: Input examination and parsing
- **🤔 Deciding**: Decision points and reasoning
- **⚙️ Processing**: Active computation steps
- **✅ Validating**: Validation checks and results
- **🎉 Success**: Completion confirmations
- **⚠️ Warning**: Non-fatal issues
- **❌ Error**: Fatal failures

### Key Metrics
- Processing duration
- Thought count per execution
- Success/failure rates
- Subject classification accuracy
- Time allocation appropriateness

## Testing Strategy

### Unit Tests
- Subject detection accuracy
- Skill extraction completeness
- Time calculation correctness
- Validation rule enforcement

### Integration Tests
- End-to-end seed processing
- Error handling scenarios
- Performance benchmarks
- Thought stream completeness

### Test Harness
Run `python test_spec_builder.py` to:
- Process multiple test seeds
- Observe thought streams in real-time
- Validate output quality
- Measure performance

## Common Issues and Debugging

### Issue: Incorrect Subject Classification
**Symptoms**: Wrong subject assigned to topic
**Debug**: Check thought stream for keyword scoring
**Solution**: Add topic-specific keywords to patterns

### Issue: Unrealistic Time Allocation
**Symptoms**: Too much/little time for grade level
**Debug**: Review time calculation thoughts
**Solution**: Adjust base times or multipliers

### Issue: Missing Skills
**Symptoms**: Empty or generic skills list
**Debug**: Examine skill extraction logic
**Solution**: Enhance subject-specific skill patterns

## Future Enhancements

1. **Machine Learning Classification**: Replace keyword matching with trained models
2. **Dynamic Time Learning**: Adjust allocations based on usage data
3. **Curriculum Standards Integration**: Direct mapping to educational standards
4. **Multi-language Support**: Extend beyond English topics
5. **Adaptive Complexity**: Learn optimal difficulty per grade band

---

*This documentation reflects Node 1 implementation as of schema version 0.1*