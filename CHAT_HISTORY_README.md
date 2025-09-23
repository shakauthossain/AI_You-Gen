# User-Based Chat History Implementation

## Overview

I've implemented a comprehensive user-based chat history system that saves all YouTube video conversations per user. Here's what's been added:

## 🚀 Features

### User-Based Persistence
- **Individual User Sessions**: Each user's conversations are saved separately using Clerk authentication
- **Video-Specific Chats**: Chat sessions are linked to specific YouTube videos
- **Cross-Session Memory**: Users can access their conversation history across browser sessions
- **Automatic Session Creation**: New chat sessions are automatically created for each video

### Enhanced UI Components
- **AskTabWithHistory**: New component that replaces the basic AskTab
- **Chat History Panel**: Shows previous conversations for the current video
- **Session Management**: Users can see all their chat sessions with message counts
- **Visual Indicators**: Badges and icons show which messages are from history vs current session

### Backend Extensions
- **Extended Models**: Added `video_url`, `video_title`, and `video_context` fields
- **Video-Specific API**: New endpoints to find/create sessions by video URL
- **Message Context**: Messages can include video context for better organization

## 📁 Files Modified/Created

### Frontend
- `Frontend/src/components/tabs/AskTabWithHistory.tsx` (NEW) - Main component with history
- `Frontend/src/components/ContentCanvas.tsx` - Updated to use new component
- `Frontend/src/services/api.ts` - Extended with video context support
- `Frontend/tailwind.config.ts` - Added animation delays

### Backend
- `app/models.py` - Extended ChatSession and ChatMessage models
- `app/routes/chat.py` - Added video context support and new endpoints

### Database
- `migrate_video_context.py` (NEW) - Migration script for existing databases

## 🛠️ Setup Instructions

### 1. Database Migration
Run the migration script to add video context support to existing databases:

```bash
cd /media/aiot/New Volume/Client Work/youtube_extractor
python migrate_video_context.py
```

### 2. Backend Updates
The backend changes are automatically available. New API endpoints include:
- `POST /chat/sessions` - Now supports video_url and video_title
- `GET /chat/sessions/by-video` - Find sessions for a specific video
- `POST /chat/message` - Now supports video_context

### 3. Frontend Integration
The ContentCanvas now uses `AskTabWithHistory` instead of the basic component. No additional setup needed.

## 🎯 How It Works

### Video Session Lifecycle
1. **User loads a video**: System checks for existing chat sessions for that video
2. **Auto-create session**: If no session exists, creates a new one with video context
3. **Save conversations**: All Q&A interactions are saved to the session
4. **History display**: Previous conversations are shown above current ones
5. **Cross-video navigation**: Users can switch between different video sessions

### User Experience
- **Seamless Integration**: Works with existing YouTube Q&A functionality
- **Visual Distinction**: History messages have different styling than current ones
- **Auto-scroll**: Interface automatically scrolls to show new messages
- **Copy Functionality**: Users can copy both historical and current responses

## 🔧 API Usage Examples

### Create Video Session
```typescript
const session = await apiService.createChatSession(
  token,
  "https://youtube.com/watch?v=VIDEO_ID",
  "Video Title Here"
);
```

### Save Message with Context
```typescript
await apiService.addChatMessage(
  sessionId,
  "What is this video about?",
  "user",
  token,
  "https://youtube.com/watch?v=VIDEO_ID"
);
```

### Find Sessions by Video
```typescript
const sessions = await apiService.getChatSessionsByVideo(
  "https://youtube.com/watch?v=VIDEO_ID",
  token
);
```

## 🎨 UI Features

### Chat History Display
- **Chronological Order**: Messages shown in chronological order
- **Role Indicators**: Clear distinction between user and AI messages
- **Timestamps**: All messages include formatted timestamps
- **Context Badges**: Shows which session messages belong to

### Session Management
- **Session List**: Shows all user sessions with video titles
- **Message Counts**: Displays number of messages per session
- **Quick Access**: Click to switch between different video sessions

## 🔒 Security & Privacy

- **User Isolation**: Each user can only access their own chat history
- **Clerk Authentication**: Leverages existing Clerk user authentication
- **Session Validation**: All operations validate user ownership
- **Data Persistence**: Conversations survive browser sessions and app restarts

## 🚀 Benefits

1. **Enhanced User Experience**: Users don't lose their conversations when refreshing
2. **Cross-Video Learning**: Can reference previous video discussions
3. **Session Continuity**: Pick up conversations where they left off
4. **Better Organization**: Video-specific organization makes finding conversations easier
5. **Data Retention**: Build up a personal knowledge base of video interactions

## 📊 Database Schema

### Updated ChatSession Table
```sql
- id (Primary Key)
- user_id (Clerk User ID)
- created_at (Timestamp)
- title (Session Title)
- video_url (YouTube URL) ← NEW
- video_title (Video Title) ← NEW
```

### Updated ChatMessage Table
```sql
- id (Primary Key)
- session_id (Foreign Key)
- user_id (Clerk User ID)
- role (user/assistant)
- message (Text Content)
- timestamp (Creation Time)
- video_context (Video URL) ← NEW
```

## 🔄 Migration Path

For existing users:
1. Existing chat sessions continue to work
2. New video sessions get proper video context
3. Legacy sessions can be manually associated with videos if needed
4. No data loss during migration

This implementation provides a complete user-based chat history system that enhances the YouTube Q&A experience with persistent, organized conversations per user and video.