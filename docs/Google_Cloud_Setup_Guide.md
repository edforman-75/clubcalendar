# ClubCalendar Google Cloud Setup Guide

This guide walks you through setting up ClubCalendar on Google Cloud Platform (free tier).

---

## Prerequisites

Before you begin, you'll need:

1. **Google Account** - Any Gmail account works
2. **Wild Apricot Admin Access** - To get API credentials
3. **30 minutes** - For initial setup

---

## Overview

You'll set up these components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Project                     │
│                                                             │
│  1. Cloud Storage    ─── Hosts events.json file             │
│  2. Cloud Function   ─── Syncs events from WA               │
│  3. Cloud Scheduler  ─── Triggers sync every 15 min         │
│  4. Firestore        ─── Stores your configuration          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Estimated Cost:** $0/month (free tier covers typical club usage)

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Click **Select a project** (top left) → **New Project**

3. Enter project details:
   - **Project name:** `clubcalendar-yourorg` (e.g., `clubcalendar-sbnc`)
   - **Organization:** Leave as default

4. Click **Create**

5. Wait for project creation, then select your new project

---

## Step 2: Enable Required APIs

1. Go to **APIs & Services** → **Library**

2. Search for and enable each of these:
   - **Cloud Functions API**
   - **Cloud Scheduler API**
   - **Cloud Storage API**
   - **Cloud Firestore API**
   - **Cloud Build API**

For each, click the API name → **Enable**

---

## Step 3: Get Wild Apricot API Credentials

1. Log into your Wild Apricot admin

2. Go to **Settings** → **Authorized applications**

3. Click **Authorize application**

4. Fill in:
   - **Application name:** ClubCalendar Sync
   - **Permissions:** Check all read permissions for Events, Contacts

5. Click **Authorize**

6. Copy and save:
   - **API key** (you'll need this later)
   - **Client ID**
   - **Client secret**

7. Also note your **Account ID** from Settings → General

---

## Step 4: Create Cloud Storage Bucket

1. Go to **Cloud Storage** → **Buckets**

2. Click **Create bucket**

3. Configure:
   - **Name:** `clubcalendar-yourorg-data` (must be globally unique)
   - **Location type:** Region
   - **Location:** Choose nearest to your members (e.g., `us-west1`)
   - **Storage class:** Standard
   - **Access control:** Fine-grained

4. Click **Create**

5. After creation, click your bucket → **Permissions** tab

6. Click **Grant Access**:
   - **Principal:** `allUsers`
   - **Role:** Storage Object Viewer

7. Confirm to make bucket publicly readable

---

## Step 5: Set Up Firestore Database

1. Go to **Firestore Database**

2. Click **Create database**

3. Choose:
   - **Native mode** (not Datastore mode)
   - **Location:** Same region as your bucket

4. Click **Create**

---

## Step 6: Deploy the Sync Function

### Option A: Using Google Cloud Console (Easier)

1. Go to **Cloud Functions** → **Create function**

2. Configure basics:
   - **Function name:** `clubcalendar-sync`
   - **Region:** Same as your bucket
   - **Trigger type:** HTTP
   - **Authentication:** Allow unauthenticated (we'll secure with Scheduler)

3. Click **Next**

4. Configure code:
   - **Runtime:** Python 3.11
   - **Entry point:** `sync_events`

5. Replace the code in `main.py` with the contents from:
   `/Users/edf/wa-dev/clubcalendar/sync/main.py`

6. Replace `requirements.txt` with:
   ```
   functions-framework==3.*
   requests>=2.28.0
   google-cloud-storage>=2.10.0
   google-cloud-firestore>=2.11.0
   ```

7. Click **Deploy**

### Option B: Using gcloud CLI (Advanced)

```bash
# Install gcloud CLI if needed
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project clubcalendar-yourorg

# Deploy function
cd /path/to/clubcalendar/sync
gcloud functions deploy clubcalendar-sync \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-west1 \
  --set-env-vars "WA_ACCOUNT_ID=YOUR_ID,WA_API_KEY=YOUR_KEY,GCS_BUCKET=clubcalendar-yourorg-data,ORG_ID=yourorg"
```

---

## Step 7: Configure Environment Variables

1. Go to **Cloud Functions** → Click your function

2. Click **Edit**

3. Go to **Runtime, build, connections and security settings**

4. Under **Runtime environment variables**, add:

| Variable | Value |
|----------|-------|
| `WA_ACCOUNT_ID` | Your WA account ID (e.g., `123456`) |
| `WA_API_KEY` | Your WA API key |
| `GCS_BUCKET` | Your bucket name (e.g., `clubcalendar-yourorg-data`) |
| `ORG_ID` | Your org identifier (e.g., `sbnc`) |

5. Click **Next** → **Deploy**

---

## Step 8: Set Up Cloud Scheduler

1. Go to **Cloud Scheduler** → **Create job**

2. Configure:
   - **Name:** `clubcalendar-sync-trigger`
   - **Region:** Same as your function
   - **Frequency:** `*/15 * * * *` (every 15 minutes)
   - **Timezone:** Your timezone (e.g., `America/Los_Angeles`)

3. Configure target:
   - **Target type:** HTTP
   - **URL:** Your function URL (from Cloud Functions → your function → Trigger tab)
   - **HTTP method:** GET

4. Click **Create**

---

## Step 9: Test the Setup

1. Go to **Cloud Scheduler**

2. Find your job and click **Run now**

3. Check results:
   - **Cloud Functions** → Your function → **Logs** tab
   - Should see "Successfully synced X events"

4. Verify the JSON file:
   - Go to **Cloud Storage** → Your bucket
   - Should see `yourorg/events.json`
   - Click it to verify contents

---

## Step 10: Create Initial Configuration

1. Go to **Firestore Database**

2. Click **Start collection**

3. Create collection:
   - **Collection ID:** `organizations`

4. Add document:
   - **Document ID:** Your org ID (e.g., `sbnc`)

5. Add fields:

```
autoTagRules (array):
  - type: "name-prefix"
    pattern: "Happy Hikers:"
    tag: "committee:happy-hikers"
  - type: "name-contains"
    pattern: "wine"
    tag: "activity:wine"

derivedFields (map):
  timeOfDay (map):
    morning (map):
      before: 12
    afternoon (map):
      from: 12
      before: 17
    evening (map):
      from: 17
```

---

## Step 11: Get Your Widget URLs

After successful setup, your URLs are:

**Events JSON:**
```
https://storage.googleapis.com/clubcalendar-yourorg-data/yourorg/events.json
```

**Widget JavaScript** (if hosted on GCS):
```
https://storage.googleapis.com/clubcalendar-yourorg-data/widget/clubcalendar-widget.js
```

---

## Step 12: Whitelist Google Cloud Storage in Wild Apricot

Before embedding external JavaScript, you must add Google Cloud Storage to Wild Apricot's authorized domains list.

1. Log into Wild Apricot admin

2. Go to **Settings** → **Site** → **Global settings**

3. Scroll to **External JavaScript authorization**

4. Click **Add URL**

5. Enter: `https://storage.googleapis.com`

6. Click **Save**

Without this step, Wild Apricot will block the widget JavaScript from loading.

---

## Step 13: Embed in Wild Apricot

1. In WA, edit the page where you want the calendar

2. Add a **Code** or **HTML** gadget

3. Paste:

```html
<!-- ClubCalendar Widget -->
<div id="clubcalendar"></div>
<script>
window.CLUBCALENDAR_CONFIG = {
    eventsUrl: 'https://storage.googleapis.com/clubcalendar-yourorg-data/yourorg/events.json',
    title: 'Find Events',
    primaryColor: '#2c5aa0'
};
</script>
<script src="https://storage.googleapis.com/clubcalendar-yourorg-data/widget/clubcalendar-widget.js"></script>
```

4. Save and preview

---

## Troubleshooting

### Events not syncing

1. Check Cloud Function logs for errors
2. Verify WA API credentials are correct
3. Ensure API key has read access to Events

### JSON file not accessible

1. Verify bucket permissions (allUsers = Storage Object Viewer)
2. Check bucket and org ID in function environment variables

### Scheduler not running

1. Check job status in Cloud Scheduler
2. Verify function URL is correct
3. Check function logs for errors

### CORS errors in browser

1. Add CORS configuration to bucket:
   ```bash
   gsutil cors set cors.json gs://your-bucket-name
   ```

   With `cors.json`:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET"],
       "responseHeader": ["Content-Type"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

---

## Cost Monitoring

To ensure you stay within free tier:

1. Go to **Billing** → **Budgets & alerts**

2. Create a budget:
   - **Amount:** $1 (or your preferred threshold)
   - **Alerts:** 50%, 90%, 100%

Free tier limits (as of 2024):

| Service | Free Tier |
|---------|-----------|
| Cloud Functions | 2 million invocations/month |
| Cloud Storage | 5 GB storage |
| Cloud Scheduler | 3 jobs free |
| Firestore | 1 GB storage, 50K reads/day |

A typical club running sync every 15 minutes uses:
- ~3,000 function invocations/month
- ~1 MB storage
- 1 scheduler job

**Well within free tier.**

---

## Updating the Sync Function

When you need to update the function code:

1. Go to **Cloud Functions** → Your function

2. Click **Edit**

3. Update the code

4. Click **Next** → **Deploy**

Or with gcloud CLI:

```bash
gcloud functions deploy clubcalendar-sync --source .
```

---

## Support

If you encounter issues:

1. Check Cloud Function logs
2. Verify all environment variables
3. Test the function manually via Cloud Console
4. Check Wild Apricot API status

---

*This guide is for ClubCalendar v1.0*
