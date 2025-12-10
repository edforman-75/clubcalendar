# Wild Apricot Installation Guide

Step-by-step instructions for installing ClubCalendar into your Wild Apricot site.

---

## Prerequisites

Before you begin, ensure you have:

- [ ] Completed either the [Custom Server Setup](Custom_Server_Setup_Guide.md) or [Google Cloud Setup](Google_Cloud_Setup_Guide.md)
- [ ] Your `events.json` URL (e.g., `https://yourserver.com/clubcalendar/data/yourorg/events.json`)
- [ ] Your widget JavaScript URL (e.g., `https://yourserver.com/clubcalendar/widget/clubcalendar-widget.js`)
- [ ] Wild Apricot admin access

---

## Step 1: Whitelist Your External Domain

Wild Apricot blocks external JavaScript by default. You must whitelist your server domain first.

1. Log into Wild Apricot as an administrator

2. Click the **gear icon** (Settings) in the top-right corner

3. In the left sidebar, click **Site** → **Global settings**

4. Scroll down to the **External JavaScript authorization** section

5. Click **Add URL**

6. Enter your server domain:
   - For custom server: `https://mail.sbnewcomers.org` (or your server URL)
   - For Google Cloud: `https://storage.googleapis.com`

7. Click **Save** at the bottom of the page

**Important:** Without this step, the widget will not load.

---

## Step 2: Create a Calendar Page (Optional)

If you want the calendar on a dedicated page:

1. Go to **Website** → **Site pages**

2. Click **Add page**

3. Enter page details:
   - **Page title:** Events Calendar (or your preferred name)
   - **Navigation label:** Events
   - **URL:** events-calendar
   - **Access:** Choose who can view (Public, Members only, etc.)

4. Click **Save**

5. The page opens in edit mode. Continue to Step 3.

---

## Step 3: Add the Calendar Widget

You can add the widget to any page that supports HTML gadgets.

### 3a. Open Page Editor

1. Go to **Website** → **Site pages**

2. Find the page where you want the calendar

3. Click **Edit** next to the page

### 3b. Add HTML/Code Gadget

1. Click where you want the calendar to appear

2. Click **Insert gadget** in the toolbar

3. Select **HTML** (or **Code** depending on your WA version)

4. A code editor dialog opens

### 3c. Paste the Widget Code

Copy and paste the following code into the HTML gadget:

```html
<!-- ClubCalendar Widget -->
<div id="clubcalendar"></div>
<script>
window.CLUBCALENDAR_CONFIG = {
    eventsUrl: 'https://YOUR-SERVER/clubcalendar/data/YOUR-ORG/events.json',
    title: 'Find Events',
    primaryColor: '#2c5aa0'
};
</script>
<script src="https://YOUR-SERVER/clubcalendar/widget/clubcalendar-widget.js"></script>
```

### 3d. Customize the Configuration

Replace the placeholder values:

| Placeholder | Replace With | Example |
|-------------|--------------|---------|
| `YOUR-SERVER` | Your server domain | `mail.sbnewcomers.org` |
| `YOUR-ORG` | Your organization ID | `sbnc` |

**Example for SBNC:**
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

### 3e. Save the Gadget

1. Click **OK** or **Save** in the HTML gadget dialog

2. The widget placeholder appears on the page

3. Click **Publish** to save the page

---

## Step 4: Verify the Installation

1. View your page (not in edit mode)

2. The calendar should load with your events

3. Test the filters on the left sidebar

4. Click an event to see details

**If the calendar doesn't load:**
- Check browser console for errors (F12 → Console)
- Verify the domain is whitelisted (Step 1)
- Verify the `eventsUrl` is correct and accessible
- Try the URL directly in your browser to check if events.json loads

---

## Configuration Options

Customize the widget by adding options to `CLUBCALENDAR_CONFIG`:

```html
<script>
window.CLUBCALENDAR_CONFIG = {
    // Required
    eventsUrl: 'https://mail.sbnewcomers.org/clubcalendar/data/sbnc/events.json',

    // Optional - Appearance
    title: 'Find Events',           // Widget header title
    primaryColor: '#2c5aa0',        // Main accent color (hex code)

    // Optional - Filters
    showFilters: true,              // Show filter sidebar (true/false)
    filterCategories: [             // Which filters to show
        'activity',
        'time',
        'availability',
        'day'
    ],

    // Optional - Calendar
    defaultView: 'dayGridMonth',    // 'dayGridMonth', 'timeGridWeek', 'listWeek'
    showWeekends: true              // Show weekend days (true/false)
};
</script>
```

### Color Examples

| Color | Hex Code | Preview |
|-------|----------|---------|
| Blue (default) | `#2c5aa0` | Club standard |
| Green | `#2e7d32` | Nature/outdoors |
| Purple | `#6a1b9a` | Elegant |
| Orange | `#e65100` | Energetic |
| Teal | `#00796b` | Fresh |

---

## Adding Calendar to Multiple Pages

You can add the calendar widget to multiple pages:

1. **Home page** - Show upcoming events
2. **Dedicated events page** - Full calendar with filters
3. **Activity pages** - Pre-filtered by activity type

### Pre-filtered Calendar Example

To show only hiking events on a hiking committee page:

```html
<script>
window.CLUBCALENDAR_CONFIG = {
    eventsUrl: 'https://mail.sbnewcomers.org/clubcalendar/data/sbnc/events.json',
    title: 'Hiking Events',
    primaryColor: '#2e7d32',
    defaultFilters: {
        activity: ['hiking', 'outdoors']
    }
};
</script>
```

---

## Adding a Quick Links Section (Optional)

Add a "quick filter" section above the calendar:

```html
<div style="margin-bottom: 20px; text-align: center;">
    <strong>Quick Filters:</strong>
    <a href="#" onclick="filterByTag('activity:hiking'); return false;">Hiking</a> |
    <a href="#" onclick="filterByTag('activity:wine'); return false;">Wine</a> |
    <a href="#" onclick="filterByTag('activity:games'); return false;">Games</a> |
    <a href="#" onclick="clearFilters(); return false;">Show All</a>
</div>

<div id="clubcalendar"></div>

<script>
window.CLUBCALENDAR_CONFIG = {
    eventsUrl: 'https://mail.sbnewcomers.org/clubcalendar/data/sbnc/events.json',
    title: 'Find Events',
    primaryColor: '#2c5aa0'
};

function filterByTag(tag) {
    if (window.clubCalendarWidget) {
        window.clubCalendarWidget.filterByTag(tag);
    }
}

function clearFilters() {
    if (window.clubCalendarWidget) {
        window.clubCalendarWidget.clearFilters();
    }
}
</script>
<script src="https://mail.sbnewcomers.org/clubcalendar/widget/clubcalendar-widget.js"></script>
```

---

## Troubleshooting

### Calendar shows "Loading..." forever

**Cause:** The events.json URL is not accessible

**Fix:**
1. Copy your `eventsUrl` and paste it directly into your browser
2. If it doesn't load, check your server setup
3. Verify the sync job is running (`tail -f /var/log/clubcalendar-sync.log`)

### Calendar shows but is empty

**Cause:** No upcoming events or events are filtered out

**Fix:**
1. Check the date range in your browser's URL bar
2. Verify events exist in Wild Apricot with future dates
3. Check that events aren't marked as CANCELLED

### JavaScript error in console

**Cause:** External domain not whitelisted

**Error message:** `Refused to load script 'https://...' because it violates the Content Security Policy`

**Fix:**
1. Return to Step 1
2. Add the exact domain shown in the error message
3. Save and refresh the page

### Styles look broken

**Cause:** CSS conflicts with Wild Apricot theme

**Fix:** The widget uses isolated styles, but if conflicts occur:
1. Try a different page layout
2. Contact support with screenshots

### Events not updating

**Cause:** Sync job not running or cron stopped

**Fix:**
1. Check sync logs: `tail -50 /var/log/clubcalendar-sync.log`
2. Verify cron is running: `crontab -l`
3. Run sync manually to test:
   ```bash
   cd /opt/clubcalendar/sync
   CLUBCAL_CONFIG_FILE=/etc/clubcalendar/config.json python3 sync.py
   ```

---

## Getting Help

- Check the [Product Architecture](ClubCalendar_Product_Architecture.md) for technical details
- Review the [Event Tagging Guide](Event_Tagging_Guide.md) for tagging best practices
- Open an issue on [GitHub](https://github.com/sbnewcomers/clubcalendar/issues)

---

## Quick Reference

**Widget embed code:**
```html
<div id="clubcalendar"></div>
<script>
window.CLUBCALENDAR_CONFIG = {
    eventsUrl: 'YOUR_EVENTS_JSON_URL',
    title: 'Find Events',
    primaryColor: '#2c5aa0'
};
</script>
<script src="YOUR_WIDGET_JS_URL"></script>
```

**Whitelist location:** Settings → Site → Global settings → External JavaScript authorization

**Gadget type:** HTML or Code gadget

---

*For the latest documentation, visit the [ClubCalendar GitHub repository](https://github.com/sbnewcomers/clubcalendar).*
