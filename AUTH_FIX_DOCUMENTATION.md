# Authentication Fix Documentation

## Problem Summary

The application was loading the main page without requiring authentication. Users could access task data without logging in via Google OAuth.

---

## Root Causes Identified

### 1. **Missing NextAuth v5 Required Configuration**
NextAuth v5 requires explicit configuration that was missing:
- `secret` must be explicitly set in the NextAuth config (not just in environment variables)
- `trustHost: true` is required when running behind proxies/Tailscale

### 2. **Environment Variables Not Loading in Production**
- Next.js 15 bakes environment variables at build time
- Systemd `EnvironmentFile` has issues with comments in .env files
- App was running without proper environment variables loaded

### 3. **Middleware Not Enforcing Authentication**
- The middleware was configured but NextAuth wasn't initializing properly
- Without a valid auth instance, the middleware couldn't check authentication status
- This caused it to silently fail and allow unauthenticated access

---

## Solutions Implemented

### Fix 1: Update `auth.ts` Configuration

**File:** `auth.ts`

**Required Changes:**

```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// CRITICAL: Add environment variable validation
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is not set')
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Google OAuth credentials are not set')
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // CRITICAL: Explicitly set the secret (required in NextAuth v5)
  secret: process.env.AUTH_SECRET,
  
  // CRITICAL: Required for proxy/Tailscale setups
  trustHost: true,
  
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      // This callback is used by middleware to check if user is authenticated
      return !!auth
    },
  },
})
```

**Key Points:**
- `secret: process.env.AUTH_SECRET` - **MUST be explicitly set**
- `trustHost: true` - **Required for proxy environments** (Caddy, Nginx, Tailscale)
- Environment variable validation ensures the app fails fast if misconfigured

---

### Fix 2: Proper Environment Variable Configuration

**For Systemd Deployment:**

**File:** `/etc/systemd/system/taskwarrior-web.service`

```ini
[Unit]
Description=Taskwarrior Web UI
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/taskwarrior-web-ui
Environment="NODE_ENV=production"
Environment="PATH=/root/.nvm/versions/node/v24.12.0/bin:/usr/bin:/usr/local/bin"
Environment="AUTH_SECRET=your-secret-here"
Environment="GOOGLE_CLIENT_ID=your-client-id"
Environment="GOOGLE_CLIENT_SECRET=your-client-secret"
Environment="NEXTAUTH_URL=https://your-domain.com"
ExecStart=/root/.nvm/versions/node/v24.12.0/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=taskwarrior-web

[Install]
WantedBy=multi-user.target
```

**Important Notes:**
- Do NOT use `EnvironmentFile=` with files that contain comments
- Set environment variables directly in the service file
- Use quotes around values: `Environment="KEY=value"`

**After modifying:**
```bash
sudo systemctl daemon-reload
sudo systemctl restart taskwarrior-web
```

---

### Fix 3: Rebuild After Configuration Changes

**CRITICAL:** Next.js 15 requires a rebuild after any authentication configuration changes:

```bash
# Remove old build
rm -rf .next

# Rebuild with environment variables available
npm run build

# Restart the service
sudo systemctl restart taskwarrior-web
```

**Why this is required:**
- Next.js bakes configuration at build time
- Auth middleware is compiled during build
- Environment variables used in auth config must be available during build

---

## Ensuring Authentication is ALWAYS Required

### 1. **Middleware Configuration** (Already Correct)

**File:** `middleware.ts`

```typescript
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname.startsWith('/login')

  // CRITICAL: Redirect to login if not authenticated
  if (!isLoggedIn && !isOnLoginPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // If logged in and on login page, redirect to home
  if (isLoggedIn && isOnLoginPage) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  // CRITICAL: This matcher ensures middleware runs on all routes except API, static files, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

**Important:** The middleware will ONLY work if NextAuth is properly configured (see Fix 1).

---

### 2. **Verify Authentication is Working**

Run these checks after deployment:

#### Check 1: Verify NextAuth Providers API
```bash
curl http://localhost:3000/api/auth/providers
```

**Expected Output:**
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oidc",
    "signinUrl": "https://your-domain.com/api/auth/signin/google",
    "callbackUrl": "https://your-domain.com/api/auth/callback/google"
  }
}
```

**Error Output (BAD):**
```json
{"message":"There was a problem with the server configuration. Check the server logs for more information."}
```

If you see the error message, NextAuth is NOT configured correctly. Review Fix 1.

#### Check 2: Verify Unauthenticated Access is Blocked
```bash
# Test in private/incognito browser
# Navigate to: https://your-domain.com
# Expected: Should redirect to /login
# BAD: If you see the main task page without login, auth is broken
```

#### Check 3: Verify Environment Variables are Loaded
```bash
# Check if the process has the environment variables
ps eww -p $(pgrep -f 'next-server') | tr ' ' '\n' | grep -E '(AUTH_SECRET|GOOGLE_CLIENT)'
```

**Expected:** Should show the environment variables with values.

---

## Deployment Checklist

When deploying authentication changes:

- [ ] 1. Update `auth.ts` with `secret` and `trustHost: true`
- [ ] 2. Ensure environment variables are set correctly (systemd service file)
- [ ] 3. **Remove old build:** `rm -rf .next`
- [ ] 4. **Rebuild application:** `npm run build`
- [ ] 5. Reload systemd: `sudo systemctl daemon-reload`
- [ ] 6. Restart service: `sudo systemctl restart taskwarrior-web`
- [ ] 7. Verify providers API returns Google config (Check 1)
- [ ] 8. Test unauthenticated access is blocked (Check 2)
- [ ] 9. Update Google OAuth redirect URIs in Google Cloud Console
- [ ] 10. Test complete login flow

---

## Required Environment Variables

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `AUTH_SECRET` | ✅ Yes | Generate with: `openssl rand -base64 32` | NextAuth session encryption |
| `GOOGLE_CLIENT_ID` | ✅ Yes | `123456-abc.apps.googleusercontent.com` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ Yes | `GOCSPX-xxxxx` | Google OAuth client secret |
| `NEXTAUTH_URL` | ✅ Yes | `https://your-domain.com` | Base URL for callbacks |
| `NODE_ENV` | ✅ Yes | `production` | Node environment |

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## Google OAuth Configuration

**In Google Cloud Console:**

1. Go to: https://console.cloud.google.com
2. Navigate to: **APIs & Services** > **Credentials**
3. Select your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://your-domain.com/api/auth/callback/google
   ```
5. Also keep localhost for development:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. Save changes

---

## Troubleshooting

### Problem: Main page loads without authentication

**Solution:**
1. Check if `/api/auth/providers` returns Google config (not an error)
2. Verify `AUTH_SECRET` is set and `secret:` is in `auth.ts`
3. Verify `trustHost: true` is set in `auth.ts`
4. Rebuild the application after any auth.ts changes
5. Clear browser cookies and test in private window

### Problem: "There was a problem with the server configuration"

**Solution:**
1. Check environment variables are set in systemd service file
2. Verify `auth.ts` has the validation checks (see Fix 1)
3. Check service logs: `journalctl -u taskwarrior-web -n 50`
4. The error messages will tell you which variable is missing

### Problem: OAuth redirects to wrong URL

**Solution:**
1. Verify `NEXTAUTH_URL` matches your actual domain
2. Check Google Console redirect URIs match exactly
3. Rebuild after changing `NEXTAUTH_URL`

---

## Security Best Practices

1. **Never commit secrets** to git
   - Keep `.env.local` in `.gitignore`
   - Use environment variables in production

2. **Use strong AUTH_SECRET**
   - Minimum 32 bytes
   - Generated randomly: `openssl rand -base64 32`
   - Different for each environment

3. **HTTPS Required**
   - OAuth requires HTTPS in production
   - Tailscale/Caddy automatically provides HTTPS

4. **Restrict Google OAuth**
   - In Google Console, restrict to specific domains
   - Add authorized domains under "OAuth consent screen"

5. **Monitor Authentication**
   - Check service logs regularly
   - Monitor failed authentication attempts
   - Set up alerts for auth errors

---

## Summary for Developer

**Critical points to remember:**

1. ✅ **`secret`** and **`trustHost: true`** MUST be in `auth.ts` NextAuth config
2. ✅ Environment variables must be available during **build time**
3. ✅ **Rebuild** the app after any auth configuration changes
4. ✅ Test that unauthenticated users **cannot** access main page
5. ✅ Verify `/api/auth/providers` returns valid JSON (not error)

**The app will NOT require authentication if NextAuth fails to initialize. Always verify after deployment.**
