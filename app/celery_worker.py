#!/usr/bin/env python3
"""
Celery worker script for YouTube Extractor Chat Caching
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent
sys.path.insert(0, str(app_dir))

from cache import celery_app

if __name__ == '__main__':
    # Start Celery worker
    celery_app.start()