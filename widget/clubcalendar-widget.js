/**
 * ClubCalendar Widget
 * ===================
 * A filterable event calendar widget for Wild Apricot organizations.
 *
 * Version: 1.0.0
 *
 * Usage:
 *   <div id="clubcalendar"></div>
 *   <script>
 *     window.CLUBCALENDAR_CONFIG = {
 *       eventsUrl: 'https://storage.googleapis.com/your-bucket/events.json',
 *       container: '#clubcalendar'
 *     };
 *   </script>
 *   <script src="clubcalendar-widget.js"></script>
 */

(function() {
    'use strict';

// =============================================================================
// SECTION 1: CONFIGURATION
// =============================================================================

    /**
     * Default configuration - can be overridden via window.CLUBCALENDAR_CONFIG
     */
    const DEFAULT_CONFIG = {
        // Required
        eventsUrl: '',              // URL to events.json file

        // Container
        container: '#clubcalendar',

        // Display
        title: 'Find Events',
        defaultView: 'dayGridMonth',  // dayGridMonth, listMonth, timeGridWeek

        // Colors
        primaryColor: '#2c5aa0',
        accentColor: '#d4a800',

        // Filters to show
        filters: {
            interestArea: { enabled: true, label: 'Interest Area' },
            committee: { enabled: true, label: 'Committee' },
            cost: { enabled: true, label: 'Cost' },
            timeOfDay: { enabled: true, label: 'Time of Day' }
        },

        // Quick filter buttons
        quickFilters: {
            weekend: { enabled: true, label: 'Weekend' },
            free: { enabled: true, label: 'Free' },
            hasOpenings: { enabled: true, label: 'Has Openings' },
            newbieFriendly: { enabled: true, label: 'Newbie Friendly' }
        },

        // Behavior
        eventClickBehavior: 'popup',  // 'popup', 'link', or 'both'
        showPastEvents: false,

        // Cache
        cacheDurationMinutes: 5
    };

    /** Merged configuration */
    let CONFIG = { ...DEFAULT_CONFIG };

    /** Tag category mappings for filters */
    const TAG_CATEGORIES = {
        interestArea: {
            prefix: 'activity:',
            options: [
                { id: 'food', label: 'Food & Dining' },
                { id: 'wine', label: 'Wine' },
                { id: 'beer', label: 'Beer & Brewery' },
                { id: 'outdoors', label: 'Outdoors & Hiking' },
                { id: 'fitness', label: 'Fitness' },
                { id: 'arts', label: 'Arts & Culture' },
                { id: 'games', label: 'Games' },
                { id: 'books', label: 'Books & Reading' },
                { id: 'travel', label: 'Travel' },
                { id: 'social', label: 'Social' },
                { id: 'education', label: 'Education' },
                { id: 'wellness', label: 'Wellness' },
                { id: 'garden', label: 'Garden' },
                { id: 'crafts', label: 'Crafts' }
            ]
        },
        cost: {
            prefix: 'cost:',
            options: [
                { id: 'free', label: 'Free' },
                { id: 'under-25', label: 'Under $25' },
                { id: 'under-50', label: 'Under $50' },
                { id: 'under-100', label: 'Under $100' },
                { id: 'over-100', label: '$100+' }
            ]
        },
        timeOfDay: {
            prefix: 'time:',
            options: [
                { id: 'morning', label: 'Morning' },
                { id: 'afternoon', label: 'Afternoon' },
                { id: 'evening', label: 'Evening' }
            ]
        }
    };

    /** Quick filter definitions */
    const QUICK_FILTER_RULES = {
        weekend: {
            tag: 'day:weekend',
            color: '#9c27b0'
        },
        free: {
            tag: 'cost:free',
            color: '#4caf50'
        },
        hasOpenings: {
            check: (event) => !event.isFull && event.spotsAvailable !== 0,
            color: '#2196f3'
        },
        newbieFriendly: {
            tag: 'newbie-friendly',
            color: '#ff9800'
        },
        publicEvent: {
            tag: 'public-event',
            color: '#00bcd4'
        }
    };


// =============================================================================
// SECTION 2: CSS STYLES
// =============================================================================

    function injectStyles() {
        if (document.getElementById('clubcalendar-styles')) return;

        const css = `
/* ClubCalendar Widget Styles */
.clubcal-widget {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
}

.clubcal-header {
    background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${adjustColor(CONFIG.primaryColor, -20)} 100%);
    color: white;
    padding: 20px 24px;
    border-radius: 12px 12px 0 0;
}

.clubcal-header h2 {
    margin: 0 0 4px 0;
    font-size: 24px;
    font-weight: 600;
}

.clubcal-header p {
    margin: 0;
    opacity: 0.9;
    font-size: 14px;
}

/* Filter Bar */
.clubcal-filter-bar {
    background: #f8f9fa;
    padding: 16px 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    border-bottom: 1px solid #e0e0e0;
}

.clubcal-filter-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.clubcal-filter-group label {
    font-size: 11px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.clubcal-filter-group select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    min-width: 150px;
    cursor: pointer;
}

.clubcal-filter-group select:focus {
    outline: none;
    border-color: ${CONFIG.primaryColor};
    box-shadow: 0 0 0 2px ${CONFIG.primaryColor}20;
}

/* View Toggle */
.clubcal-view-toggle {
    display: flex;
    background: ${CONFIG.primaryColor};
    border-radius: 6px;
    padding: 3px;
    margin-left: auto;
}

.clubcal-view-btn {
    padding: 6px 14px;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.7);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
}

.clubcal-view-btn:hover {
    color: white;
}

.clubcal-view-btn.active {
    background: white;
    color: ${CONFIG.primaryColor};
}

/* Quick Filters */
.clubcal-quick-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
}

.clubcal-quick-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 20px;
    background: white;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}

.clubcal-quick-btn:hover {
    border-color: #999;
}

.clubcal-quick-btn.active {
    background: ${CONFIG.primaryColor};
    border-color: ${CONFIG.primaryColor};
    color: white;
}

.clubcal-quick-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.clubcal-clear-btn {
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: ${CONFIG.primaryColor};
    font-size: 13px;
    cursor: pointer;
    margin-left: auto;
}

.clubcal-clear-btn:hover {
    text-decoration: underline;
}

/* Calendar Container */
.clubcal-calendar {
    background: white;
    padding: 20px;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* FullCalendar Overrides */
.clubcal-widget .fc {
    font-family: inherit;
}

.clubcal-widget .fc-toolbar-title {
    font-size: 20px !important;
    font-weight: 600 !important;
}

.clubcal-widget .fc-button-primary {
    background: ${CONFIG.primaryColor} !important;
    border-color: ${CONFIG.primaryColor} !important;
}

.clubcal-widget .fc-button-primary:hover {
    background: ${adjustColor(CONFIG.primaryColor, -15)} !important;
    border-color: ${adjustColor(CONFIG.primaryColor, -15)} !important;
}

.clubcal-widget .fc-button-primary:disabled {
    background: ${CONFIG.primaryColor}80 !important;
    border-color: ${CONFIG.primaryColor}80 !important;
}

.clubcal-widget .fc-day-today {
    background: ${CONFIG.primaryColor}10 !important;
}

.clubcal-widget .fc-event {
    border: none;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 11px;
    cursor: pointer;
}

/* Time-based event colors */
.clubcal-widget .fc-event.time-morning {
    background: #ff9800;
    border-left: 3px solid #e65100;
}

.clubcal-widget .fc-event.time-afternoon {
    background: #2196f3;
    border-left: 3px solid #1565c0;
}

.clubcal-widget .fc-event.time-evening {
    background: #9c27b0;
    border-left: 3px solid #6a1b9a;
}

.clubcal-widget .fc-event.time-allday {
    background: #4caf50;
    border-left: 3px solid #2e7d32;
}

/* Event with limited spots */
.clubcal-widget .fc-event.spots-limited {
    position: relative;
}

.clubcal-widget .fc-event.spots-limited::after {
    content: '!';
    position: absolute;
    top: -4px;
    right: -4px;
    width: 14px;
    height: 14px;
    background: #ff5722;
    color: white;
    border-radius: 50%;
    font-size: 10px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clubcal-widget .fc-event.is-full {
    opacity: 0.6;
    text-decoration: line-through;
}

/* Event Popup */
.clubcal-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clubcal-popup {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.clubcal-popup-header {
    background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${adjustColor(CONFIG.primaryColor, -20)} 100%);
    color: white;
    padding: 20px;
}

.clubcal-popup-header h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
}

.clubcal-popup-header .committee {
    font-size: 12px;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.clubcal-popup-body {
    padding: 20px;
    max-height: 50vh;
    overflow-y: auto;
}

.clubcal-popup-meta {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
}

.clubcal-popup-meta-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #444;
}

.clubcal-popup-meta-item .icon {
    width: 20px;
    text-align: center;
}

.clubcal-popup-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
}

.clubcal-tag {
    display: inline-block;
    padding: 3px 8px;
    background: #f0f0f0;
    border-radius: 12px;
    font-size: 11px;
    color: #666;
}

.clubcal-popup-actions {
    display: flex;
    gap: 10px;
    padding: 16px 20px;
    border-top: 1px solid #eee;
    background: #fafafa;
}

.clubcal-btn {
    flex: 1;
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    transition: all 0.2s;
}

.clubcal-btn-primary {
    background: ${CONFIG.primaryColor};
    color: white;
}

.clubcal-btn-primary:hover {
    background: ${adjustColor(CONFIG.primaryColor, -15)};
}

.clubcal-btn-secondary {
    background: #e0e0e0;
    color: #333;
}

.clubcal-btn-secondary:hover {
    background: #d0d0d0;
}

/* Availability Badge */
.clubcal-avail-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

.clubcal-avail-badge.open {
    background: #e8f5e9;
    color: #2e7d32;
}

.clubcal-avail-badge.limited {
    background: #fff3e0;
    color: #e65100;
}

.clubcal-avail-badge.full {
    background: #ffebee;
    color: #c62828;
}

/* Loading State */
.clubcal-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
    color: #666;
}

.clubcal-loading::before {
    content: '';
    width: 24px;
    height: 24px;
    border: 3px solid #e0e0e0;
    border-top-color: ${CONFIG.primaryColor};
    border-radius: 50%;
    animation: clubcal-spin 0.8s linear infinite;
    margin-right: 12px;
}

@keyframes clubcal-spin {
    to { transform: rotate(360deg); }
}

/* Error State */
.clubcal-error {
    padding: 40px;
    text-align: center;
    color: #c62828;
}

/* Active Filters Display */
.clubcal-active-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 20px;
    background: #fff8e1;
    border-bottom: 1px solid #ffe082;
}

.clubcal-active-filter {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: ${CONFIG.primaryColor};
    color: white;
    border-radius: 16px;
    font-size: 12px;
}

.clubcal-active-filter .remove {
    cursor: pointer;
    opacity: 0.8;
    font-weight: bold;
}

.clubcal-active-filter .remove:hover {
    opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
    .clubcal-filter-bar {
        flex-direction: column;
        align-items: stretch;
    }

    .clubcal-filter-group {
        width: 100%;
    }

    .clubcal-filter-group select {
        width: 100%;
    }

    .clubcal-view-toggle {
        margin-left: 0;
        justify-content: center;
    }

    .clubcal-quick-filters {
        justify-content: center;
    }

    .clubcal-popup {
        width: 95%;
        max-height: 90vh;
    }
}
        `;

        const style = document.createElement('style');
        style.id = 'clubcalendar-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /**
     * Adjusts a hex color by the given amount.
     */
    function adjustColor(hex, amount) {
        hex = hex.replace('#', '');
        const num = parseInt(hex, 16);
        let r = (num >> 16) + amount;
        let g = ((num >> 8) & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
    }


// =============================================================================
// SECTION 3: DATA LAYER
// =============================================================================

    /** All loaded events */
    let allEvents = [];

    /** Current filter state */
    let currentFilters = {
        interestArea: null,
        committee: null,
        cost: null,
        timeOfDay: null,
        quickFilters: []  // Array of active quick filter IDs
    };

    /** Cached events with expiry */
    let eventCache = {
        data: null,
        expires: null
    };

    /**
     * Fetches events from the configured URL.
     */
    async function fetchEvents() {
        // Check cache
        if (eventCache.data && eventCache.expires && Date.now() < eventCache.expires) {
            return eventCache.data;
        }

        if (!CONFIG.eventsUrl) {
            throw new Error('eventsUrl not configured');
        }

        const response = await fetch(CONFIG.eventsUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status}`);
        }

        const data = await response.json();

        // Cache the response
        eventCache.data = data.events || [];
        eventCache.expires = Date.now() + (CONFIG.cacheDurationMinutes * 60 * 1000);

        return eventCache.data;
    }

    /**
     * Extracts committee from event name or tags.
     */
    function extractCommittee(event) {
        // Check for committee tag
        const committeeTag = event.tags.find(t => t.startsWith('committee:'));
        if (committeeTag) {
            return committeeTag.replace('committee:', '').replace(/-/g, ' ');
        }

        // Extract from name prefix (e.g., "Happy Hikers: Trail Walk")
        const colonIdx = event.name.indexOf(':');
        if (colonIdx > 0 && colonIdx < 30) {
            return event.name.substring(0, colonIdx).trim();
        }

        return 'General';
    }

    /**
     * Gets clean event title without committee prefix.
     */
    function getCleanTitle(event) {
        const colonIdx = event.name.indexOf(':');
        if (colonIdx > 0 && colonIdx < 30) {
            return event.name.substring(colonIdx + 1).trim();
        }
        return event.name;
    }

    /**
     * Gets time of day from event tags or derives from start time.
     */
    function getTimeOfDay(event) {
        // Check tags first
        if (event.tags.includes('time:morning')) return 'morning';
        if (event.tags.includes('time:afternoon')) return 'afternoon';
        if (event.tags.includes('time:evening')) return 'evening';

        // Derive from start time
        try {
            const start = new Date(event.start);
            const hour = start.getHours();
            if (hour < 12) return 'morning';
            if (hour < 17) return 'afternoon';
            return 'evening';
        } catch {
            return 'allday';
        }
    }

    /**
     * Transforms events to FullCalendar format.
     */
    function transformForCalendar(events) {
        return events.map(event => {
            const timeOfDay = getTimeOfDay(event);
            const committee = extractCommittee(event);

            let classNames = [`time-${timeOfDay}`];
            if (event.isFull) classNames.push('is-full');
            if (event.spotsAvailable !== null && event.spotsAvailable > 0 && event.spotsAvailable <= 5) {
                classNames.push('spots-limited');
            }

            return {
                id: event.id,
                title: getCleanTitle(event),
                start: event.start,
                end: event.end,
                classNames: classNames,
                extendedProps: {
                    originalEvent: event,
                    committee: committee,
                    timeOfDay: timeOfDay,
                    location: event.location,
                    tags: event.tags,
                    spotsAvailable: event.spotsAvailable,
                    isFull: event.isFull,
                    url: event.url,
                    registrationUrl: event.registrationUrl
                }
            };
        });
    }

    /**
     * Filters events based on current filter state.
     */
    function filterEvents(events) {
        return events.filter(event => {
            const tags = event.tags || [];

            // Interest area filter
            if (currentFilters.interestArea) {
                const tag = `activity:${currentFilters.interestArea}`;
                if (!tags.includes(tag)) return false;
            }

            // Committee filter
            if (currentFilters.committee) {
                const tag = `committee:${currentFilters.committee}`;
                const committee = extractCommittee(event);
                if (!tags.includes(tag) && committee.toLowerCase() !== currentFilters.committee.toLowerCase()) {
                    return false;
                }
            }

            // Cost filter
            if (currentFilters.cost) {
                const tag = `cost:${currentFilters.cost}`;
                if (!tags.includes(tag)) return false;
            }

            // Time of day filter
            if (currentFilters.timeOfDay) {
                const tag = `time:${currentFilters.timeOfDay}`;
                if (!tags.includes(tag)) {
                    // Fall back to derived time
                    const derived = getTimeOfDay(event);
                    if (derived !== currentFilters.timeOfDay) return false;
                }
            }

            // Quick filters (all must match)
            for (const filterId of currentFilters.quickFilters) {
                const rule = QUICK_FILTER_RULES[filterId];
                if (!rule) continue;

                if (rule.tag) {
                    if (!tags.includes(rule.tag)) return false;
                } else if (rule.check) {
                    if (!rule.check(event)) return false;
                }
            }

            return true;
        });
    }

    /**
     * Extracts unique committees from events.
     */
    function extractCommittees(events) {
        const committees = new Set();
        events.forEach(event => {
            const committee = extractCommittee(event);
            if (committee && committee !== 'General') {
                committees.add(committee);
            }
        });
        return Array.from(committees).sort();
    }


// =============================================================================
// SECTION 4: UI LAYER
// =============================================================================

    /** FullCalendar instance */
    let calendarInstance = null;

    /**
     * Loads FullCalendar library from CDN.
     */
    function loadDependencies(callback) {
        // Check if already loaded
        if (window.FullCalendar) {
            callback();
            return;
        }

        // Load CSS
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.css';
        document.head.appendChild(css);

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js';
        script.onload = callback;
        script.onerror = () => {
            console.error('ClubCalendar: Failed to load FullCalendar');
            showError('Failed to load calendar library');
        };
        document.head.appendChild(script);
    }

    /**
     * Builds the widget HTML structure.
     */
    function buildWidget() {
        const container = document.querySelector(CONFIG.container);
        if (!container) {
            console.error('ClubCalendar: Container not found:', CONFIG.container);
            return false;
        }

        let html = '<div class="clubcal-widget">';

        // Header
        html += `
            <div class="clubcal-header">
                <h2>${escapeHtml(CONFIG.title)}</h2>
                <p>Discover events that match your interests</p>
            </div>
        `;

        // Filter bar
        html += '<div class="clubcal-filter-bar">';

        // Dropdowns
        if (CONFIG.filters.interestArea.enabled) {
            html += `
                <div class="clubcal-filter-group">
                    <label>${escapeHtml(CONFIG.filters.interestArea.label)}</label>
                    <select id="clubcal-filter-interest">
                        <option value="">All</option>
                        ${TAG_CATEGORIES.interestArea.options.map(opt =>
                            `<option value="${opt.id}">${escapeHtml(opt.label)}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        }

        if (CONFIG.filters.committee.enabled) {
            html += `
                <div class="clubcal-filter-group">
                    <label>${escapeHtml(CONFIG.filters.committee.label)}</label>
                    <select id="clubcal-filter-committee">
                        <option value="">All</option>
                    </select>
                </div>
            `;
        }

        if (CONFIG.filters.cost.enabled) {
            html += `
                <div class="clubcal-filter-group">
                    <label>${escapeHtml(CONFIG.filters.cost.label)}</label>
                    <select id="clubcal-filter-cost">
                        <option value="">Any</option>
                        ${TAG_CATEGORIES.cost.options.map(opt =>
                            `<option value="${opt.id}">${escapeHtml(opt.label)}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        }

        // View toggle
        html += `
            <div class="clubcal-view-toggle">
                <button class="clubcal-view-btn active" data-view="dayGridMonth">Month</button>
                <button class="clubcal-view-btn" data-view="listMonth">List</button>
            </div>
        `;

        html += '</div>'; // End filter bar

        // Quick filters
        html += '<div class="clubcal-quick-filters">';

        Object.entries(CONFIG.quickFilters).forEach(([id, filter]) => {
            if (!filter.enabled) return;
            const rule = QUICK_FILTER_RULES[id];
            const color = rule?.color || '#666';
            html += `
                <button class="clubcal-quick-btn" data-filter="${id}">
                    <span class="clubcal-quick-dot" style="background:${color}"></span>
                    ${escapeHtml(filter.label)}
                </button>
            `;
        });

        html += '<button class="clubcal-clear-btn" id="clubcal-clear-filters">Clear All</button>';
        html += '</div>'; // End quick filters

        // Active filters display (hidden initially)
        html += '<div class="clubcal-active-filters" id="clubcal-active-filters" style="display:none"></div>';

        // Calendar container
        html += `
            <div class="clubcal-calendar">
                <div class="clubcal-loading">Loading events...</div>
                <div id="clubcal-calendar-inner"></div>
            </div>
        `;

        html += '</div>'; // End widget

        container.innerHTML = html;
        return true;
    }

    /**
     * Initializes FullCalendar.
     */
    function initCalendar() {
        const calendarEl = document.getElementById('clubcal-calendar-inner');
        if (!calendarEl) return;

        calendarInstance = new FullCalendar.Calendar(calendarEl, {
            initialView: CONFIG.defaultView,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: ''
            },
            events: function(info, successCallback) {
                const filtered = filterEvents(allEvents);
                const transformed = transformForCalendar(filtered);
                successCallback(transformed);
                updateEventCount(filtered.length);
            },
            eventClick: function(info) {
                if (CONFIG.eventClickBehavior === 'link') {
                    const url = info.event.extendedProps.url;
                    if (url) window.open(url, '_blank');
                } else {
                    showEventPopup(info.event.extendedProps.originalEvent);
                }
            },
            eventDidMount: function(info) {
                // Add tooltip
                info.el.title = info.event.title;
            },
            height: 'auto',
            dayMaxEvents: 4,
            moreLinkClick: 'popover'
        });

        calendarInstance.render();
    }

    /**
     * Sets up event handlers.
     */
    function setupEventHandlers() {
        // Dropdown filters
        const interestSelect = document.getElementById('clubcal-filter-interest');
        if (interestSelect) {
            interestSelect.addEventListener('change', (e) => {
                currentFilters.interestArea = e.target.value || null;
                refreshCalendar();
            });
        }

        const committeeSelect = document.getElementById('clubcal-filter-committee');
        if (committeeSelect) {
            committeeSelect.addEventListener('change', (e) => {
                currentFilters.committee = e.target.value || null;
                refreshCalendar();
            });
        }

        const costSelect = document.getElementById('clubcal-filter-cost');
        if (costSelect) {
            costSelect.addEventListener('change', (e) => {
                currentFilters.cost = e.target.value || null;
                refreshCalendar();
            });
        }

        // Quick filter buttons
        document.querySelectorAll('.clubcal-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filterId = btn.dataset.filter;
                toggleQuickFilter(filterId, btn);
            });
        });

        // Clear filters
        const clearBtn = document.getElementById('clubcal-clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearFilters);
        }

        // View toggle
        document.querySelectorAll('.clubcal-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.clubcal-view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (calendarInstance) {
                    calendarInstance.changeView(btn.dataset.view);
                }
            });
        });
    }

    /**
     * Toggles a quick filter.
     */
    function toggleQuickFilter(filterId, button) {
        const idx = currentFilters.quickFilters.indexOf(filterId);
        if (idx >= 0) {
            currentFilters.quickFilters.splice(idx, 1);
            button.classList.remove('active');
        } else {
            currentFilters.quickFilters.push(filterId);
            button.classList.add('active');
        }
        refreshCalendar();
    }

    /**
     * Clears all filters.
     */
    function clearFilters() {
        currentFilters = {
            interestArea: null,
            committee: null,
            cost: null,
            timeOfDay: null,
            quickFilters: []
        };

        // Reset dropdowns
        document.querySelectorAll('.clubcal-filter-group select').forEach(select => {
            select.value = '';
        });

        // Reset quick filter buttons
        document.querySelectorAll('.clubcal-quick-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        refreshCalendar();
    }

    /**
     * Refreshes the calendar with current filters.
     */
    function refreshCalendar() {
        if (calendarInstance) {
            calendarInstance.refetchEvents();
        }
        updateActiveFiltersDisplay();
    }

    /**
     * Updates the active filters display.
     */
    function updateActiveFiltersDisplay() {
        const container = document.getElementById('clubcal-active-filters');
        if (!container) return;

        const activeFilters = [];

        if (currentFilters.interestArea) {
            const opt = TAG_CATEGORIES.interestArea.options.find(o => o.id === currentFilters.interestArea);
            activeFilters.push({ type: 'interestArea', label: opt?.label || currentFilters.interestArea });
        }

        if (currentFilters.committee) {
            activeFilters.push({ type: 'committee', label: currentFilters.committee });
        }

        if (currentFilters.cost) {
            const opt = TAG_CATEGORIES.cost.options.find(o => o.id === currentFilters.cost);
            activeFilters.push({ type: 'cost', label: opt?.label || currentFilters.cost });
        }

        currentFilters.quickFilters.forEach(id => {
            const filter = CONFIG.quickFilters[id];
            if (filter) {
                activeFilters.push({ type: 'quick', id: id, label: filter.label });
            }
        });

        if (activeFilters.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = activeFilters.map(f => `
            <span class="clubcal-active-filter">
                ${escapeHtml(f.label)}
                <span class="remove" data-type="${f.type}" data-id="${f.id || ''}">&times;</span>
            </span>
        `).join('');

        // Add remove handlers
        container.querySelectorAll('.remove').forEach(el => {
            el.addEventListener('click', () => {
                const type = el.dataset.type;
                const id = el.dataset.id;

                if (type === 'quick') {
                    const idx = currentFilters.quickFilters.indexOf(id);
                    if (idx >= 0) currentFilters.quickFilters.splice(idx, 1);
                    document.querySelector(`.clubcal-quick-btn[data-filter="${id}"]`)?.classList.remove('active');
                } else {
                    currentFilters[type] = null;
                    const select = document.getElementById(`clubcal-filter-${type === 'interestArea' ? 'interest' : type}`);
                    if (select) select.value = '';
                }

                refreshCalendar();
            });
        });
    }

    /**
     * Updates event count display.
     */
    function updateEventCount(count) {
        // Could add a count indicator in the UI
    }

    /**
     * Populates the committee dropdown with actual values.
     */
    function populateCommittees() {
        const select = document.getElementById('clubcal-filter-committee');
        if (!select) return;

        const committees = extractCommittees(allEvents);
        committees.forEach(committee => {
            const option = document.createElement('option');
            option.value = committee.toLowerCase().replace(/\s+/g, '-');
            option.textContent = committee;
            select.appendChild(option);
        });
    }

    /**
     * Shows event detail popup.
     */
    function showEventPopup(event) {
        closePopup();

        const committee = extractCommittee(event);
        const title = getCleanTitle(event);
        const startDate = new Date(event.start);
        const dateStr = startDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        const timeStr = startDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });

        // Availability
        let availHtml = '';
        if (event.isFull) {
            availHtml = '<span class="clubcal-avail-badge full">Full - Waitlist</span>';
        } else if (event.spotsAvailable !== null && event.spotsAvailable <= 5) {
            availHtml = `<span class="clubcal-avail-badge limited">${event.spotsAvailable} spots left</span>`;
        } else if (event.spotsAvailable !== null) {
            availHtml = `<span class="clubcal-avail-badge open">${event.spotsAvailable} spots available</span>`;
        } else {
            availHtml = '<span class="clubcal-avail-badge open">Open</span>';
        }

        // Tags (display-friendly)
        const displayTags = event.tags
            .filter(t => !t.startsWith('time:') && !t.startsWith('availability:') && !t.startsWith('day:'))
            .map(t => t.replace(/^[^:]+:/, '').replace(/-/g, ' '));

        const html = `
            <div class="clubcal-popup-overlay" onclick="ClubCalendar.closePopup()">
                <div class="clubcal-popup" onclick="event.stopPropagation()">
                    <div class="clubcal-popup-header">
                        <div class="committee">${escapeHtml(committee)}</div>
                        <h3>${escapeHtml(title)}</h3>
                    </div>
                    <div class="clubcal-popup-body">
                        <div class="clubcal-popup-meta">
                            <div class="clubcal-popup-meta-item">
                                <span class="icon">📅</span>
                                <span>${dateStr}</span>
                            </div>
                            <div class="clubcal-popup-meta-item">
                                <span class="icon">🕐</span>
                                <span>${timeStr}</span>
                            </div>
                            ${event.location ? `
                            <div class="clubcal-popup-meta-item">
                                <span class="icon">📍</span>
                                <span>${escapeHtml(event.location)}</span>
                            </div>
                            ` : ''}
                            <div class="clubcal-popup-meta-item">
                                <span class="icon">🎟️</span>
                                ${availHtml}
                            </div>
                        </div>
                        ${displayTags.length > 0 ? `
                        <div class="clubcal-popup-tags">
                            ${displayTags.map(t => `<span class="clubcal-tag">${escapeHtml(t)}</span>`).join('')}
                        </div>
                        ` : ''}
                    </div>
                    <div class="clubcal-popup-actions">
                        <a href="${event.url || event.registrationUrl || '#'}" target="_blank" class="clubcal-btn clubcal-btn-primary">
                            View & Register
                        </a>
                        <button class="clubcal-btn clubcal-btn-secondary" onclick="ClubCalendar.closePopup()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    /**
     * Closes event popup.
     */
    function closePopup() {
        const overlay = document.querySelector('.clubcal-popup-overlay');
        if (overlay) overlay.remove();
    }

    /**
     * Shows error message.
     */
    function showError(message) {
        const container = document.querySelector('.clubcal-calendar');
        if (container) {
            container.innerHTML = `<div class="clubcal-error">${escapeHtml(message)}</div>`;
        }
    }

    /**
     * Escapes HTML special characters.
     */
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }


// =============================================================================
// SECTION 5: PUBLIC API
// =============================================================================

    window.ClubCalendar = {
        /**
         * Initialize the widget.
         */
        init: async function(options = {}) {
            // Merge configuration
            if (window.CLUBCALENDAR_CONFIG) {
                CONFIG = { ...DEFAULT_CONFIG, ...window.CLUBCALENDAR_CONFIG, ...options };
            } else {
                CONFIG = { ...DEFAULT_CONFIG, ...options };
            }

            // Inject styles
            injectStyles();

            // Load dependencies
            loadDependencies(async () => {
                // Build widget
                if (!buildWidget()) return;

                try {
                    // Fetch events
                    allEvents = await fetchEvents();

                    // Hide loading
                    const loading = document.querySelector('.clubcal-loading');
                    if (loading) loading.style.display = 'none';

                    // Populate committees
                    populateCommittees();

                    // Initialize calendar
                    initCalendar();

                    // Setup handlers
                    setupEventHandlers();

                } catch (error) {
                    console.error('ClubCalendar: Failed to initialize:', error);
                    showError('Failed to load events. Please try again later.');
                }
            });
        },

        /**
         * Refresh events from server.
         */
        refresh: async function() {
            eventCache.data = null;
            eventCache.expires = null;
            try {
                allEvents = await fetchEvents();
                refreshCalendar();
            } catch (error) {
                console.error('ClubCalendar: Failed to refresh:', error);
            }
        },

        /**
         * Clear all filters.
         */
        clearFilters: clearFilters,

        /**
         * Close event popup.
         */
        closePopup: closePopup,

        /**
         * Get current filter state.
         */
        getFilters: () => ({ ...currentFilters }),

        /**
         * Get event count.
         */
        getEventCount: () => allEvents.length,

        /**
         * Get filtered event count.
         */
        getFilteredCount: () => filterEvents(allEvents).length
    };


// =============================================================================
// SECTION 6: AUTO-INITIALIZATION
// =============================================================================

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ClubCalendar.init());
    } else {
        ClubCalendar.init();
    }

})();
