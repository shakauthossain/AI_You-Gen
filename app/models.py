from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    clerk_id = Column(String, unique=True, index=True, nullable=False)  # Clerk user id (sub)
    email = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatSession(Base):
    __tablename__ = 'chat_sessions'
    id = Column(Integer, primary_key=True)
    user_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    title = Column(String, default="Untitled Session")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey('chat_sessions.id'), nullable=False)
    user_id = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    session = relationship("ChatSession", back_populates="messages")
