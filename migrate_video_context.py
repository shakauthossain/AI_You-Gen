"""
Database migration script to add video context support to chat tables.
Run this script to update your existing database with the new video context fields.
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_LzOfc2AtHS4U@ep-super-surf-a1hjdo0k-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

def migrate_database():
    """Add video context columns to existing chat tables"""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                # Add video_url and video_title columns to chat_sessions table
                print("Adding video context columns to chat_sessions table...")
                conn.execute(text("""
                    ALTER TABLE chat_sessions 
                    ADD COLUMN video_url VARCHAR(500) NULL
                """))
                
                conn.execute(text("""
                    ALTER TABLE chat_sessions 
                    ADD COLUMN video_title VARCHAR(200) NULL
                """))
                
                # Add video_context column to chat_messages table
                print("Adding video_context column to chat_messages table...")
                conn.execute(text("""
                    ALTER TABLE chat_messages 
                    ADD COLUMN video_context VARCHAR(500) NULL
                """))
                
                # Commit the transaction
                trans.commit()
                print("✅ Database migration completed successfully!")
                
                # Verify the changes
                print("\nVerifying new columns...")
                result = conn.execute(text("PRAGMA table_info(chat_sessions)"))
                sessions_columns = [row[1] for row in result.fetchall()]
                print(f"chat_sessions columns: {sessions_columns}")
                
                result = conn.execute(text("PRAGMA table_info(chat_messages)"))
                messages_columns = [row[1] for row in result.fetchall()]
                print(f"chat_messages columns: {messages_columns}")
                
                # Check if new columns exist
                if 'video_url' in sessions_columns and 'video_title' in sessions_columns:
                    print("✅ chat_sessions video columns added successfully")
                else:
                    print("❌ Failed to add video columns to chat_sessions")
                
                if 'video_context' in messages_columns:
                    print("✅ chat_messages video_context column added successfully")
                else:
                    print("❌ Failed to add video_context column to chat_messages")
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Migration failed: {e}")
                raise e
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Starting database migration for video context support...")
    print(f"Database URL: {DATABASE_URL}")
    
    success = migrate_database()
    
    if success:
        print("\n🎉 Migration completed! Your chat system now supports video context.")
        print("You can now:")
        print("- Create chat sessions for specific YouTube videos")
        print("- Track which video each conversation relates to")
        print("- View chat history organized by video")
    else:
        print("\n💥 Migration failed. Please check the error messages above.")