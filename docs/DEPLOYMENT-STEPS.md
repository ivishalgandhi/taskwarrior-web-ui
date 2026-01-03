# Deployment Steps - Systemd + Caddy

**Target:** https://taskwarrior.tail48fe8.ts.net  
**Stack:** Systemd + Caddy (automatic HTTPS)

---

## Step 1: Install Node.js and Dependencies

SSH into your container and run:

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Taskwarrior
sudo apt-get install -y taskwarrior

# Verify installations
node --version  # Should show v20.x
npm --version
task --version
```

---

## Step 2: Transfer Source Code

**On your Mac** (from `/Users/vishal/code/taskwarrior-web-ui`):

```bash
# Replace 'user@container-ip' with your actual SSH details
rsync -avz --exclude node_modules --exclude .next --exclude .git \
  ./ user@container-ip:~/taskwarrior-web-ui/
```

---

## Step 3: Update .env.local

**On your Mac**, update `.env.local` to use the correct URL:

```bash
# Edit .env.local and ensure NEXTAUTH_URL is:
NEXTAUTH_URL=https://taskwarrior.tail48fe8.ts.net
```

Then transfer it:

```bash
scp .env.local user@container-ip:~/taskwarrior-web-ui/
```

---

## Step 4: Transfer Taskwarrior Data

**On your Mac**:

```bash
# Transfer task data
rsync -avz ~/.task/ user@container-ip:~/.task/

# Transfer config
scp ~/.taskrc user@container-ip:~/.taskrc
```

**On the container**, verify:

```bash
task list
```

---

## Step 5: Build the Application

**On the container**:

```bash
cd ~/taskwarrior-web-ui
npm ci
npm run build

# Test it works
npm start
# Press Ctrl+C after verifying it starts without errors
```

---

## Step 6: Create Systemd Service

**On the container**:

```bash
sudo nano /etc/systemd/system/taskwarrior-web.service
```

Paste this configuration (replace `YOUR_USERNAME` with your actual username):

```ini
[Unit]
Description=Taskwarrior Web UI
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/taskwarrior-web-ui
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin
EnvironmentFile=/home/YOUR_USERNAME/taskwarrior-web-ui/.env.local
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=taskwarrior-web

[Install]
WantedBy=multi-user.target
```

Save and exit (Ctrl+X, then Y, then Enter).

---

## Step 7: Enable and Start Service

**On the container**:

```bash
# Reload systemd to recognize new service
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable taskwarrior-web

# Start the service
sudo systemctl start taskwarrior-web

# Check status
sudo systemctl status taskwarrior-web

# View logs
sudo journalctl -u taskwarrior-web -f
```

Verify the app is running on localhost:3000:

```bash
curl http://localhost:3000
```

---

## Step 8: Configure Caddy for HTTPS

**On the container**:

```bash
sudo nano /etc/caddy/Caddyfile
```

Replace the contents with:

```caddy
taskwarrior.tail48fe8.ts.net {
    reverse_proxy localhost:3000
}
```

Save and exit.

---

## Step 9: Restart Caddy

**On the container**:

```bash
# Test configuration
caddy fmt /etc/caddy/Caddyfile

# Restart Caddy
sudo systemctl restart caddy

# Check status
sudo systemctl status caddy

# View logs if needed
sudo journalctl -u caddy -f
```

Caddy will automatically provision HTTPS certificates for your Tailscale domain.

---

## Step 10: Configure Google OAuth

**In Google Cloud Console** (https://console.cloud.google.com):

1. Go to your OAuth 2.0 Client ID
2. Under **Authorized redirect URIs**, add:
   ```
   https://taskwarrior.tail48fe8.ts.net/api/auth/callback/google
   ```
3. Save changes

---

## Step 11: Test Access

Open your browser and navigate to:

```
https://taskwarrior.tail48fe8.ts.net
```

You should see:
- ✅ HTTPS with valid certificate (automatic via Caddy)
- ✅ Login page
- ✅ Google OAuth working
- ✅ Your tasks displayed after login

---

## 🎉 Done! Common Commands

### Service Management
```bash
sudo systemctl status taskwarrior-web      # Check status
sudo systemctl restart taskwarrior-web     # Restart
sudo systemctl stop taskwarrior-web        # Stop
sudo systemctl start taskwarrior-web       # Start
sudo journalctl -u taskwarrior-web -f      # View logs
```

### Caddy Management
```bash
sudo systemctl status caddy                # Check status
sudo systemctl restart caddy               # Restart
sudo journalctl -u caddy -f               # View logs
```

### Update/Redeploy Code
```bash
# On Mac - transfer changes
rsync -avz --exclude node_modules --exclude .next --exclude .git \
  ./ user@container-ip:~/taskwarrior-web-ui/

# On container - rebuild and restart
cd ~/taskwarrior-web-ui
npm ci
npm run build
sudo systemctl restart taskwarrior-web
```

---

## Troubleshooting

### Service won't start
```bash
# Check detailed logs
sudo journalctl -u taskwarrior-web -n 50 --no-pager

# Verify .env.local exists and is readable
ls -la ~/taskwarrior-web-ui/.env.local
```

### Can't access via HTTPS
```bash
# Check Caddy logs
sudo journalctl -u caddy -n 50 --no-pager

# Verify Caddy is listening on 443
sudo netstat -tlnp | grep 443

# Test DNS resolution
nslookup taskwarrior.tail48fe8.ts.net
```

### Google OAuth not working
1. Verify redirect URI in Google Console matches exactly:
   `https://taskwarrior.tail48fe8.ts.net/api/auth/callback/google`
2. Check NEXTAUTH_URL in .env.local:
   ```bash
   grep NEXTAUTH_URL ~/taskwarrior-web-ui/.env.local
   ```
3. Restart service after any .env.local changes:
   ```bash
   sudo systemctl restart taskwarrior-web
   ```

### Port 3000 already in use
```bash
sudo lsof -i :3000
sudo kill -9 PID
sudo systemctl restart taskwarrior-web
```
