# ClubCalendar

A customizable event calendar widget for Wild Apricot organizations.

ClubCalendar provides an enhanced calendar experience for Wild Apricot users with powerful filtering, modern design, and easy customization—all while keeping your event data in Wild Apricot where it belongs.

## Features

- **Smart Filtering** - Filter events by activity type, time of day, availability, and more
- **Auto-Tagging** - Automatically categorize events based on naming patterns
- **Modern Design** - Clean, responsive calendar that matches your site's look
- **Easy Setup** - Simple embed code for any Wild Apricot page
- **Read-Only** - Never modifies your Wild Apricot data
- **Flexible Hosting** - Deploy on Google Cloud (free tier) or your own server

## How It Works

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Wild Apricot   │      │   Sync Job      │      │   Your Site     │
│    Events       │ ───► │  (every 15 min) │ ───► │   Calendar      │
│                 │      │                 │      │   Widget        │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

1. **Sync Job** fetches events from Wild Apricot API every 15 minutes
2. Events are transformed, auto-tagged, and saved as a JSON file
3. **Widget** loads the JSON and displays an interactive calendar
4. Visitors filter and browse events without touching your WA data

## Quick Start

### Option 1: Custom Server (Simpler)

Best for organizations with an existing web server.

1. Copy sync scripts to your server
2. Configure Wild Apricot API credentials
3. Set up cron job (every 15 minutes)
4. Embed widget in Wild Apricot

See [Custom Server Setup Guide](docs/Custom_Server_Setup_Guide.md)

### Option 2: Google Cloud (Free Tier)

Best for organizations without a server, uses Google's free tier.

1. Create Google Cloud project
2. Deploy Cloud Function
3. Set up Cloud Scheduler
4. Embed widget in Wild Apricot

See [Google Cloud Setup Guide](docs/Google_Cloud_Setup_Guide.md)

## Documentation

| Document | Description |
|----------|-------------|
| [Wild Apricot Installation](docs/Wild_Apricot_Installation_Guide.md) | Step-by-step widget installation in WA |
| [Product Architecture](docs/ClubCalendar_Product_Architecture.md) | Full technical architecture and design |
| [Custom Server Setup](docs/Custom_Server_Setup_Guide.md) | Deploy on your own Linux server |
| [Google Cloud Setup](docs/Google_Cloud_Setup_Guide.md) | Deploy on Google Cloud free tier |
| [Event Tagging Guide](docs/Event_Tagging_Guide.md) | How to tag events for filtering |
| [JSON Schema](docs/events_json_schema.md) | Events.json file format reference |

## Project Structure

```
clubcalendar/
├── README.md                 # This file
├── docs/                     # Documentation
│   ├── ClubCalendar_Product_Architecture.md
│   ├── Custom_Server_Setup_Guide.md
│   ├── Google_Cloud_Setup_Guide.md
│   ├── Event_Tagging_Guide.md
│   └── events_json_schema.md
├── sync/                     # Python sync job
│   ├── sync.py              # Main sync logic
│   ├── config.py            # Configuration loader
│   ├── storage.py           # Storage backends (GCS/local)
│   ├── main.py              # Cloud Function entry point
│   ├── requirements.txt     # Full dependencies
│   └── requirements-custom.txt  # Custom server deps only
├── widget/                   # JavaScript calendar widget
│   └── clubcalendar-widget.js
├── admin/                    # Configuration UI
│   └── index.html
└── site/                     # Project website (GitHub Pages)
    └── index.html
```

## Widget Embed Example

```html
<!-- ClubCalendar Widget -->
<div id="clubcalendar"></div>
<script>
window.CLUBCALENDAR_CONFIG = {
    eventsUrl: 'https://yourserver.com/clubcalendar/data/yourorg/events.json',
    title: 'Find Events',
    primaryColor: '#2c5aa0'
};
</script>
<script src="https://yourserver.com/clubcalendar/widget/clubcalendar-widget.js"></script>
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `eventsUrl` | (required) | URL to your events.json file |
| `title` | "Find Events" | Widget header title |
| `primaryColor` | "#2c5aa0" | Primary accent color |
| `showFilters` | true | Show filter sidebar |
| `defaultView` | "dayGridMonth" | Initial calendar view |
| `filterCategories` | (all) | Which filter groups to show |

## Requirements

### Sync Job
- Python 3.8+
- `requests` library
- Cron (or Cloud Scheduler)
- Wild Apricot API credentials

### Widget
- Modern browser (Chrome, Firefox, Safari, Edge)
- Wild Apricot site with HTML/Code gadget support

## Wild Apricot Setup

Before embedding the widget, you must whitelist your hosting domain:

1. Go to **Settings** → **Site** → **Global settings**
2. Scroll to **External JavaScript authorization**
3. Add your domain (e.g., `https://yourserver.com` or `https://storage.googleapis.com`)
4. Save

## License

MIT License - See [LICENSE](LICENSE)

## Contributing

Contributions welcome! Please read the architecture documentation before submitting changes.

## Support

- [Open an issue](https://github.com/yourorg/clubcalendar/issues) for bugs or feature requests
- See [Event Tagging Guide](docs/Event_Tagging_Guide.md) for tagging best practices

---

*ClubCalendar is designed for Wild Apricot organizations who want more from their event calendar.*
