"""
ClubCalendar Sync - Google Cloud Function Entry Point
======================================================
This is the entry point for Google Cloud Functions deployment.

For custom server deployment, run sync.py directly.
"""

import os
import logging

# Set deployment type for Google Cloud
os.environ.setdefault('CLUBCAL_DEPLOYMENT', 'google_cloud')

import functions_framework
from sync import sync_events
from config import load_config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@functions_framework.http
def sync_events_handler(request):
    """
    Cloud Function HTTP entry point.

    Triggered by Cloud Scheduler every 15 minutes.
    """
    try:
        result = sync_events()

        return (
            f"Successfully synced {result['eventCount']} events to {result['url']}",
            200
        )

    except Exception as e:
        logger.error(f"Sync failed: {str(e)}", exc_info=True)
        return (f"Sync failed: {str(e)}", 500)


# For local testing
if __name__ == '__main__':
    class MockRequest:
        pass

    result = sync_events_handler(MockRequest())
    print(result)
