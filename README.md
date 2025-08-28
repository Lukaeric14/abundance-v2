# Abundance Projects v0.1

A Next.js application with TypeScript, Tailwind CSS, and server-only Supabase authentication for building AI chat interfaces.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase Auth** with server-only implementation (no client keys exposed)
- **Server Components** and **Server Actions**
- **Route Protection** via middleware
- **Responsive Design** with modern UI components
- **Session Management** for NPC roleplay projects
  - Unique session URLs for student access
  - Phase-based progression system (Research → Discovery → Planning → Implementation → Reflection)
  - Real-time timers with phase limits
  - Session persistence (students can leave and return)
  - Automatic expiration after 48 hours
  - Conversation history tracking

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   **Important**: These are server-only environment variables. No `NEXT_PUBLIC_*` keys are used to ensure security.

3. **Supabase Setup**
   
   - Create a new Supabase project
   - Copy the project URL and anon key to your `.env.local`
   - Enable email authentication in your Supabase dashboard
   - Optionally configure email templates for sign up confirmation

4. **Development Server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Flow

- **Unauthenticated users**: Redirected to `/login`
- **Login page**: Server actions for email/password login and registration
- **Authenticated users**: Access the chat builder at `/` (root)
- **Sign out**: Clears session cookies and redirects to `/login`

## Project Structure

```
/app/
├── layout.tsx          # Root layout with global styles
├── page.tsx            # Protected chat builder (root route)
├── login/page.tsx      # Authentication page
├── error.tsx           # Global error boundary
├── not-found.tsx       # 404 page
└── globals.css         # Tailwind CSS imports

/components/
├── layout/AppShell.tsx # Main app shell with navigation
└── ui/                 # Reusable UI components
    ├── Button.tsx
    ├── Input.tsx
    ├── Card.tsx
    └── Spinner.tsx

/lib/
├── supabase/server.ts  # Supabase server client
├── auth.ts             # Auth helper functions
└── utils.ts            # Utility functions

middleware.ts           # Route protection middleware
```

## Security

- All Supabase operations happen server-side
- No client-side authentication keys exposed
- Middleware handles route protection
- Server actions used for form submissions

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Session Management

The NPC roleplay session management system enables teachers to create and manage student sessions:

### Quick Start
1. Navigate to any project page
2. Find the "Session Management" section
3. Click "Start New Session" to create a session
4. Share the generated URL with students
5. Monitor progress through the session interface

### Session Features
- **Unique URLs**: Each session gets a 6-character code (e.g., `/project/water-duct/session/abc123`)
- **Phase System**: Students progress through 5 phases with configurable time limits
- **Real-time Tracking**: Live timers and progress indicators
- **Persistence**: Students can leave and return to active sessions
- **Auto-cleanup**: Sessions expire after 48 hours

### API Endpoints
- `POST /api/sessions` - Create, get, update sessions
- `POST /api/cleanup` - Clean up expired sessions

See [docs/SESSION_MANAGEMENT.md](docs/SESSION_MANAGEMENT.md) for detailed documentation.

## Next Steps

The session management system is implemented. Key areas to expand:

- Real-time WebSocket updates for live collaboration
- Session analytics and reporting dashboard
- Custom phase configurations per project type
- AI-powered NPC interactions within sessions
- Student progress tracking across multiple sessions

## Supabase participants/sections migrations

Commands to apply migrations and optionally seed:

```bash
# create migrations (already added by PR)
supabase migration new add_participants_sections
supabase migration new add_sections_rpcs

# apply to local
supabase db reset   # or: supabase db push

# generate types (optional)
supabase gen types typescript --local > src/types/supabase.ts

# optional: seed
# edit supabase/seed.sql and set :project_id
supabase db reset --seed
```