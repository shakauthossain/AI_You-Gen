from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_LzOfc2AtHS4U@ep-super-surf-a1hjdo0k-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

# Configure engine with connection pooling settings compatible with Neon
engine = create_engine(
    DATABASE_URL,
    # Connection pool settings
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Validates connections before use
    pool_recycle=300,    # Recycle connections every 5 minutes
    # Connection settings compatible with Neon pooler
    connect_args={
        "connect_timeout": 10,
        # Removed statement_timeout as it's not supported by Neon pooler
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
