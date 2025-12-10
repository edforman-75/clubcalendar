# ClubCalendar Product Architecture

**Product Name:** ClubCalendar
**Version:** 0.1.0 (Design Phase)
**Last Updated:** December 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Product Vision](#product-vision)
3. [Architecture](#architecture)
4. [Components](#components)
5. [Data Flow](#data-flow)
6. [Configuration](#configuration)
7. [Deployment Options](#deployment-options)
8. [Tag Conventions](#tag-conventions)
9. [Admin Interface](#admin-interface)
10. [Technical Requirements](#technical-requirements)

---

## Overview

ClubCalendar is a configurable, filterable event calendar widget designed for Wild Apricot organizations. It provides rich filtering capabilities that Wild Apricot's built-in calendar lacks, while being simple enough for non-technical club administrators to configure.

### Key Principles

- **Read-only**: Never modifies data in Wild Apricot
- **Configurable**: Administrators can customize filters, colors, and behavior without code changes
- **Flexible hosting**: Works with Google Cloud (recommended) or custom servers
- **Progressive disclosure**: Simple settings visible by default, advanced settings available on demand
- **Community-focused**: Designed for clubs, associations, and membership organizations

---

## Product Vision

### Problem Statement

Wild Apricot's built-in event calendar shows all events in a simple list with no filtering. For active organizations with many events, members struggle to find events that match their interests, schedule, and availability.

### Solution

ClubCalendar adds powerful filtering on top of Wild Apricot event data:

- Filter by interest area, committee, time of day, cost, availability
- Quick-filter buttons for common needs (weekend, free, has openings)
- Visual indicators for event status and availability
- Works for both logged-in members and public visitors

### Target Users

1. **Club Administrators**: Configure the widget, define filters, manage settings
2. **Event Organizers**: Add tags to events when creating them in WA
3. **Members**: Use the calendar to discover and filter events
4. **Public Visitors**: Browse public events to learn about the organization

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GOOGLE CLOUD (Free Tier)                            │
│                                                                             │
│  ┌─────────────────┐       ┌──────────────────────────────────────────┐    │
│  │ Cloud Scheduler │       │ Cloud Function: Sync Job                 │    │
│  │ (every 15 min)  │──────▶│ - Fetches events from WA API             │    │
│  └─────────────────┘       │ - Reads config from Firestore            │    │
│                            │ - Applies auto-tagging rules             │    │
│  ┌─────────────────┐       │ - Writes JSON to Cloud Storage           │    │
│  │ Cloud Function: │       └──────────────────────────────────────────┘    │
│  │ Admin UI        │                         │                              │
│  │ - Config forms  │                         ▼                              │
│  │ - Preview       │       ┌──────────────────────────────────────────┐    │
│  └────────┬────────┘       │ Cloud Storage                            │    │
│           │                │ - events.json (public read)              │    │
│           ▼                │ - widget.js (optional)                   │    │
│  ┌─────────────────┐       └──────────────────────────────────────────┘    │
│  │ Firestore       │                         │                              │
│  │ - Organization  │                         │                              │
│  │   configs       │                         │                              │
│  └─────────────────┘                         │                              │
└──────────────────────────────────────────────┼──────────────────────────────┘
                                               │
                      ┌────────────────────────┼────────────────────────┐
                      │                        ▼                        │
                      │  ┌──────────────────────────────────────────┐  │
                      │  │ Wild Apricot Website                     │  │
                      │  │                                          │  │
                      │  │  ┌────────────────────────────────────┐  │  │
                      │  │  │ ClubCalendar Widget                │  │  │
                      │  │  │ - Fetches events.json              │  │  │
                      │  │  │ - Renders filterable calendar      │  │  │
                      │  │  └────────────────────────────────────┘  │  │
                      │  │                                          │  │
                      │  │  Optional: widget.js in WA Resources     │  │
                      │  └──────────────────────────────────────────┘  │
                      │                                                │
                      │               WILD APRICOT                     │
                      └────────────────────────────────────────────────┘
```

### Alternative: Custom Server Architecture

For organizations preferring their own server (like mail.sbnewcomers.org):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CUSTOM SERVER                                       │
│                                                                             │
│  ┌─────────────────┐       ┌──────────────────────────────────────────┐    │
│  │ Cron Job        │       │ Sync Script (Python/Node)                │    │
│  │ (every 15 min)  │──────▶│ - Fetches events from WA API             │    │
│  └─────────────────┘       │ - Reads config.json                      │    │
│                            │ - Applies auto-tagging rules             │    │
│  ┌─────────────────┐       │ - Writes events.json                     │    │
│  │ Admin UI        │       └──────────────────────────────────────────┘    │
│  │ (Web app)       │                         │                              │
│  └────────┬────────┘                         ▼                              │
│           │                ┌──────────────────────────────────────────┐    │
│           ▼                │ Static Files (served via HTTP)           │    │
│  ┌─────────────────┐       │ - /data/events.json                      │    │
│  │ config.json     │       │ - /widget/clubcalendar-widget.js         │    │
│  └─────────────────┘       └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Sync Job (Cron)

**Purpose:** Fetches events from Wild Apricot API, applies transformations, outputs JSON

**Runs:** Every 15 minutes (configurable)

**Inputs:**
- WA API credentials (account ID, API key)
- Configuration (auto-tag rules, filter settings)

**Outputs:**
- `events.json` - Event data with tags, ready for widget consumption

**Key Functions:**
- Authenticate with WA API
- Fetch all upcoming events
- Extract existing WA tags
- Apply auto-tagging rules (e.g., derive committee from event name)
- Calculate derived fields (time of day, availability status)
- Write JSON to storage

### 2. Widget (JavaScript)

**Purpose:** Renders filterable calendar in the browser

**Hosted:** WA Resources, Google Cloud Storage, or CDN (customer choice)

**Inputs:**
- `events.json` URL
- Configuration (inline or fetched)

**Features:**
- Multiple views (month, week, list)
- Filter dropdowns and quick-filter buttons
- Event popup with details
- Responsive design
- WA theme integration

### 3. Admin Configuration UI

**Purpose:** Allow non-technical admins to configure the widget

**Hosted:** Google Cloud Function or custom server

**Sections:**

**Simple (visible by default):**
- Enable/disable filter types
- Customize labels
- Choose colors
- Select quick-filter buttons
- Set widget title

**Advanced (click to expand):**
- Add new tag categories
- Define auto-tagging rules
- Committee name mappings
- Interest keyword mappings
- API settings (refresh interval)
- JSON/widget hosting URLs

### 4. Configuration Storage

**Purpose:** Persist admin settings

**Options:**
- Google Firestore (for Google Cloud deployment)
- JSON file (for custom server deployment)

---

## Data Flow

### Event Data Flow

```
WA Event Created (with tags)
         │
         ▼
┌─────────────────────────┐
│ Wild Apricot Database   │
│ - Event details         │
│ - Manual tags           │
│ - Registration info     │
└───────────┬─────────────┘
            │
            │ WA API (every 15 min)
            ▼
┌─────────────────────────┐
│ Sync Job                │
│ - Fetch events          │
│ - Apply auto-tag rules  │
│ - Calculate derived     │
│   fields                │
└───────────┬─────────────┘
            │
            │ Write JSON
            ▼
┌─────────────────────────┐
│ events.json             │
│ - Event data            │
│ - Combined tags         │
│ - Derived fields        │
└───────────┬─────────────┘
            │
            │ Fetch (browser)
            ▼
┌─────────────────────────┐
│ ClubCalendar Widget     │
│ - Parse JSON            │
│ - Build filter options  │
│ - Render calendar       │
└─────────────────────────┘
```

### Configuration Flow

```
Admin opens Config UI
         │
         ▼
┌─────────────────────────┐
│ Admin UI                │
│ - Load current config   │
│ - Display forms         │
│ - Validate input        │
└───────────┬─────────────┘
            │
            │ Save
            ▼
┌─────────────────────────┐
│ Config Storage          │
│ (Firestore or JSON)     │
└───────────┬─────────────┘
            │
            │ Read (next sync)
            ▼
┌─────────────────────────┐
│ Sync Job                │
│ - Apply new rules       │
│ - Update events.json    │
└─────────────────────────┘
```

---

## Configuration

### Configuration Schema

```json
{
  "organization": {
    "name": "Santa Barbara Newcomers Club",
    "waAccountId": "123456",
    "timezone": "America/Los_Angeles"
  },

  "sync": {
    "intervalMinutes": 15,
    "eventsJsonUrl": "https://storage.googleapis.com/clubcalendar-org123/events.json",
    "widgetJsUrl": "https://storage.googleapis.com/clubcalendar-org123/widget.js"
  },

  "widget": {
    "title": "Find Events",
    "primaryColor": "#2c5aa0",
    "accentColor": "#d4a800",
    "defaultView": "month"
  },

  "filters": {
    "interestArea": {
      "enabled": true,
      "label": "Interest Area",
      "options": [
        {"id": "food", "label": "Food & Dining"},
        {"id": "outdoors", "label": "Outdoors & Hiking"},
        {"id": "arts", "label": "Arts & Culture"}
      ]
    },
    "committee": {
      "enabled": true,
      "label": "Committee",
      "options": [
        {"id": "happy-hikers", "label": "Happy Hikers"},
        {"id": "games", "label": "Games!"}
      ]
    },
    "cost": {
      "enabled": true,
      "label": "Cost",
      "options": [
        {"id": "free", "label": "Free"},
        {"id": "under-25", "label": "Under $25"},
        {"id": "under-50", "label": "Under $50"}
      ]
    }
  },

  "quickFilters": [
    {"id": "weekend", "label": "Weekend", "enabled": true},
    {"id": "free", "label": "Free", "enabled": true},
    {"id": "has-openings", "label": "Has Openings", "enabled": true},
    {"id": "newbie-friendly", "label": "Newbie Friendly", "enabled": true}
  ],

  "autoTagRules": [
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
      "type": "name-contains",
      "pattern": "hike",
      "tag": "activity:outdoors"
    },
    {
      "type": "name-contains",
      "pattern": "wine",
      "tag": "activity:wine"
    }
  ],

  "derivedFields": {
    "timeOfDay": {
      "morning": {"before": 12},
      "afternoon": {"from": 12, "before": 17},
      "evening": {"from": 17}
    },
    "costCategory": {
      "free": {"maxPrice": 0},
      "under-25": {"maxPrice": 25},
      "under-50": {"maxPrice": 50}
    }
  }
}
```

---

## Deployment Options

### Option 1: Google Cloud (Recommended)

**Best for:** Most organizations, especially those without technical staff

**Components:**
- Cloud Scheduler (triggers sync every 15 min)
- Cloud Functions (sync job + admin UI)
- Firestore (configuration storage)
- Cloud Storage (events.json hosting)

**Cost:** Free for typical club usage

**Setup:** Guided wizard in admin UI

### Option 2: Custom Server

**Best for:** Organizations with existing infrastructure or specific requirements

**Components:**
- Cron job on server (e.g., Linux crontab)
- Python/Node sync script
- JSON config file
- Static file hosting (Apache/Nginx)

**Cost:** Depends on existing infrastructure

**Setup:** Manual installation with documentation

### Widget Hosting Options

| Option | Pros | Cons |
|--------|------|------|
| WA Resources | Pure WA, org controls it | Manual upload for updates |
| Google Cloud Storage | Auto-updated, versioned | External URL |
| CDN (jsDelivr) | Fast, global, versioned | Requires npm/GitHub publish |
| Custom Server | Full control | Org maintains it |

---

## Tag Conventions

### Tag Format

Tags use a `category:value` format for structured data:

```
activity:hiking
activity:wine
committee:happy-hikers
cost:free
cost:under-50
level:beginner
```

Simple boolean tags use a single word:

```
newbie-friendly
public-event
outdoor
morning
```

### Standard Tag Categories

| Category | Purpose | Example Values |
|----------|---------|----------------|
| `activity` | Interest/activity type | hiking, wine, food, arts, games |
| `committee` | Organizing committee | happy-hikers, games, wine-appreciation |
| `cost` | Price range | free, under-25, under-50, over-100 |
| `level` | Skill/experience level | beginner, intermediate, advanced |
| `location` | Indoor/outdoor | indoor, outdoor, both |

### Auto-Derived Tags

These are calculated by the sync job, not entered manually:

| Tag | Derived From |
|-----|--------------|
| `time:morning` | Event start time before 12pm |
| `time:afternoon` | Event start time 12pm-5pm |
| `time:evening` | Event start time after 5pm |
| `availability:open` | Spots available |
| `availability:limited` | Less than 5 spots |
| `availability:full` | No spots available |
| `day:weekend` | Event on Saturday or Sunday |

---

## Admin Interface

### Simple Section (Default View)

```
┌─────────────────────────────────────────────────────────────────┐
│  ClubCalendar Configuration                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Widget Title: [Find Events                    ]                │
│                                                                 │
│  Colors:                                                        │
│  Primary: [#2c5aa0] [████]    Accent: [#d4a800] [████]          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Filters to Show:                                               │
│  ☑ Interest Area     ☑ Committee     ☑ Cost                    │
│  ☑ Time of Day       ☑ Availability                            │
│                                                                 │
│  Quick Filter Buttons:                                          │
│  ☑ Weekend    ☑ Free    ☑ Has Openings    ☑ Newbie Friendly    │
│  ☐ After Hours    ☐ Public Events    ☐ Morning Only            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [▶ Advanced Settings]                                          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Save Configuration]              [Preview Widget]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Advanced Section (Expanded)

```
┌─────────────────────────────────────────────────────────────────┐
│  [▼ Advanced Settings]                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FILTER OPTIONS                                                 │
│  ─────────────────                                              │
│  Interest Area Options:                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ID           │ Label           │ [Remove]               │   │
│  │ food         │ Food & Dining   │ [×]                    │   │
│  │ outdoors     │ Outdoors        │ [×]                    │   │
│  │ arts         │ Arts & Culture  │ [×]                    │   │
│  │ [+ Add Option]                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  AUTO-TAGGING RULES                                             │
│  ──────────────────                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ If event name starts with "Happy Hikers:"               │   │
│  │ Then add tag: committee:happy-hikers          [×]       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ If event name contains "wine"                           │   │
│  │ Then add tag: activity:wine                   [×]       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ [+ Add Rule]                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  API SETTINGS                                                   │
│  ────────────                                                   │
│  WA Account ID: [123456        ]                                │
│  Sync Interval: [15] minutes                                    │
│  Events JSON URL: [https://storage.googleapis.com/...]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Requirements

### For Google Cloud Deployment

- Google Cloud account (free tier sufficient)
- WA API credentials (Admin API key)
- Domain for admin UI (optional, can use Cloud Function URL)

### For Custom Server Deployment

- Linux server with cron
- Python 3.8+ or Node.js 16+
- HTTPS-enabled web server
- WA API credentials

### Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Dependencies

**Sync Job:**
- Python: `requests`, `google-cloud-storage`, `google-cloud-firestore`
- Node: `axios`, `@google-cloud/storage`, `@google-cloud/firestore`

**Widget:**
- FullCalendar 6.x (loaded from CDN)
- No jQuery required (optional for compatibility)

---

## Next Steps

1. **Define JSON schema** for events.json output file
2. **Create tag naming guide** for event organizers
3. **Prototype sync job** for Google Cloud Functions
4. **Prototype admin UI** with simple section
5. **Adapt existing widget** to use new JSON format

---

*This document defines the architecture for ClubCalendar. It will be updated as the design evolves.*
