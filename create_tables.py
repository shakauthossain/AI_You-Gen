#!/usr/bin/env python3
"""
Simple script to create database tables if they don't exist.
"""

from app.db import engine
from app.models import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Create all tables defined in models"""
    try:
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully!")
        
        # Test connection and list tables
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]
            logger.info(f"📋 Existing tables: {tables}")
            
            # Check if our tables exist
            required_tables = ['users', 'chat_sessions', 'chat_messages']
            missing_tables = [table for table in required_tables if table not in tables]
            
            if missing_tables:
                logger.error(f"❌ Missing tables: {missing_tables}")
            else:
                logger.info("✅ All required tables exist")
                
    except Exception as e:
        logger.error(f"❌ Failed to create tables: {e}")
        raise

if __name__ == "__main__":
    create_tables()