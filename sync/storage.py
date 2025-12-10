"""
ClubCalendar Storage Abstraction
================================
Provides a unified interface for storing data across different backends.

Supported backends:
- Google Cloud Storage + Firestore
- Local filesystem (custom server)
"""

import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime

from config import SyncConfig, DeploymentType

logger = logging.getLogger(__name__)


class StorageBackend(ABC):
    """Abstract base class for storage backends."""

    @abstractmethod
    def load_config(self, org_id: str) -> Dict[str, Any]:
        """Load organization configuration."""
        pass

    @abstractmethod
    def save_config(self, org_id: str, config: Dict[str, Any]) -> None:
        """Save organization configuration."""
        pass

    @abstractmethod
    def save_events(self, org_id: str, events_data: Dict[str, Any]) -> str:
        """
        Save events JSON data.

        Returns:
            URL where the events file can be accessed
        """
        pass


class GoogleCloudStorage(StorageBackend):
    """Google Cloud Storage + Firestore backend."""

    def __init__(self, config: SyncConfig):
        self.bucket_name = config.google_cloud.bucket_name
        self.project_id = config.google_cloud.project_id
        self.firestore_collection = config.google_cloud.firestore_collection

        # Lazy import to avoid requiring GCP libs on custom servers
        from google.cloud import storage, firestore
        self._storage_client = storage.Client(project=self.project_id)
        self._firestore_client = firestore.Client(project=self.project_id)

    def load_config(self, org_id: str) -> Dict[str, Any]:
        """Load config from Firestore."""
        doc = self._firestore_client.collection(self.firestore_collection).document(org_id).get()

        if doc.exists:
            return doc.to_dict()

        return self._default_config()

    def save_config(self, org_id: str, config: Dict[str, Any]) -> None:
        """Save config to Firestore."""
        self._firestore_client.collection(self.firestore_collection).document(org_id).set(config)

    def save_events(self, org_id: str, events_data: Dict[str, Any]) -> str:
        """Save events to Cloud Storage."""
        bucket = self._storage_client.bucket(self.bucket_name)
        blob = bucket.blob(f'{org_id}/events.json')

        json_str = json.dumps(events_data, indent=2, default=str)
        blob.upload_from_string(json_str, content_type='application/json')

        # Make publicly readable
        blob.make_public()

        url = f'https://storage.googleapis.com/{self.bucket_name}/{org_id}/events.json'
        logger.info(f"Saved events to {url}")

        return url

    def _default_config(self) -> Dict[str, Any]:
        return {
            'autoTagRules': [],
            'derivedFields': {
                'timeOfDay': {
                    'morning': {'before': 12},
                    'afternoon': {'from': 12, 'before': 17},
                    'evening': {'from': 17}
                }
            }
        }


class LocalFileStorage(StorageBackend):
    """Local filesystem backend for custom servers."""

    def __init__(self, config: SyncConfig):
        self.data_directory = config.custom_server.data_directory
        self.config_file = config.custom_server.config_file
        self.base_url = config.custom_server.base_url

        # Ensure data directory exists
        os.makedirs(self.data_directory, exist_ok=True)

    def load_config(self, org_id: str) -> Dict[str, Any]:
        """Load config from JSON file."""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r') as f:
                return json.load(f)

        return self._default_config()

    def save_config(self, org_id: str, config: Dict[str, Any]) -> None:
        """Save config to JSON file."""
        # Ensure parent directory exists
        os.makedirs(os.path.dirname(self.config_file), exist_ok=True)

        with open(self.config_file, 'w') as f:
            json.dump(config, f, indent=2)

        logger.info(f"Saved config to {self.config_file}")

    def save_events(self, org_id: str, events_data: Dict[str, Any]) -> str:
        """Save events to local JSON file."""
        # Create org subdirectory if needed
        org_dir = os.path.join(self.data_directory, org_id)
        os.makedirs(org_dir, exist_ok=True)

        file_path = os.path.join(org_dir, 'events.json')

        with open(file_path, 'w') as f:
            json.dump(events_data, f, indent=2, default=str)

        logger.info(f"Saved events to {file_path}")

        # Return public URL
        if self.base_url:
            return f'{self.base_url}/data/{org_id}/events.json'
        else:
            return file_path

    def _default_config(self) -> Dict[str, Any]:
        return {
            'auto_tag_rules': [],
            'derived_fields': {
                'time_of_day': {
                    'morning': {'before': 12},
                    'afternoon': {'from': 12, 'before': 17},
                    'evening': {'from': 17}
                }
            }
        }


def create_storage_backend(config: SyncConfig) -> StorageBackend:
    """Factory function to create appropriate storage backend."""
    if config.deployment_type == DeploymentType.GOOGLE_CLOUD:
        return GoogleCloudStorage(config)
    else:
        return LocalFileStorage(config)
