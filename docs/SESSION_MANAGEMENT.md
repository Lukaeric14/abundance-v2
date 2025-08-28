# Session Management System

This document describes the NPC1 session management system implementation.

## Overview

The session management system allows students to start, track, and progress through NPC roleplay projects with the following key features:

- **URL Generation**: Each session gets a unique shareable URL (e.g., `/project/water-duct/session/abc123`)
- **Session State**: Tracks current phase, time elapsed, and conversation history
- **Phase Progression**: Students move through Research → Discovery → Planning → Implementation → Reflection
- **Timer System**: Each phase has configurable time limits with visual progress indicators
- **Persistence**: Students can leave and return to active sessions
- **Auto-Expiration**: Sessions automatically expire after 48 hours

## Database Schema

### Sessions Table
```sql
sessions (
  id: uuid (primary key)
  project_id: uuid (foreign key to projects)
  session_code: text (unique 6-character code)
  current_phase: text (research|discovery|planning|implementation|reflection)
  phase_start_time: timestamptz
  total_elapsed_seconds: int
  conversation_history: jsonb
  phase_time_limits: jsonb
  status: text (active|paused|completed|expired)
  completion_data: jsonb
  created_at: timestamptz
  updated_at: timestamptz
  last_accessed_at: timestamptz
  expires_at: timestamptz (defaults to +48 hours)
)
```

### Session Participants Table
```sql
session_participants (
  id: uuid (primary key)
  session_id: uuid (foreign key to sessions)
  participant_id: uuid (foreign key to participants)
  joined_at: timestamptz
  last_active_at: timestamptz
)
```

### Session Phase History Table
```sql
session_phase_history (
  id: uuid (primary key)
  session_id: uuid (foreign key to sessions)
  phase_name: text
  started_at: timestamptz
  ended_at: timestamptz
  duration_seconds: int
  completed: boolean
)
```

## API Endpoints

### `/api/sessions` (POST)

#### Create Session
```json
{
  "action": "create",
  "project_id": "uuid",
  "participant_ids": ["uuid1", "uuid2"]
}
```

#### Get Session
```json
{
  "action": "get",
  "session_code": "abc123"
}
```

#### Get Sessions by Project
```json
{
  "action": "get_by_project",
  "project_id": "uuid"
}
```

#### Update Session
```json
{
  "action": "update",
  "session_id": "uuid",
  "updates": { "status": "paused" }
}
```

#### Progress Phase
```json
{
  "action": "progress_phase",
  "session_id": "uuid",
  "new_phase": "discovery" // optional, auto-progresses if not provided
}
```

#### Add Conversation
```json
{
  "action": "add_conversation",
  "session_id": "uuid",
  "message": {
    "role": "user",
    "content": "Hello!",
    "participant_id": "uuid"
  }
}
```

### `/api/cleanup` (POST)

Cleans up expired sessions. Requires authentication via `Authorization: Bearer <token>` header.

## Session Flow

### 1. Start Session
- Teacher clicks "Start New Session" in project view
- System generates unique 6-character session code
- Creates session record with initial "research" phase
- Returns shareable URL: `/project/{id}/session/{code}`

### 2. Active Session
- Students access session via URL
- System tracks current phase and elapsed time
- Students can chat/interact within the session
- Phase progression happens manually or automatically when time expires

### 3. Pause/Resume
- Sessions can be paused to stop timer
- Students can leave and return (session persists)
- `last_accessed_at` tracks when session was last used

### 4. Complete
- Session completes when all phases are finished
- Status changes to "completed"
- Session data preserved for review

### 5. Expiration
- Sessions automatically expire after 48 hours
- Cleanup job removes expired sessions
- Expired sessions redirect to project page

## Components

### SessionManager
- Integrated into TeacherView
- Shows active and completed sessions
- Provides "Start New Session" button
- Displays session URLs for sharing

### SessionView
- Main session interface for students
- Shows phase progress with timer
- Chat interface for conversations
- Pause/resume controls

## Phase System

### Default Phases
1. **Research** (15 minutes) - Gather information and understand the problem
2. **Discovery** (20 minutes) - Explore solutions and identify key insights  
3. **Planning** (30 minutes) - Create a detailed plan of action
4. **Implementation** (40 minutes) - Execute your plan and build solutions
5. **Reflection** (10 minutes) - Review outcomes and lessons learned

### Phase Configuration
Time limits are configurable per session via the `phase_time_limits` JSON field:

```json
{
  "research": 900,
  "discovery": 1200,
  "planning": 1800,
  "implementation": 2400,
  "reflection": 600
}
```

## Cleanup and Maintenance

### Automatic Cleanup
- Sessions expire after 48 hours
- Cleanup API endpoint: `POST /api/cleanup`
- Script provided: `scripts/cleanup-sessions.js`

### Recommended Cron Job
```bash
# Run cleanup every 6 hours
0 */6 * * * cd /path/to/app && node scripts/cleanup-sessions.js
```

## Environment Variables

```bash
CLEANUP_TOKEN=your-secure-token-here
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Future Enhancements

- [ ] Real-time updates using WebSockets
- [ ] Session analytics and reporting
- [ ] Custom phase configurations per project
- [ ] Student progress tracking across multiple sessions
- [ ] Session templates and presets