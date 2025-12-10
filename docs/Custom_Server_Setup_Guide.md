# ClubCalendar Custom Server Setup Guide

This guide walks you through setting up ClubCalendar on your own server (like mail.sbnewcomers.org).

---

## Prerequisites

- Linux server with:
  - Python 3.8+
  - Cron
  - Web server (Apache/Nginx) for serving static files
- Wild Apricot admin access (for API credentials)

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Server                             │
│                                                             │
│  /etc/clubcalendar/                                         │
│  └── config.json          ← Organization configuration      │
│                                                             │
│  /opt/clubcalendar/                                         │
│  └── sync/                ← Sync scripts                    │
│      ├── sync.py                                            │
│      ├── config.py                                          │
│      └── storage.py                                         │
│                                                             │
│  /var/www/clubcalendar/                                     │
│  ├── data/                                                  │
│  │   └── {org_id}/                                          │
│  │       └── events.json  ← Generated every 15 min          │
│  ├── widget/                                                │
│  │   └── clubcalendar-widget.js                             │
│  └── admin/                                                 │
│      └── index.html       ← Configuration UI                │
│                                                             │
│  Cron: */15 * * * * python3 /opt/clubcalendar/sync/sync.py  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Get Wild Apricot API Credentials

1. Log into Wild Apricot admin

2. Go to **Settings** → **Authorized applications**

3. Click **Authorize application**

4. Fill in:
   - **Application name:** ClubCalendar Sync
   - **Permissions:** Check all read permissions for Events, Contacts

5. Click **Authorize**

6. Copy and save:
   - **API key**
   - **Account ID** (from Settings → General)

---

## Step 2: Create Directory Structure

```bash
# Create directories
sudo mkdir -p /opt/clubcalendar/sync
sudo mkdir -p /etc/clubcalendar
sudo mkdir -p /var/www/clubcalendar/{data,widget,admin}

# Set permissions (adjust user as needed)
sudo chown -R www-data:www-data /var/www/clubcalendar
sudo chown -R $USER:$USER /opt/clubcalendar
sudo chown -R $USER:$USER /etc/clubcalendar
```

---

## Step 3: Install Sync Scripts

Copy the sync scripts to the server:

```bash
# From your development machine
scp sync.py config.py storage.py user@yourserver:/opt/clubcalendar/sync/
```

Or clone/copy the files:

```bash
cd /opt/clubcalendar/sync

# Create the files (copy content from the repository)
# - sync.py
# - config.py
# - storage.py
```

Install dependencies:

```bash
pip3 install requests
```

---

## Step 4: Create Configuration File

Create `/etc/clubcalendar/config.json`:

```json
{
    "org_id": "sbnc",
    "deployment": "custom_server",

    "wild_apricot": {
        "account_id": "YOUR_ACCOUNT_ID",
        "api_key": "YOUR_API_KEY"
    },

    "data_directory": "/var/www/clubcalendar/data",
    "base_url": "https://mail.sbnewcomers.org/clubcalendar",

    "sync": {
        "interval_minutes": 15,
        "include_past_days": 0
    },

    "auto_tag_rules": [
        {
            "type": "name-prefix",
            "pattern": "Happy Hikers:",
            "tag": "committee:happy-hikers"
        },
        {
            "type": "name-prefix",
            "pattern": "Games!:",
            "tag": "committee:games"
        },
        {
            "type": "name-prefix",
            "pattern": "Wine Appreciation:",
            "tag": "committee:wine-appreciation"
        },
        {
            "type": "name-contains",
            "pattern": "wine",
            "tag": "activity:wine"
        },
        {
            "type": "name-contains",
            "pattern": "hike",
            "tag": "activity:outdoors"
        },
        {
            "type": "name-contains",
            "pattern": "dinner",
            "tag": "activity:food"
        }
    ],

    "derived_fields": {
        "time_of_day": {
            "morning": {"before": 12},
            "afternoon": {"from": 12, "before": 17},
            "evening": {"from": 17}
        }
    }
}
```

Secure the config file:

```bash
chmod 600 /etc/clubcalendar/config.json
```

---

## Step 5: Test the Sync Script

Run manually to verify:

```bash
cd /opt/clubcalendar/sync
export CLUBCAL_CONFIG_FILE=/etc/clubcalendar/config.json
export CLUBCAL_DEPLOYMENT=custom_server
python3 sync.py
```

Expected output:
```
2025-12-09 10:30:00 [INFO] Loaded config for org: sbnc
2025-12-09 10:30:00 [INFO] Refreshing WA API token
2025-12-09 10:30:01 [INFO] Fetching events from WA API (since 2025-12-09)
2025-12-09 10:30:02 [INFO] Fetched 47 events from WA
2025-12-09 10:30:02 [INFO] Transformed 47 events
2025-12-09 10:30:02 [INFO] Saved events to /var/www/clubcalendar/data/sbnc/events.json
Success: Synced 47 events
Output: https://mail.sbnewcomers.org/clubcalendar/data/sbnc/events.json
```

Verify the JSON file was created:

```bash
ls -la /var/www/clubcalendar/data/sbnc/
cat /var/www/clubcalendar/data/sbnc/events.json | head -20
```

---

## Step 6: Set Up Cron Job

Edit crontab:

```bash
crontab -e
```

Add this line:

```cron
# ClubCalendar sync - every 15 minutes
*/15 * * * * CLUBCAL_CONFIG_FILE=/etc/clubcalendar/config.json CLUBCAL_DEPLOYMENT=custom_server /usr/bin/python3 /opt/clubcalendar/sync/sync.py >> /var/log/clubcalendar-sync.log 2>&1
```

Create log file:

```bash
sudo touch /var/log/clubcalendar-sync.log
sudo chown $USER:$USER /var/log/clubcalendar-sync.log
```

---

## Step 7: Configure Web Server

### Apache

Add to your Apache config or create `/etc/apache2/sites-available/clubcalendar.conf`:

```apache
Alias /clubcalendar /var/www/clubcalendar

<Directory /var/www/clubcalendar>
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted

    # CORS headers for widget
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET"
    Header set Access-Control-Allow-Headers "Content-Type"

    # Cache control for events.json (short cache since it updates often)
    <FilesMatch "events\.json$">
        Header set Cache-Control "max-age=300, public"
    </FilesMatch>

    # Cache control for widget JS (longer cache)
    <FilesMatch "\.js$">
        Header set Cache-Control "max-age=86400, public"
    </FilesMatch>
</Directory>
```

Enable and restart:

```bash
sudo a2enmod headers
sudo a2ensite clubcalendar
sudo systemctl restart apache2
```

### Nginx

Add to your Nginx config:

```nginx
location /clubcalendar {
    alias /var/www/clubcalendar;

    # CORS
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET";

    # Cache control
    location ~* events\.json$ {
        add_header Cache-Control "max-age=300, public";
    }

    location ~* \.js$ {
        add_header Cache-Control "max-age=86400, public";
    }
}
```

Restart:

```bash
sudo systemctl restart nginx
```

---

## Step 8: Install Widget and Admin UI

Copy widget JavaScript:

```bash
cp /path/to/clubcalendar/widget/clubcalendar-widget.js /var/www/clubcalendar/widget/
```

Copy admin UI:

```bash
cp /path/to/clubcalendar/admin/index.html /var/www/clubcalendar/admin/
```

---

## Step 9: Verify Everything Works

1. **Check events.json is accessible:**
   ```
   curl https://mail.sbnewcomers.org/clubcalendar/data/sbnc/events.json
   ```

2. **Check widget.js is accessible:**
   ```
   curl https://mail.sbnewcomers.org/clubcalendar/widget/clubcalendar-widget.js | head
   ```

3. **Check admin UI:**
   Open in browser: `https://mail.sbnewcomers.org/clubcalendar/admin/`

---

## Step 10: Whitelist Your Server in Wild Apricot

Before embedding external JavaScript, you must add your server to Wild Apricot's authorized domains list.

1. Log into Wild Apricot admin

2. Go to **Settings** → **Site** → **Global settings**

3. Scroll to **External JavaScript authorization**

4. Click **Add URL**

5. Enter your server domain: `https://mail.sbnewcomers.org`

6. Click **Save**

Without this step, Wild Apricot will block the widget JavaScript from loading.

---

## Step 11: Embed in Wild Apricot

1. In WA, edit the page where you want the calendar

2. Add a **Code** or **HTML** gadget

3. Paste:

```html
<!-- ClubCalendar Widget -->
<div id="clubcalendar"></div>
<script>
window.CLUBCALENDAR_CONFIG = {
    eventsUrl: 'https://mail.sbnewcomers.org/clubcalendar/data/sbnc/events.json',
    title: 'Find Events',
    primaryColor: '#2c5aa0'
};
</script>
<script src="https://mail.sbnewcomers.org/clubcalendar/widget/clubcalendar-widget.js"></script>
```

4. Save and preview

---

## Maintenance

### Viewing Logs

```bash
# Recent sync activity
tail -50 /var/log/clubcalendar-sync.log

# Watch live
tail -f /var/log/clubcalendar-sync.log
```

### Manually Triggering Sync

```bash
cd /opt/clubcalendar/sync
CLUBCAL_CONFIG_FILE=/etc/clubcalendar/config.json CLUBCAL_DEPLOYMENT=custom_server python3 sync.py
```

### Updating Configuration

1. Edit `/etc/clubcalendar/config.json`
2. Changes take effect on next sync (within 15 minutes)

### Updating Widget

```bash
cp /path/to/new/clubcalendar-widget.js /var/www/clubcalendar/widget/
```

### Log Rotation

Create `/etc/logrotate.d/clubcalendar`:

```
/var/log/clubcalendar-sync.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
```

---

## Troubleshooting

### Sync not running

```bash
# Check cron is running
systemctl status cron

# Check cron logs
grep clubcalendar /var/log/syslog
```

### API authentication failing

- Verify API key in config.json
- Check WA authorized application is still active
- Try regenerating API key in WA

### Events.json not updating

- Check log file for errors
- Verify write permissions on data directory
- Run sync manually to see errors

### Widget not loading

- Check browser console for errors
- Verify CORS headers are set
- Check events.json URL is accessible

---

## File Reference

| File | Purpose |
|------|---------|
| `/etc/clubcalendar/config.json` | Main configuration |
| `/opt/clubcalendar/sync/sync.py` | Main sync script |
| `/opt/clubcalendar/sync/config.py` | Configuration loader |
| `/opt/clubcalendar/sync/storage.py` | Storage abstraction |
| `/var/www/clubcalendar/data/{org}/events.json` | Generated events file |
| `/var/www/clubcalendar/widget/clubcalendar-widget.js` | Widget JavaScript |
| `/var/www/clubcalendar/admin/index.html` | Admin configuration UI |
| `/var/log/clubcalendar-sync.log` | Sync log file |

---

*This guide is for ClubCalendar v1.0*
