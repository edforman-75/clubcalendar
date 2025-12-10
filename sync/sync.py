#!/usr/bin/env python3
"""
ClubCalendar Sync Job
=====================
Syncs Wild Apricot events to a JSON file.

Works with both Google Cloud and custom server deployments.

Usage:
    # As a standalone script (custom server)
    python sync.py

    # With Google Cloud Functions
    See main.py for the Cloud Function wrapper
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

import requests

from config import load_config, SyncConfig
from storage import create_storage_backend, StorageBackend

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)


# =============================================================================
# WILD APRICOT API CLIENT
# =============================================================================

class WildApricotClient:
    """Client for Wild Apricot API."""

    def __init__(self, account_id: str, api_key: str):
        self.account_id = account_id
        self.api_key = api_key
        self.base_url = "https://api.wildapricot.org/v2.2"
        self.token = None
        self.token_expires = None

    def _get_token(self) -> str:
        """Get OAuth token, refreshing if needed."""
        if self.token and self.token_expires and datetime.now() < self.token_expires:
            return self.token

        logger.info("Refreshing WA API token")

        auth_url = "https://oauth.wildapricot.org/auth/token"
        response = requests.post(
            auth_url,
            data={
                'grant_type': 'client_credentials',
                'scope': 'auto'
            },
            auth=('APIKEY', self.api_key)
        )
        response.raise_for_status()

        data = response.json()
        self.token = data['access_token']
        self.token_expires = datetime.now() + timedelta(seconds=data['expires_in'] - 60)

        return self.token

    def get_events(self, include_past_days: int = 0) -> List[Dict[str, Any]]:
        """
        Fetch events from Wild Apricot.

        Args:
            include_past_days: Number of past days to include

        Returns:
            List of event dictionaries
        """
        token = self._get_token()

        # Calculate date range
        start_date = datetime.now() - timedelta(days=include_past_days)

        url = f"{self.base_url}/accounts/{self.account_id}/events"
        params = {
            '$filter': f"StartDate ge {start_date.strftime('%Y-%m-%d')}",
            '$sort': 'StartDate asc'
        }

        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        }

        logger.info(f"Fetching events from WA API (since {start_date.date()})")

        all_events = []
        page_url = url

        while page_url:
            response = requests.get(page_url, headers=headers, params=params if page_url == url else None)
            response.raise_for_status()

            data = response.json()

            # Handle different response formats
            if isinstance(data, dict):
                events = data.get('Events', [])
                all_events.extend(events)

                # Check for pagination
                page_url = data.get('ResultNextPageUrl')
            else:
                all_events.extend(data)
                page_url = None

        logger.info(f"Fetched {len(all_events)} events from WA")
        return all_events


# =============================================================================
# EVENT TRANSFORMATION
# =============================================================================

def apply_auto_tags(event: Dict[str, Any], rules: List[Dict[str, Any]]) -> List[str]:
    """
    Apply auto-tagging rules to an event.

    Args:
        event: Event dictionary from WA API
        rules: List of auto-tag rules from config

    Returns:
        List of auto-generated tags
    """
    auto_tags = []
    event_name = event.get('Name', '').lower()

    for rule in rules:
        rule_type = rule.get('type')
        pattern = rule.get('pattern', '').lower()
        tag = rule.get('tag')

        if not pattern or not tag:
            continue

        matched = False

        if rule_type == 'name-prefix':
            matched = event_name.startswith(pattern)
        elif rule_type == 'name-contains':
            matched = pattern in event_name
        elif rule_type == 'name-suffix':
            matched = event_name.endswith(pattern)

        if matched:
            auto_tags.append(tag)

    return auto_tags


def derive_time_of_day(start_date_str: str, config: Dict[str, Any]) -> Optional[str]:
    """Derive time-of-day tag from event start time."""
    try:
        # Parse ISO datetime
        start_dt = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        hour = start_dt.hour

        time_config = config.get('derived_fields', config.get('derivedFields', {}))
        time_config = time_config.get('time_of_day', time_config.get('timeOfDay', {}))

        morning_before = time_config.get('morning', {}).get('before', 12)
        afternoon_before = time_config.get('afternoon', {}).get('before', 17)

        if hour < morning_before:
            return 'time:morning'
        elif hour < afternoon_before:
            return 'time:afternoon'
        else:
            return 'time:evening'
    except (ValueError, AttributeError, TypeError):
        return None


def derive_availability(event: Dict[str, Any]) -> str:
    """Derive availability tag from registration data."""
    limit = event.get('RegistrationsLimit')
    confirmed = event.get('ConfirmedRegistrationsCount', 0)

    if limit is None or limit == 0:
        return 'availability:open'

    spots = limit - confirmed

    if spots <= 0:
        return 'availability:full'
    elif spots <= 5:
        return 'availability:limited'
    else:
        return 'availability:open'


def derive_weekend(start_date_str: str) -> bool:
    """Check if event is on a weekend."""
    try:
        start_dt = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        return start_dt.weekday() >= 5  # Saturday = 5, Sunday = 6
    except (ValueError, AttributeError, TypeError):
        return False


def transform_event(event: Dict[str, Any], org_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform WA event to ClubCalendar format.

    Args:
        event: Raw event from WA API
        org_config: Organization configuration

    Returns:
        Transformed event dictionary
    """
    # Get existing tags from WA
    wa_tags = event.get('Tags', [])
    if isinstance(wa_tags, str):
        wa_tags = [t.strip() for t in wa_tags.split(',') if t.strip()]
    elif wa_tags is None:
        wa_tags = []

    # Get auto-tag rules (support both naming conventions)
    auto_tag_rules = org_config.get('auto_tag_rules', org_config.get('autoTagRules', []))

    # Apply auto-tagging rules
    auto_tags = apply_auto_tags(event, auto_tag_rules)

    # Derive additional tags
    start_date = event.get('StartDate', '')

    time_tag = derive_time_of_day(start_date, org_config)
    if time_tag:
        auto_tags.append(time_tag)

    avail_tag = derive_availability(event)
    auto_tags.append(avail_tag)

    if derive_weekend(start_date):
        auto_tags.append('day:weekend')

    # Combine all tags (deduplicated)
    all_tags = list(set(wa_tags + auto_tags))

    # Calculate spots available
    limit = event.get('RegistrationsLimit')
    confirmed = event.get('ConfirmedRegistrationsCount', 0)
    spots = None if limit is None else max(0, limit - confirmed)

    # Get event URL
    event_id = event.get('Id')
    event_url = event.get('Url', '')
    if not event_url and event_id:
        # Construct URL if not provided
        event_url = f"https://sbnewcomers.org/event-{event_id}"

    # Build transformed event
    return {
        'id': event_id,
        'name': event.get('Name', ''),
        'start': start_date,
        'end': event.get('EndDate', ''),
        'location': event.get('Location', ''),
        'description': event.get('Details', {}).get('DescriptionHtml', '') if isinstance(event.get('Details'), dict) else '',
        'url': event_url,
        'registrationUrl': event.get('RegistrationUrl', ''),
        'tags': all_tags,
        'spotsAvailable': spots,
        'isFull': spots == 0 if spots is not None else False,
        'registrationEnabled': event.get('RegistrationEnabled', True),
        'accessLevel': event.get('AccessLevel', 'Public')
    }


# =============================================================================
# MAIN SYNC FUNCTION
# =============================================================================

def sync_events(config: Optional[SyncConfig] = None) -> Dict[str, Any]:
    """
    Main sync function.

    Args:
        config: Configuration object (loads from environment if not provided)

    Returns:
        Result dictionary with status and event count
    """
    # Load config if not provided
    if config is None:
        config = load_config()

    # Validate config
    if not config.wa_config.account_id or not config.wa_config.api_key:
        raise ValueError("Wild Apricot credentials not configured")

    # Create storage backend
    storage = create_storage_backend(config)

    # Load organization config (for auto-tag rules, etc.)
    org_config = storage.load_config(config.org_id)
    logger.info(f"Loaded config for org: {config.org_id}")

    # Fetch events from Wild Apricot
    wa_client = WildApricotClient(
        config.wa_config.account_id,
        config.wa_config.api_key
    )
    raw_events = wa_client.get_events(include_past_days=config.include_past_days)

    # Transform events
    transformed_events = []
    for event in raw_events:
        # Skip cancelled events
        name = event.get('Name', '')
        if 'CANCELLED' in name.upper():
            continue

        try:
            transformed = transform_event(event, org_config)
            transformed_events.append(transformed)
        except Exception as e:
            logger.warning(f"Failed to transform event {event.get('Id')}: {e}")
            continue

    logger.info(f"Transformed {len(transformed_events)} events")

    # Build output
    output = {
        '_warning': 'This file is auto-generated. Do not edit manually.',
        '_generated': datetime.utcnow().isoformat() + 'Z',
        '_orgId': config.org_id,
        'eventCount': len(transformed_events),
        'events': transformed_events
    }

    # Save to storage
    url = storage.save_events(config.org_id, output)

    result = {
        'success': True,
        'eventCount': len(transformed_events),
        'url': url,
        'timestamp': output['_generated']
    }

    logger.info(f"Sync complete: {len(transformed_events)} events saved to {url}")

    return result


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

if __name__ == '__main__':
    import sys

    try:
        result = sync_events()
        print(f"Success: Synced {result['eventCount']} events")
        print(f"Output: {result['url']}")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Sync failed: {e}", exc_info=True)
        print(f"Error: {e}")
        sys.exit(1)
