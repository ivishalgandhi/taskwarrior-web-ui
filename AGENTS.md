# AI Agent Guide for Taskwarrior Web UI

This document provides comprehensive guidance for AI agents working with this codebase. It covers architecture, patterns, common tasks, and critical implementation details.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Authentication Architecture](#authentication-architecture)
5. [Key Files Reference](#key-files-reference)
6. [Common Tasks](#common-tasks)
7. [Deployment Targets](#deployment-targets)
8. [Code Patterns](#code-patterns)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Project Overview

**Taskwarrior Web UI** is a modern web interface for [Taskwarrior](https://taskwarrior.org/), a powerful command-line task management tool. It provides a user-friendly interface for managing tasks, projects, and tags with calendar views and filtering capabilities.

**Key Features:**
- Google OAuth authentication (NextAuth v5)
- Task management with rich filtering and sorting
- Calendar view (day/week/month modes)
- Project hierarchy support
- Tag management
- Command-line interface integration
- Real-time task updates

**Live Instance:** https://taskwarrior.tail48fe8.ts.net (Tailscale Funnel + systemd deployment)

---

## Technology Stack

### Core Framework
- **Next.js 15.0.2** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### Authentication
- **NextAuth v5.0.0-beta.30** - Authentication library
- **Google OAuth 2.0** - Identity provider
- **Triple-layer protection**: Middleware + Server Component + Config validation

### UI Components
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Headless component primitives
- **shadcn/ui** - Pre-built accessible components
- **Tanstack Table v8** - Data table with filtering/sorting
- **Lucide Icons** - Icon library

### Backend Integration
- **Taskwarrior 3.4.2** - Task management backend
- **TaskChampion SQLite** - Taskwarrior data storage

### Deployment
- **Node.js v24.12.0** (via nvm)
- **Systemd** - Process management
- **Tailscale Funnel** - Public HTTPS access
- **Proxmox LXC Container** - Hosting environment

---

## Project Structure

```
taskwarrior-web-ui/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Server component with auth check
│   ├── tasks-client.tsx          # Main tasks page (client component)
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Global styles
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth API routes
│   │   ├── tasks/                # Task management endpoints
│   │   ├── projects/             # Project hierarchy endpoint
│   │   └── metrics/              # Metrics endpoint
│   ├── calendar/                 # Calendar view pages
│   ├── login/                    # Login page
│   └── fonts/                    # Custom fonts
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── calendar-new/             # Calendar view components
│   ├── auth/                     # Auth provider components
│   ├── icons/                    # Custom icon components
│   ├── form/                     # Form components
│   ├── data-table*.tsx           # Table components
│   ├── command-input.tsx         # Taskwarrior command interface
│   ├── nav.tsx                   # Navigation bar
│   └── task-edit-dialog.tsx      # Task editing modal
│
├── lib/                          # Utilities
│   └── utils.ts                  # Helper functions (cn, etc.)
│
├── types/                        # TypeScript types
│   └── task.ts                   # Task type definitions
│
├── docs/                         # Documentation
│   ├── AUTH_FIX_DOCUMENTATION.md # Auth implementation guide
│   ├── DEPLOYMENT-STEPS.md       # Systemd deployment guide
│   ├── DEPLOYMENT-NO-DOCKER.md   # Non-Docker deployment options
│   ├── DEPLOYMENT.md             # Docker deployment guide
│   ├── GOOGLE_OAUTH_SETUP.md     # OAuth setup instructions
│   └── OAUTH_USERS_GUIDE.md      # User guide for OAuth
│
├── docker/                       # Docker deployment files
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── .dockerignore
│
├── auth.ts                       # NextAuth v5 configuration (CRITICAL)
├── middleware.ts                 # Auth middleware (CRITICAL)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── components.json               # shadcn/ui configuration
├── .env.local.example            # Environment variables template
└── package.json                  # Dependencies
```

---

## Authentication Architecture

### Triple-Layer Protection

Authentication is enforced at **three layers** to ensure no bypass is possible:

#### 1. Middleware Layer (First Defense)
**File:** `middleware.ts`

```typescript
export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname.startsWith('/login')

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isOnLoginPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Redirect authenticated users away from login
  if (isLoggedIn && isOnLoginPage) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  return NextResponse.next()
})
```

- **Runs first** on every request before page rendering
- **Scope:** All routes except API, static files, images
- **Behavior:** 307 redirects to `/login` for unauthenticated users

#### 2. Server Component Layer (Second Defense)
**File:** `app/page.tsx`

```typescript
export default async function TasksPage() {
  const session = await auth();
  
  // Server-side auth check - backup layer
  if (!session) {
    redirect("/login");
  }

  return <TasksClient />;
}
```

- **Runs second** - server-side check before rendering
- **Purpose:** Backup protection if middleware is somehow bypassed
- **Behavior:** Server-side redirect to `/login`

#### 3. NextAuth Configuration Layer (Foundation)
**File:** `auth.ts`

```typescript
// Environment validation (fails fast on startup)
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is not set')
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,  // CRITICAL: Explicit in v5
  trustHost: true,                   // CRITICAL: Required for proxies
  providers: [Google({...})],
  callbacks: {
    authorized: async ({ auth }) => !!auth
  }
})
```

- **Initializes** NextAuth with required v5 configuration
- **Validates** environment variables on startup
- **Enables** middleware auth checks via `authorized` callback

### Environment Variables

**Required for authentication:**

```bash
# Generate with: openssl rand -base64 32
AUTH_SECRET=your_secret_here

# From Google Cloud Console
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Base URL for OAuth callbacks
NEXTAUTH_URL=https://your-domain.com
```

**Critical notes:**
- `secret` must be **explicitly set** in NextAuth config (NextAuth v5 requirement)
- `trustHost: true` is **required** for proxy/Tailscale setups
- Environment variables must be available at **build time** (Next.js 15 bakes config)

---

## Key Files Reference

### Authentication Files

#### `auth.ts` - NextAuth Configuration
**Purpose:** Core authentication setup with Google OAuth

**Critical sections:**
- Environment variable validation (startup check)
- `secret` parameter (explicit in NextAuth v5)
- `trustHost: true` (proxy compatibility)
- Google provider configuration
- `authorized` callback (used by middleware)

**DO NOT:**
- Remove environment variable validation
- Remove `secret` parameter
- Remove `trustHost: true`
- Change provider configuration without updating Google Console

#### `middleware.ts` - Request Interceptor
**Purpose:** First-line auth enforcement

**Critical sections:**
- Auth check: `!!req.auth`
- Route matching config (excludes API, static files)
- Redirect logic for authenticated/unauthenticated users

**DO NOT:**
- Change matcher config (might expose unprotected routes)
- Remove redirects (breaks auth flow)
- Make middleware async without understanding implications

#### `app/page.tsx` - Server Component Auth
**Purpose:** Backup auth layer before rendering

**Critical sections:**
- Server-side session check with `await auth()`
- Redirect to `/login` if no session
- Renders client component only when authenticated

**DO NOT:**
- Convert to client component
- Remove session check
- Skip redirect logic

### Task Management Files

#### `app/api/tasks/route.ts` - Tasks API
**Purpose:** Main API endpoint for task operations

**Operations:**
- GET: Fetch tasks (optionally include completed)
- POST: Create new task via command
- Runs Taskwarrior CLI commands via child_process

**Important:**
- Filters out deleted tasks by default
- Uses `taskwarrior.ts` utility for command execution
- Returns JSON parsed from Taskwarrior output

#### `app/api/utils/taskwarrior.ts` - Taskwarrior CLI Interface
**Purpose:** Execute Taskwarrior commands safely

**Critical functions:**
- `executeTaskCommand()` - Runs `task` CLI commands
- Environment setup for Taskwarrior data location
- Error handling and output parsing

#### `app/tasks-client.tsx` - Main Tasks Page
**Purpose:** Client-side task management UI

**Features:**
- Task list with Tanstack Table
- Advanced filtering (status, priority, project, tags)
- Calendar view toggle
- Column configuration with custom cell renderers
- Real-time task updates

**State management:**
- Tasks, projects, filters managed with React hooks
- Fetches data from `/api/tasks` and `/api/projects`
- Handles task actions (complete, delete, edit)

### Component Files

#### `components/data-table.tsx` - Table Component
**Purpose:** Reusable data table with filtering/sorting

**Features:**
- Built on Tanstack Table v8
- Column filtering, sorting, pagination
- Faceted filters for multi-select
- View options for column visibility

#### `components/calendar-new/calendar.tsx` - Calendar View
**Purpose:** Calendar visualization of tasks

**Modes:**
- Day view
- Week view  
- Month view

**Features:**
- Task drag-and-drop
- Due date visualization
- Task clicking for details
- Mode switching

#### `components/command-input.tsx` - CLI Interface
**Purpose:** Direct Taskwarrior command execution

**Usage:**
- Input field for `task` commands
- Executes via `/api/tasks/command` endpoint
- Real-time feedback
- Refresh after execution

---

## Common Tasks

### Development Setup

```bash
# Clone repository
git clone https://github.com/ivishalgandhi/taskwarrior-web-ui.git
cd taskwarrior-web-ui

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your credentials
# - Generate AUTH_SECRET: openssl rand -base64 32
# - Add Google OAuth credentials from console.cloud.google.com

# Install Taskwarrior (if not installed)
# macOS:
brew install taskwarrior

# Linux:
sudo apt install taskwarrior

# Run development server
npm run dev

# Open http://localhost:3000
```

### Build and Production

```bash
# Build for production
npm run build

# Start production server
npm start

# Check for errors
npm run lint
```

### Adding a New Component

```bash
# Add shadcn/ui component
npx shadcn@latest add [component-name]

# Example: Add a new dialog
npx shadcn@latest add dialog
```

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install [package]@latest
```

### Database/Taskwarrior Operations

```bash
# View tasks
task list

# Export task data
task export > tasks.json

# Import task data
task import tasks.json

# Backup Taskwarrior data
cp -r ~/.task ~/.task.backup

# Reset Taskwarrior (DANGEROUS)
rm -rf ~/.task
task version  # Reinitializes
```

---

## Deployment Targets

### 1. Docker Deployment

**Files:** `docker/docker-compose.yml`, `docker/Dockerfile`

```bash
cd docker
docker-compose up -d
```

**Includes:**
- Next.js application
- Taskwarrior pre-installed
- Volume mounts for data persistence

### 2. Systemd Deployment (Current Production)

**Location:** Proxmox LXC container "taskwarrior"  
**Guide:** `docs/DEPLOYMENT-STEPS.md`

**Service file:** `/etc/systemd/system/taskwarrior-web.service`

```ini
[Service]
Environment="AUTH_SECRET=..."
Environment="GOOGLE_CLIENT_ID=..."
Environment="GOOGLE_CLIENT_SECRET=..."
Environment="NEXTAUTH_URL=https://taskwarrior.tail48fe8.ts.net"
ExecStart=/root/.nvm/versions/node/v24.12.0/bin/npm start
```

**Key commands:**
```bash
# Check status
systemctl status taskwarrior-web

# View logs
journalctl -u taskwarrior-web -f

# Restart
systemctl restart taskwarrior-web

# View environment
systemctl show taskwarrior-web --property=Environment
```

### 3. Tailscale Funnel (HTTPS Proxy)

**Purpose:** Public HTTPS access without reverse proxy

**Commands:**
```bash
# Enable funnel (public access)
tailscale funnel --bg 3000

# Check status
tailscale serve status

# Disable funnel
tailscale funnel --https=443 off

# Enable serve only (private to tailnet)
tailscale serve --bg 3000
```

**Configuration:**
- Domain: taskwarrior.tail48fe8.ts.net
- Automatic HTTPS (MagicDNS + Let's Encrypt)
- No Caddy/Nginx needed

---

## Code Patterns

### API Route Pattern

```typescript
// app/api/example/route.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Always check auth in API routes
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Your logic here
    return NextResponse.json({ data: "success" });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Client Component with Server Data

```typescript
// app/example/page.tsx (Server Component)
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ExampleClient from "./example-client";

export default async function ExamplePage() {
  const session = await auth();
  if (!session) redirect("/login");
  
  return <ExampleClient />;
}

// app/example/example-client.tsx (Client Component)
"use client";
import { useState, useEffect } from "react";

export default function ExampleClient() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch("/api/example")
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return <div>{/* Render data */}</div>;
}
```

### Taskwarrior Command Execution

```typescript
import { executeTaskCommand } from "@/app/api/utils/taskwarrior";

// Execute command
const result = await executeTaskCommand(["list", "status:pending"]);

// Result is JSON array of tasks
const tasks = JSON.parse(result);
```

### Table with Filtering

```typescript
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
  { id: "status", value: ["pending", "waiting"] }
]);

const table = useReactTable({
  data,
  columns,
  state: { columnFilters },
  onColumnFiltersChange: setColumnFilters,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  // ... other features
});
```

---

## Security Considerations

### Environment Variables

**NEVER commit to git:**
- `.env.local` (contains secrets)
- Any file with `AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, API keys

**Safe to commit:**
- `.env.local.example` (template with no real values)

**Verification:**
```bash
# Check what's committed
git ls-files | grep "\.env"

# Should only show: .env.local.example

# Check what's ignored
git status --ignored | grep "\.env"

# Should show: .env.local
```

### Authentication Requirements

**NextAuth v5 requirements:**
1. **Explicit secret:** Must set `secret: process.env.AUTH_SECRET` in config
2. **trustHost:** Must set `trustHost: true` for proxy setups
3. **Environment validation:** Throw errors on missing vars (fail fast)

**After any auth changes:**
```bash
# MUST rebuild (Next.js 15 bakes config at build time)
rm -rf .next
npm run build
systemctl restart taskwarrior-web
```

### OAuth Security

**Google Console settings:**
- Authorized redirect URIs must match exactly
- Use HTTPS in production (required by OAuth)
- Restrict to specific domains in production

**Redirect URI format:**
```
https://your-domain.com/api/auth/callback/google
```

### API Route Protection

**Always check session in API routes:**
```typescript
const session = await auth();
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**DO NOT:**
- Skip auth checks in API routes
- Return sensitive data without verification
- Trust client-side validation alone

---

## Troubleshooting Guide

### Authentication Not Working

**Symptom:** Can access site without logging in

**Checks:**
1. Verify NextAuth providers API:
   ```bash
   curl http://localhost:3000/api/auth/providers
   ```
   Should return Google provider config, not error.

2. Check environment variables:
   ```bash
   # In systemd
   systemctl show taskwarrior-web --property=Environment
   
   # Should show AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   ```

3. Verify `auth.ts` has:
   - `secret: process.env.AUTH_SECRET`
   - `trustHost: true`
   - Environment validation

4. Did you rebuild after auth changes?
   ```bash
   rm -rf .next && npm run build
   ```

**Fix:** See `docs/AUTH_FIX_DOCUMENTATION.md` for complete troubleshooting.

### Build Errors

**Symptom:** `npm run build` fails with ESLint/TypeScript errors

**Quick fix:**
In `next.config.ts`:
```typescript
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true }
```

**Proper fix:**
```bash
# Fix lint errors
npm run lint -- --fix

# Fix type errors
npx tsc --noEmit
```

### Tasks Not Loading

**Symptom:** Empty task list or API errors

**Checks:**
1. Verify Taskwarrior installed:
   ```bash
   task version
   ```

2. Check Taskwarrior data:
   ```bash
   ls -la ~/.task/
   # Should show taskchampion.sqlite3
   ```

3. Test Taskwarrior CLI:
   ```bash
   task list
   ```

4. Check API logs:
   ```bash
   journalctl -u taskwarrior-web -n 50
   ```

### OAuth Callback Errors

**Symptom:** Redirect to Google works, but callback fails

**Checks:**
1. Verify `NEXTAUTH_URL` matches your domain exactly
2. Check Google Console redirect URIs match
3. Ensure HTTPS in production (OAuth requirement)
4. Check callback URL in browser address bar

**Common mistakes:**
- `http://` instead of `https://`
- Missing trailing slash mismatch
- Wrong domain or port

### Port Already in Use

**Symptom:** Cannot start application, port 3000 in use

**Find process:**
```bash
lsof -i :3000
```

**Kill process:**
```bash
kill -9 $(lsof -t -i :3000)
```

### Tailscale Funnel Not Working

**Symptom:** Cannot access public URL

**Checks:**
1. Verify funnel enabled:
   ```bash
   tailscale serve status
   # Should show "Funnel on"
   ```

2. Check Tailscale status:
   ```bash
   tailscale status
   ```

3. Verify port:
   ```bash
   curl http://localhost:3000
   # Should work locally
   ```

**Re-enable funnel:**
```bash
tailscale serve reset
tailscale funnel --bg 3000
```

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build production
npm start                # Start production server
npm run lint             # Run ESLint

# Systemd (on container)
systemctl status taskwarrior-web
systemctl restart taskwarrior-web
journalctl -u taskwarrior-web -f

# Taskwarrior
task list                # View tasks
task add "Description"   # Add task
task 1 done              # Complete task
task 1 delete            # Delete task
task export              # Export JSON

# Tailscale
tailscale funnel --bg 3000     # Enable public access
tailscale serve status          # Check status
tailscale serve reset           # Reset configuration

# Git
git status               # Check changes
git add .                # Stage all changes
git commit -m "message"  # Commit
git push origin main     # Push to GitHub
```

### Important URLs

- **Production:** https://taskwarrior.tail48fe8.ts.net
- **Development:** http://localhost:3000
- **GitHub:** https://github.com/ivishalgandhi/taskwarrior-web-ui
- **Google Console:** https://console.cloud.google.com

### File Locations (Production Container)

- **App directory:** `/root/taskwarrior-web-ui/`
- **Systemd service:** `/etc/systemd/system/taskwarrior-web.service`
- **Taskwarrior data:** `/root/.task/`
- **Node.js:** `/root/.nvm/versions/node/v24.12.0/`

---

## Contributing

### Branch Strategy

- **`main`** - Production-ready code
- **`fix/*`** - Bug fixes
- **`feature/*`** - New features

### Commit Message Format

```
type: short description

Detailed explanation if needed.

- List of changes
- Important notes
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### Testing Before Merge

1. Test authentication in incognito browser
2. Verify all task operations work
3. Check calendar view functionality
4. Test on actual deployment target
5. Review all changed files

---

## Version History

- **Current:** Main branch with triple-layer auth protection
- **Recent changes:**
  - Fixed NextAuth v5 authentication
  - Added server-side auth backup layer
  - Organized docs/ folder
  - Moved Docker files to docker/
  - Added .env.local.example
  - Removed Caddy (using Tailscale Funnel)

---

## Support Resources

- **Taskwarrior Docs:** https://taskwarrior.org/docs/
- **Next.js Docs:** https://nextjs.org/docs
- **NextAuth Docs:** https://authjs.dev/
- **Tailscale Docs:** https://tailscale.com/kb/
- **shadcn/ui:** https://ui.shadcn.com/

---

## Notes for AI Agents

### When Making Changes

1. **Always read current file contents** before editing (files may have been modified)
2. **Check authentication implications** - any API route needs auth verification
3. **Rebuild after auth changes** - Next.js 15 bakes config at build time
4. **Test thoroughly** - authentication bugs are critical security issues
5. **Update documentation** when making significant changes

### Common Pitfalls

- ❌ Removing `secret` or `trustHost` from auth.ts
- ❌ Skipping rebuild after auth configuration changes
- ❌ Creating API routes without auth checks
- ❌ Converting server components to client components without considering auth
- ❌ Committing .env.local file
- ❌ Changing middleware matcher without understanding implications

### Best Practices

- ✅ Always verify session in API routes
- ✅ Use server components for auth-protected pages
- ✅ Keep middleware, server component, and config auth layers intact
- ✅ Test in incognito browser after auth changes
- ✅ Check systemd logs when debugging production issues
- ✅ Use `git status` before committing to avoid committing secrets

---

**Last Updated:** January 3, 2026  
**Maintained By:** Project maintainers and AI agent collaboration
