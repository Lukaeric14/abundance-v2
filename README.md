# Abundance Projects v0.1

A Next.js application with TypeScript, Tailwind CSS, and server-only Supabase authentication for AI-assisted project generation.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase Auth** with server-only implementation (no client keys exposed)
- **Server Components** and **Server Actions**
- **Route Protection** via middleware
- **Responsive Design** with modern UI components

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

## Next Steps

The core project generation system is implemented. Key areas to expand:

- Enhanced AI project generation pipeline
- Real-time collaboration features
- Advanced teacher/student project views
- Project analytics and reporting
- Custom project templates and configurations

## Database Migrations

The database uses core tables (projects, chats, chat_messages) for efficient data storage. To apply migrations:

```bash
# apply to local
supabase db reset   # or: supabase db push

# generate types (optional)
supabase gen types typescript --local > src/types/supabase.ts
```

Note: Project data is stored in the project's `spec_json` field for flexible content management.