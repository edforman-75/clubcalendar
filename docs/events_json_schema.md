# ClubCalendar Events JSON Schema

This document defines the JSON schema for the `events.json` file that the sync job produces and the widget consumes.

---

## File Location

The file is hosted at a URL configured per organization:

- **Google Cloud Storage**: `https://storage.googleapis.com/[bucket]/[org-id]/events.json`
- **Custom Server**: `https://[server]/clubcalendar/data/events.json`

---

## Schema

```json
{
  "_warning": "This file is auto-generated. Do not edit manually.",
  "_generated": "2025-12-09T15:30:00Z",
  "_orgId": "sbnc",
  "eventCount": 47,
  "events": [
    {
      "id": 12345,
      "name": "Happy Hikers: Morning Trail Walk",
      "start": "2025-12-15T09:00:00-08:00",
      "end": "2025-12-15T11:00:00-08:00",
      "location": "Elings Park, Santa Barbara",
      "description": "<p>Join us for a moderate 3-mile hike...</p>",
      "url": "https://sbnewcomers.org/event-12345",
      "registrationUrl": "https://sbnewcomers.org/event-12345#registration",
      "tags": [
        "committee:happy-hikers",
        "activity:outdoors",
        "newbie-friendly",
        "time:morning",
        "day:weekend",
        "availability:open"
      ],
      "spotsAvailable": 12,
      "isFull": false,
      "registrationEnabled": true,
      "accessLevel": "Public"
    }
  ]
}
```

---

## Field Reference

### Root Object

| Field | Type | Description |
|-------|------|-------------|
| `_warning` | string | Human-readable warning not to edit |
| `_generated` | string (ISO 8601) | When the file was generated |
| `_orgId` | string | Organization identifier |
| `eventCount` | integer | Number of events in the file |
| `events` | array | Array of event objects |

### Event Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | Yes | Wild Apricot event ID |
| `name` | string | Yes | Event title |
| `start` | string (ISO 8601) | Yes | Start date/time with timezone |
| `end` | string (ISO 8601) | Yes | End date/time with timezone |
| `location` | string | No | Event location |
| `description` | string (HTML) | No | Event description (may contain HTML) |
| `url` | string (URL) | Yes | Link to event details page |
| `registrationUrl` | string (URL) | No | Direct link to registration |
| `tags` | array of strings | Yes | Combined manual + auto-generated tags |
| `spotsAvailable` | integer or null | No | Number of spots remaining (null = unlimited) |
| `isFull` | boolean | Yes | True if event is at capacity |
| `registrationEnabled` | boolean | Yes | Whether registration is open |
| `accessLevel` | string | Yes | "Public" or "MembersOnly" |

---

## Tag Format

Tags follow a `category:value` format for structured data:

```
activity:hiking
committee:happy-hikers
cost:under-25
time:morning
availability:open
```

Simple boolean tags use single words:

```
newbie-friendly
public-event
outdoor
```

### Standard Tag Categories

| Category | Description | Example Values |
|----------|-------------|----------------|
| `activity` | Type of activity | hiking, wine, food, arts, games, fitness |
| `committee` | Organizing group | happy-hikers, games, wine-appreciation |
| `cost` | Price range | free, under-25, under-50, over-100 |
| `time` | Time of day | morning, afternoon, evening |
| `day` | Day of week | weekend, weekday |
| `availability` | Registration status | open, limited, full |
| `level` | Skill level | beginner, intermediate, advanced |
| `location` | Indoor/outdoor | indoor, outdoor |

### Auto-Generated Tags

These tags are derived automatically by the sync job:

| Tag | Logic |
|-----|-------|
| `time:morning` | Start time before 12:00 PM |
| `time:afternoon` | Start time 12:00 PM - 5:00 PM |
| `time:evening` | Start time after 5:00 PM |
| `day:weekend` | Event on Saturday or Sunday |
| `availability:open` | More than 5 spots available or unlimited |
| `availability:limited` | 1-5 spots remaining |
| `availability:full` | No spots available |

---

## Example: Full File

```json
{
  "_warning": "This file is auto-generated every 15 minutes. Do not edit manually.",
  "_generated": "2025-12-09T15:30:00Z",
  "_orgId": "sbnc",
  "eventCount": 3,
  "events": [
    {
      "id": 12345,
      "name": "Happy Hikers: Morning Trail Walk",
      "start": "2025-12-15T09:00:00-08:00",
      "end": "2025-12-15T11:00:00-08:00",
      "location": "Elings Park",
      "description": "<p>A moderate 3-mile hike with ocean views.</p>",
      "url": "https://sbnewcomers.org/event-12345",
      "registrationUrl": "https://sbnewcomers.org/event-12345#registration",
      "tags": [
        "committee:happy-hikers",
        "activity:outdoors",
        "newbie-friendly",
        "cost:free",
        "time:morning",
        "day:weekend",
        "availability:open"
      ],
      "spotsAvailable": 12,
      "isFull": false,
      "registrationEnabled": true,
      "accessLevel": "Public"
    },
    {
      "id": 12346,
      "name": "Wine Appreciation: Holiday Tasting",
      "start": "2025-12-18T18:00:00-08:00",
      "end": "2025-12-18T20:00:00-08:00",
      "location": "Member's Home",
      "description": "<p>Sample wines from local vineyards.</p>",
      "url": "https://sbnewcomers.org/event-12346",
      "registrationUrl": "https://sbnewcomers.org/event-12346#registration",
      "tags": [
        "committee:wine-appreciation",
        "activity:wine",
        "cost:under-50",
        "time:evening",
        "availability:limited"
      ],
      "spotsAvailable": 3,
      "isFull": false,
      "registrationEnabled": true,
      "accessLevel": "MembersOnly"
    },
    {
      "id": 12347,
      "name": "Games!: Friday Night Board Games",
      "start": "2025-12-20T19:00:00-08:00",
      "end": "2025-12-20T22:00:00-08:00",
      "location": "Community Center",
      "description": "<p>Join us for an evening of board games!</p>",
      "url": "https://sbnewcomers.org/event-12347",
      "registrationUrl": "https://sbnewcomers.org/event-12347#registration",
      "tags": [
        "committee:games",
        "activity:games",
        "newbie-friendly",
        "cost:free",
        "indoor",
        "time:evening",
        "day:weekend",
        "availability:full"
      ],
      "spotsAvailable": 0,
      "isFull": true,
      "registrationEnabled": true,
      "accessLevel": "Public"
    }
  ]
}
```

---

## Widget Consumption

The widget fetches this file and:

1. Parses the `events` array
2. Builds filter options from unique tag values
3. Renders the calendar with FullCalendar
4. Filters events client-side based on selected tags

### Filter Matching Logic

When a user selects a filter, the widget shows events that have the matching tag:

```javascript
// User selects "Outdoors" from Interest Area dropdown
// Widget filters to events where tags.includes("activity:outdoors")

function matchesFilters(event, selectedFilters) {
  return selectedFilters.every(filter =>
    event.tags.includes(filter)
  );
}
```

---

## Versioning

If the schema changes significantly, the file will include a version field:

```json
{
  "_schemaVersion": "1.0",
  ...
}
```

Widgets should check this version and display a warning if incompatible.
