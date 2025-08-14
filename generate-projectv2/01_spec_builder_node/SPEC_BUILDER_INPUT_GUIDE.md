# Spec Builder Input Guide

## Overview

The Spec Builder takes your basic project inputs and structures them for the project generation pipeline. It's designed to preserve your inputs while adding minimal educational framework.

## Required Inputs

### Basic Project Data
- **`topic`** - Your project subject (e.g., "fractions", "water quality testing")
- **`life_skill`** - Target life skill (e.g., "negotiation", "problem solving", "collaboration")
- **`duration_min`** - Activity duration in minutes (20-90)
- **`group_size`** - Number of students (2-4)

### Example Frontend Payload
```json
{
  "project_id": "proj_123",
  "chat_id": "chat_456", 
  "topic": "fractions",
  "life_skill": "negotiation",
  "group_size": 3,
  "duration_min": 45,
  "owner_email": "teacher@school.edu"
}
```

## What the Spec Builder Does

The Spec Builder performs minimal processing:

1. **Preserves your inputs** - Your duration, topic, and life skills remain unchanged
2. **Adds structure** - Converts inputs into a standardized `Spec` format
3. **Sets defaults** - Adds basic educational framework (subject area, skills, safety guards)
4. **Validates format** - Ensures data structure is ready for downstream processing

## Output Structure

The Spec Builder produces a `Spec` with:

- **`subject`** - Always "math" (simple default)
- **`grade_band`** - Always "6-8" (default target audience) 
- **`skills`** - Basic skills: ["problem_solving", "collaboration"]
- **`time_minutes`** - Your exact `duration_min` input
- **`guards`** - Simple safety settings
- **`schema_version`** - "0.1"

## Tips for Rich Inputs

### Topic Naming
- **Good**: "fractions in cooking recipes"
- **Better**: "calculating ingredient ratios for different serving sizes"

### Life Skills
- Be specific: "negotiation" vs "communication"
- Consider the activity: "data analysis" for science projects

### Duration Planning
- Include setup/cleanup time
- Consider group discussion needs
- Account for age-appropriate attention spans

## Testing Your Inputs

Use this curl command to test:

```bash
curl -X POST http://localhost:5001/start \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test_123",
    "chat_id": "test_456",
    "topic": "YOUR_TOPIC_HERE",
    "life_skill": "YOUR_SKILL_HERE", 
    "group_size": 3,
    "duration_min": 45,
    "owner_email": "test@example.com"
  }'
```

## Next Steps

The structured `Spec` output feeds into downstream nodes:
- Standards Mapper (maps to curriculum standards)
- Objective Composer (creates learning objectives)
- Step Planner (breaks down activities)
- And more...

The Spec Builder's job is simply to take your creative inputs and format them for the educational pipeline.