"""
ClubCalendar Configuration
==========================
Handles configuration for different deployment environments.

Supported backends:
- Google Cloud (Cloud Storage + Firestore)
- Custom Server (Local files)
"""

import os
import json
from enum import Enum
from typing import Optional
from dataclasses import dataclass, field


class DeploymentType(Enum):
    """Supported deployment types."""
    GOOGLE_CLOUD = "google_cloud"
    CUSTOM_SERVER = "custom_server"


@dataclass
class GoogleCloudConfig:
    """Configuration for Google Cloud deployment."""
    bucket_name: str
    project_id: Optional[str] = None
    firestore_collection: str = "organizations"


@dataclass
class CustomServerConfig:
    """Configuration for custom server deployment."""
    data_directory: str  # Where to write events.json
    config_file: str     # Path to config.json
    base_url: str        # Public URL base for the files


@dataclass
class WildApricotConfig:
    """Wild Apricot API configuration."""
    account_id: str
    api_key: str
    client_id: Optional[str] = None
    client_secret: Optional[str] = None


@dataclass
class SyncConfig:
    """Main configuration for the sync job."""
    deployment_type: DeploymentType
    org_id: str
    wa_config: WildApricotConfig

    # Deployment-specific config (one will be set)
    google_cloud: Optional[GoogleCloudConfig] = None
    custom_server: Optional[CustomServerConfig] = None

    # Sync settings
    include_past_days: int = 0
    sync_interval_minutes: int = 15


def load_config() -> SyncConfig:
    """
    Load configuration from environment variables or config file.

    Environment variables take precedence over config file.
    """
    # Determine deployment type
    deployment_type_str = os.environ.get('CLUBCAL_DEPLOYMENT', 'custom_server')
    deployment_type = DeploymentType(deployment_type_str)

    # Load Wild Apricot config
    wa_config = WildApricotConfig(
        account_id=os.environ.get('WA_ACCOUNT_ID', ''),
        api_key=os.environ.get('WA_API_KEY', ''),
        client_id=os.environ.get('WA_CLIENT_ID'),
        client_secret=os.environ.get('WA_CLIENT_SECRET')
    )

    org_id = os.environ.get('ORG_ID', 'default')

    # Load deployment-specific config
    google_cloud = None
    custom_server = None

    if deployment_type == DeploymentType.GOOGLE_CLOUD:
        google_cloud = GoogleCloudConfig(
            bucket_name=os.environ.get('GCS_BUCKET', ''),
            project_id=os.environ.get('GCP_PROJECT'),
            firestore_collection=os.environ.get('FIRESTORE_COLLECTION', 'organizations')
        )
    else:
        # Custom server - try to load from config file first
        config_file = os.environ.get('CLUBCAL_CONFIG_FILE', '/etc/clubcalendar/config.json')

        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                file_config = json.load(f)

            custom_server = CustomServerConfig(
                data_directory=file_config.get('data_directory', '/var/www/clubcalendar/data'),
                config_file=config_file,
                base_url=file_config.get('base_url', '')
            )

            # Override WA config from file if not in environment
            if not wa_config.account_id and 'wild_apricot' in file_config:
                wa_config.account_id = file_config['wild_apricot'].get('account_id', '')
                wa_config.api_key = file_config['wild_apricot'].get('api_key', '')

            if not org_id or org_id == 'default':
                org_id = file_config.get('org_id', 'default')
        else:
            # Fall back to environment variables
            custom_server = CustomServerConfig(
                data_directory=os.environ.get('CLUBCAL_DATA_DIR', '/var/www/clubcalendar/data'),
                config_file=config_file,
                base_url=os.environ.get('CLUBCAL_BASE_URL', '')
            )

    return SyncConfig(
        deployment_type=deployment_type,
        org_id=org_id,
        wa_config=wa_config,
        google_cloud=google_cloud,
        custom_server=custom_server,
        include_past_days=int(os.environ.get('INCLUDE_PAST_DAYS', '0')),
        sync_interval_minutes=int(os.environ.get('SYNC_INTERVAL', '15'))
    )


# Example config.json for custom server:
EXAMPLE_CONFIG = """
{
    "org_id": "sbnc",
    "deployment": "custom_server",

    "wild_apricot": {
        "account_id": "123456",
        "api_key": "your-api-key-here"
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
            "type": "name-contains",
            "pattern": "wine",
            "tag": "activity:wine"
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
"""
