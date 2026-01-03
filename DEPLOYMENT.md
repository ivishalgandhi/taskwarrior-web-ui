# Deployment Guide for LXC Container

## Prerequisites

1. LXC container with Docker installed
2. Taskwarrior installed in LXC container
3. Google OAuth credentials configured

## Step 1: Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add production URLs to **Authorized redirect URIs**:
   ```
   http://YOUR_LXC_IP:3000/api/auth/callback/google
   https://YOUR_DOMAIN/api/auth/callback/google
   ```
4. Add production URLs to **Authorized JavaScript origins**:
   ```
   http://YOUR_LXC_IP:3000
   https://YOUR_DOMAIN
   ```

## Step 2: Prepare on Local Machine

1. Create `.env.local` file (copy from `.env.local.example`):
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your values:
   ```bash
   AUTH_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=http://YOUR_LXC_IP:3000
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   NODE_ENV=production
   ```

3. Test build locally:
   ```bash
   npm run build
   npm start
   ```

## Step 3: Transfer to LXC Container

1. From your local machine, copy files to LXC:
   ```bash
   # Create tarball excluding node_modules and .next
   tar -czf taskwarrior-web-ui.tar.gz \
     --exclude=node_modules \
     --exclude=.next \
     --exclude=.git \
     .

   # Copy to LXC container
   scp taskwarrior-web-ui.tar.gz user@lxc-ip:/path/to/deploy/
   scp .env.local user@lxc-ip:/path/to/deploy/
   ```

2. Or use rsync:
   ```bash
   rsync -avz \
     --exclude node_modules \
     --exclude .next \
     --exclude .git \
     ./ user@lxc-ip:/path/to/deploy/taskwarrior-web-ui/
   
   scp .env.local user@lxc-ip:/path/to/deploy/taskwarrior-web-ui/
   ```

## Step 4: Deploy on LXC Container

1. SSH into your LXC container:
   ```bash
   ssh user@lxc-ip
   ```

2. Navigate to deployment directory:
   ```bash
   cd /path/to/deploy/taskwarrior-web-ui
   ```

3. Verify `.env.local` exists and has correct values:
   ```bash
   cat .env.local
   ```

4. Build and start with Docker:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

## Step 5: Verify Deployment

1. Check container logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

2. Verify Taskwarrior connection:
   ```bash
   docker-compose -f docker-compose.prod.yml exec web task list
   ```

3. Access the application:
   ```
   http://YOUR_LXC_IP:3000
   ```

## Alternative: Deploy without Docker

If you prefer not to use Docker:

1. Install Node.js 20+ on LXC:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. Install Taskwarrior (if not already installed):
   ```bash
   sudo apt-get install taskwarrior
   ```

3. Copy your Taskwarrior data:
   ```bash
   rsync -avz ~/.task/ user@lxc-ip:~/.task/
   rsync -avz ~/.taskrc user@lxc-ip:~/.taskrc
   ```

4. Transfer and build:
   ```bash
   cd /path/to/taskwarrior-web-ui
   npm ci
   npm run build
   ```

5. Start with PM2 (recommended):
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name "taskwarrior-web-ui" -- start
   pm2 save
   pm2 startup
   ```

6. Or start directly:
   ```bash
   npm start
   ```

## Troubleshooting

### OAuth Error: "redirect_uri_mismatch"
- Verify the redirect URI in Google Console matches exactly: `http://YOUR_IP:3000/api/auth/callback/google`
- Check NEXTAUTH_URL in `.env.local` matches your deployment URL

### Can't access from other machines
- Ensure port 3000 is open in LXC firewall
- Check Next.js is listening on 0.0.0.0: `netstat -tlnp | grep 3000`

### Taskwarrior tasks not loading
- Verify Taskwarrior works in container: `docker exec -it taskwarrior-web-ui-web-1 task list`
- Check volume mounts in docker-compose.prod.yml
- Ensure .task directory permissions are correct

### Environment variables not loading
- Verify `.env.local` file is in the project root
- Check file permissions: `chmod 600 .env.local`
- Restart container: `docker-compose -f docker-compose.prod.yml restart`

## Updates

To update the application:

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Or without downtime
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Security Recommendations

1. Use HTTPS with reverse proxy (nginx/caddy)
2. Keep AUTH_SECRET secure and never commit to git
3. Restrict Google OAuth to specific email addresses if needed
4. Regular security updates: `npm audit fix`
5. Consider using Docker secrets for sensitive values
