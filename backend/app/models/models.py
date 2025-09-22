from sqlalchemy import Column, String, DateTime, Integer, Text, Float, JSON, Boolean
from sqlalchemy.sql import func
from app.db.database import Base
import uuid

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    file_path = Column(String, unique=True, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_hash = Column(String, unique=True, nullable=False)
    content = Column(Text)
    doc_metadata = Column(JSON)  # Renamed from metadata
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True)
    title = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_active = Column(Boolean, default=True)

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())
    token_count = Column(Integer, nullable=True)

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, nullable=False)
    chunk_id = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding_id = Column(String, nullable=True)
    chunk_metadata = Column(JSON)  # Renamed from metadata
    created_at = Column(DateTime, server_default=func.now())