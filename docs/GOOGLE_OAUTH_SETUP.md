# Google OAuth Setup Guide

## Quick Setup Steps

### 1. Generate AUTH_SECRET
Run this command to generate a secure random secret:
```bash
openssl rand -base64 32
```

Copy the output and paste it as `AUTH_SECRET` in your `.env.local` file.

### 2. Create Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: Create a new project or select an existing one
3. **Enable APIs**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click "Enable"

4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill in the required fields:
     - App name: `Taskwarrior Web`
     - User support email: `igandhivishal@gmail.com`
     - Developer contact: `igandhivishal@gmail.com`
   - Click "Save and Continue"
   - Skip "Scopes" (click "Save and Continue")
   - Add test user: `igandhivishal@gmail.com`
   - Click "Save and Continue"

5. **Create OAuth 2.0 Client ID**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `Taskwarrior Web`
   - Authorized redirect URIs:
     - Click "Add URI"
     - Enter: `http://localhost:3000/api/auth/callback/google`
   - Click "Create"

6. **Copy Your Credentials**:
   - You'll see a popup with your Client ID and Client Secret
   - Copy both values

### 3. Update .env.local

Open `.env.local` and replace the placeholders:

```env
# Generate with: openssl rand -base64 32
AUTH_SECRET=paste-the-generated-secret-here

# From Google Cloud Console
GOOGLE_CLIENT_ID=paste-your-client-id-here
GOOGLE_CLIENT_SECRET=paste-your-client-secret-here

# Your app URL
NEXTAUTH_URL=http://localhost:3000
```

### 4. Restart Development Server

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

### 5. Test Authentication

1. Navigate to: http://localhost:3000
2. You should be redirected to the login page
3. Click "Google" button
4. Sign in with: igandhivishal@gmail.com
5. You'll be redirected back to the app

## Important URLs

- **Authorized Redirect URI (localhost)**: `http://localhost:3000/api/auth/callback/google`
- **OAuth Consent Screen**: https://console.cloud.google.com/apis/credentials/consent
- **Credentials**: https://console.cloud.google.com/apis/credentials

## Troubleshooting

### Error: "OAuth client was not found"
- Make sure you've created the OAuth client ID in Google Cloud Console
- Verify that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set correctly in .env.local
- Restart your dev server after updating .env.local

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches:
  `http://localhost:3000/api/auth/callback/google`
- Check for trailing slashes (should NOT have one)
- Verify the protocol is `http://` for localhost (not `https://`)

### Can't sign in as test user
- Make sure you added `igandhivishal@gmail.com` as a test user in the OAuth consent screen
- If the app is in "Testing" mode, only test users can sign in

## For Production Deployment

When deploying to production:

1. Add your production URL to Authorized redirect URIs:
   ```
   https://your-domain.com/api/auth/callback/google
   ```

2. Update NEXTAUTH_URL in your production environment:
   ```
   NEXTAUTH_URL=https://your-domain.com
   ```

3. Publish your OAuth consent screen (move from "Testing" to "Production")
