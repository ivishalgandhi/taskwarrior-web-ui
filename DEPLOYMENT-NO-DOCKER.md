# Deployment Without Docker

## Option 1: Direct Node.js (Simplest)

### Setup
```bash
# On LXC container
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs taskwarrior

# Transfer files (from your local machine)
rsync -avz --exclude node_modules --exclude .next --exclude .git \
  ./ user@lxc-ip:~/taskwarrior-web-ui/

# Copy environment file
scp .env.local user@lxc-ip:~/taskwarrior-web-ui/

# Copy Taskwarrior data
rsync -avz ~/.task/ user@lxc-ip:~/.task/
scp ~/.taskrc user@lxc-ip:~/.taskrc
```

### Deploy
```bash
# On LXC container
cd ~/taskwarrior-web-ui
npm ci
npm run build
npm start
```

**Pros:** Simple, no extra tools needed  
**Cons:** Stops when you close SSH, no auto-restart, runs on port 3000

---

## Option 2: PM2 Process Manager (Recommended)

### Setup
```bash
# On LXC container
sudo npm install -g pm2

cd ~/taskwarrior-web-ui
npm ci
npm run build
```

### Deploy
```bash
# Start application
pm2 start npm --name "taskwarrior" -- start

# Save PM2 configuration
pm2 save

# Enable auto-start on boot
pm2 startup
# Copy and run the command it outputs

# View logs
pm2 logs taskwarrior

# Monitor
pm2 monit

# Restart after changes
pm2 restart taskwarrior

# Stop
pm2 stop taskwarrior
```

**Pros:** Auto-restart, runs in background, easy monitoring, auto-start on boot  
**Cons:** Requires PM2 installation

---

## Option 3: Systemd Service (Production-grade)

### Create service file
```bash
sudo nano /etc/systemd/system/taskwarrior-web.service
```

Paste this configuration:
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

### Deploy
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start
sudo systemctl enable taskwarrior-web

# Start service
sudo systemctl start taskwarrior-web

# Check status
sudo systemctl status taskwarrior-web

# View logs
sudo journalctl -u taskwarrior-web -f

# Restart
sudo systemctl restart taskwarrior-web

# Stop
sudo systemctl stop taskwarrior-web
```

**Pros:** Robust, auto-restart, auto-start on boot, system integration  
**Cons:** Requires root access, slightly more complex setup

---

## Option 4: With Reverse Proxy (Best for Production)

Use **Option 2 (PM2)** or **Option 3 (Systemd)**, then add a reverse proxy.

### Option 4A: Caddy (Recommended - Automatic HTTPS!)

Caddy automatically handles SSL certificates - no certbot needed!

#### Install Caddy
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

#### Configure Caddy
```bash
sudo nano /etc/caddy/Caddyfile
```

Paste this configuration:
```caddy
# For domain with automatic HTTPS
your-domain.com {
    reverse_proxy localhost:3000
}

# OR for local IP without HTTPS
http://your-lxc-ip {
    reverse_proxy localhost:3000
}
```

#### Enable and restart
```bash
sudo systemctl restart caddy
sudo systemctl enable caddy
sudo systemctl status caddy
```

**Pros:** 
- ✅ Automatic HTTPS/SSL (no certbot needed!)
- ✅ Simplest configuration
- ✅ Auto-renews certificates
- ✅ Modern and fast

**Cons:** 
- Less common than nginx (but growing fast)

---

### Option 4B: Nginx (Traditional Choice)

#### Install nginx
```bash
sudo apt-get update
sudo apt-get install -y nginx
```

#### Configure nginx
```bash
sudo nano /etc/nginx/sites-available/taskwarrior
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or use LXC IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Enable and restart
```bash
sudo ln -s /etc/nginx/sites-available/taskwarrior /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Add SSL (Optional but Recommended)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Pros:** 
- ✅ Industry standard
- ✅ Well documented
- ✅ Widely used

**Cons:** 
- Manual SSL setup with certbot

---

## Comparison Table

| Method | Auto-Start | Auto-Restart | Logs | Port | Complexity | Best For |
|--------|-----------|--------------|------|------|------------|----------|
| Direct Node | ❌ | ❌ | Console | 3000 | ⭐ | Testing |
| PM2 | ✅ | ✅ | pm2 logs | 3000 | ⭐⭐ | Development/Personal |
| Systemd | ✅ | ✅ | journalctl | 3000 | ⭐⭐⭐ | Production |
| Caddy + PM2/Systemd | ✅ | ✅ | Multiple | 80/443 | ⭐⭐⭐⭐ | Production (easiest SSL!) |
| Nginx + PM2/Systemd | ✅ | ✅ | Multiple | 80/443 | ⭐⭐⭐⭐ | Production (traditional) |

---

## My Recommendation

**For personal/home use:** Option 2 (PM2)
- Easy to use
- Good monitoring
- Reliable

**For production/team use:** Option 4 (Systemd + Caddy or Nginx)
- **Caddy** if you want automatic HTTPS (recommended!)
- **Nginx** if you prefer traditional/battle-tested
- Professional setup
- Easy SSL (automatic with Caddy, certbot with Nginx)
- Standard ports (80/443)
- Better security

---

## Quick Commands Reference

### PM2
```bash
pm2 start npm --name taskwarrior -- start    # Start
pm2 restart taskwarrior                       # Restart
pm2 stop taskwarrior                          # Stop
pm2 logs taskwarrior                          # Logs
pm2 monit                                     # Monitor
pm2 list                                      # List all apps
```

### Systemd
```bash
sudo systemctl start taskwarrior-web          # Start
sudo systemctl restart taskwarrior-web        # Restart
sudo systemctl stop taskwarrior-web           # Stop
sudo systemctl status taskwarrior-web         # Status
sudo journalctl -u taskwarrior-web -f         # Logs
```

### Nginx
```bash
sudo systemctl restart nginx                  # Restart
sudo nginx -t                                 # Test config
sudo tail -f /var/log/nginx/access.log        # Access logs
sudo tail -f /var/log/nginx/error.log         # Error logs
```

### Caddy
```bash
sudo systemctl restart caddy                  # Restart
caddy fmt /etc/caddy/Caddyfile               # Format/validate config
sudo systemctl status caddy                   # Status
sudo journalctl -u caddy -f                  # Logs
```

---

## Update/Redeploy

For any option:

```bash
# On local machine - push changes
rsync -avz --exclude node_modules --exclude .next --exclude .git \
  ./ user@lxc-ip:~/taskwarrior-web-ui/

# On LXC container
cd ~/taskwarrior-web-ui
npm ci
npm run build

# Then restart based on your method:
pm2 restart taskwarrior                       # If using PM2
# OR
sudo systemctl restart taskwarrior-web        # If using systemd
```

---

## Troubleshooting

### Port 3000 already in use
```bash
# Find process
sudo lsof -i :3000
# Kill it
sudo kill -9 PID
```

### Can't access from other machines
```bash
# Check if Next.js is listening on all interfaces
netstat -tlnp | grep 3000

# Should show 0.0.0.0:3000, not 127.0.0.1:3000
# If wrong, check NEXTAUTH_URL in .env.local
```

### Google OAuth not working
1. Verify NEXTAUTH_URL matches your actual URL
2. Check Google Console redirect URIs
3. Restart the application

### Taskwarrior data not syncing
```bash
# Verify Taskwarrior works
task list

# Check permissions
ls -la ~/.task/

# If needed, fix permissions
chmod 600 ~/.task/*.data
```
