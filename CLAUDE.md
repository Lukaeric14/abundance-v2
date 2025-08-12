# Claude Code Workflows

This file contains common workflows and shortcuts for working with Claude Code on the Abundance Projects.

## Git Shortcuts

### Quick Commit & Push
```
git add . && git commit -m "Quick update" && git push
```

### Save Progress with Timestamp
```
git add . && git commit -m "Save progress: $(date '+%Y-%m-%d %H:%M')" && git push
```

### Sync with Remote
```
git pull && git add . && git commit -m "Sync: $(date '+%Y-%m-%d %H:%M')" && git push
```

## NPM Workflow Shortcuts

These are available in your package.json:

### Development
- `npm run save` - Add, commit with timestamp, and push
- `npm run quick` - Quick add, commit "Quick update", and push  
- `npm run sync` - Pull, add, commit, and push
- `npm run deploy` - Build, then save and push
- `npm run restart` - Kill port 3000 and restart server

### Examples
```bash
npm run save      # Auto timestamp commit
npm run quick     # Quick update commit
npm run deploy    # Build and deploy
npm run restart   # Restart dev server
```

## Development Workflows

### After Making Changes
1. Test changes locally
2. Run `npm run save` or `npm run quick` 
3. Changes automatically committed and pushed

### When Styling Issues
1. Check if server needs restart: `npm run restart`
2. Clear browser cache if needed
3. Verify CSS imports in `app/globals.css`

### Font/CSS Problems
- Inter font loads via direct Google Fonts import
- Typography utilities: `.text-sb-16`, `.text-r-14`, etc.
- Design tokens: `text-foreground`, `bg-background`, `text-primary`

## Common Commands

### Server Management
```bash
# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9

# Start production server
npm start

# Start development server  
npm run dev
```

### Build Process
```bash
# Build for production
npm run build

# Build and commit
npm run deploy
```

## Project Structure

- `app/` - Next.js App Router pages
- `components/ui/` - Reusable UI components
- `lib/` - Utilities and Supabase client
- `styling_guidelines.md` - Design system documentation
- `CLAUDE.md` - This workflow file

## Design System

### Colors
- Primary: Golden (#D7AC00) - `text-primary`, `bg-primary`
- Background: Cream (#FFFEFA) - `bg-background`  
- Text: Dark (#171717) - `text-foreground`
- Borders: Light gray (#F1F1F1) - `border-border`

### Typography
- `.text-sb-16` - Semibold 16px
- `.text-r-16` - Regular 16px
- `.text-sb-14` - Semibold 14px  
- `.text-r-14` - Regular 14px
- `.text-sb-12` - Semibold 12px
- `.text-r-12` - Regular 12px

## Supabase Authentication

- Login: `/login` 
- Register: `/register`
- Protected routes redirect to `/login` if not authenticated
- Middleware handles auth state automatically