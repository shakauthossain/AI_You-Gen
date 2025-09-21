from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_LzOfc2AtHS4U@ep-super-surf-a1hjdo0k-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
