# OAuth Configuration Guide

## Current Setup: Testing Mode (Single User)

Your OAuth app is currently in **Testing** mode, which means:
- ✅ **igandhivishal@gmail.com** can sign in (listed as test user)
- ❌ Other Google accounts will see "Access blocked" error

## To Allow Other Users:

### Option 1: Add More Test Users (Quick, Limited)
1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Scroll to "Test users"
3. Click "Add Users"
4. Enter email addresses (max 100 test users)
5. Click "Save"

### Option 2: Publish to Production (Recommended for Public Use)
1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Click "Publish App"
3. Google may require verification if you request sensitive scopes
4. For basic authentication (email, profile), verification is usually not needed
5. Once published, **any Google account** can sign in

⚠️ **Note**: Publishing means the app goes through Google's review if using sensitive scopes. For basic email/profile access (which we use), it's usually instant.

## Current Scopes Used:
- Email address
- Basic profile information (name, profile picture)

These are considered non-sensitive and shouldn't require verification.
