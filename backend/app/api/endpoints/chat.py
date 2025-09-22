from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
import asyncio
from loguru import logger

from app.db.database import get_db
from app.models.models import ChatSession as ChatSessionModel, Message, Document
from app.services.chat_service import ChatSessionService
from app.services.groq_llm_service import GroqLLMService
from app.services.vector_store import VectorStoreService

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    use_knowledge_base: bool = True
    selected_documents: Optional[List[str]] = None
    stream: bool = False

class CreateSessionRequest(BaseModel):
    title: Optional[str] = None

chat_sessions = {}

@router.post("/sessions")
async def create_session(
    request: CreateSessionRequest,
    db: AsyncSession = Depends(get_db)
):
    session = ChatSessionModel(
        title=request.title or "New Chat"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    chat_sessions[session.id] = ChatSessionService(session.id)

    return {
        "session_id": session.id,
        "title": session.title,
        "created_at": session.created_at
    }

@router.get("/sessions")
async def list_sessions(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ChatSessionModel)
        .where(ChatSessionModel.is_active == True)
        .order_by(ChatSessionModel.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    sessions = result.scalars().all()

    return {
        "sessions": [
            {
                "id": session.id,
                "title": session.title,
                "created_at": session.created_at,
                "updated_at": session.updated_at
            }
            for session in sessions
        ]
    }

@router.post("/message")
async def send_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        if request.session_id:
            result = await db.execute(
                select(ChatSessionModel).where(ChatSessionModel.id == request.session_id)
            )
            session_model = result.scalar_one_or_none()
            if not session_model:
                raise HTTPException(status_code=404, detail="Session not found")
        else:
            session_model = ChatSessionModel(title="New Chat")
            db.add(session_model)
            await db.commit()
            await db.refresh(session_model)
            request.session_id = session_model.id

        if request.session_id not in chat_sessions:
            chat_sessions[request.session_id] = ChatSessionService(request.session_id)

        chat_session = chat_sessions[request.session_id]

        context = None
        # Only use knowledge base if documents are explicitly selected
        if request.use_knowledge_base and request.selected_documents and len(request.selected_documents) > 0:
            vector_service = VectorStoreService()
            await vector_service.initialize()

            # Get document paths for selected document IDs
            selected_paths = []
            for doc_id in request.selected_documents:
                doc_result = await db.execute(
                    select(Document).where(Document.id == doc_id)
                )
                doc = doc_result.scalar_one_or_none()
                if doc:
                    selected_paths.append(doc.file_path)

            if selected_paths:
                filter_metadata = {"file_paths": selected_paths}
                search_results = await vector_service.search(
                    request.message,
                    n_results=5,
                    filter_metadata=filter_metadata
                )

                if search_results:
                    context = "\n\n".join([result["content"] for result in search_results])
                    chat_session.set_context(context)
                    logger.info(f"Using context from {len(selected_paths)} selected documents")

        message = Message(
            session_id=request.session_id,
            role="user",
            content=request.message,
            context=context
        )
        db.add(message)

        if request.stream:
            async def generate():
                full_response = ""
                async for chunk in await chat_session.generate_response(request.message, stream=True):
                    full_response += chunk
                    yield f"data: {json.dumps({'content': chunk})}\n\n"

                assistant_message = Message(
                    session_id=request.session_id,
                    role="assistant",
                    content=full_response
                )
                db.add(assistant_message)
                await db.commit()

                yield f"data: {json.dumps({'done': True})}\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")
        else:
            response = await chat_session.generate_response(request.message, stream=False)

            assistant_message = Message(
                session_id=request.session_id,
                role="assistant",
                content=response
            )
            db.add(assistant_message)
            await db.commit()

            return {
                "session_id": request.session_id,
                "response": response,
                "context_used": bool(context)
            }

    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.timestamp.asc())
        .offset(skip)
        .limit(limit)
    )
    messages = result.scalars().all()

    return {
        "session_id": session_id,
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp
            }
            for msg in messages
        ]
    }

@router.websocket("/ws/{session_id}")
async def websocket_chat(
    websocket: WebSocket,
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    await websocket.accept()

    try:
        result = await db.execute(
            select(ChatSessionModel).where(ChatSessionModel.id == session_id)
        )
        session_model = result.scalar_one_or_none()
        if not session_model:
            await websocket.close(code=1008, reason="Session not found")
            return

        if session_id not in chat_sessions:
            chat_sessions[session_id] = ChatSessionService(session_id)

        chat_session = chat_sessions[session_id]

        while True:
            data = await websocket.receive_json()
            message = data.get("message", "")

            vector_service = VectorStoreService()
            await vector_service.initialize()
            search_results = await vector_service.search(message, n_results=3)

            context = None
            if search_results:
                context = "\n\n".join([result["content"] for result in search_results])
                chat_session.set_context(context)

            user_message = Message(
                session_id=session_id,
                role="user",
                content=message,
                context=context
            )
            db.add(user_message)

            full_response = ""
            async for chunk in await chat_session.generate_response(message, stream=True):
                full_response += chunk
                await websocket.send_json({"type": "chunk", "content": chunk})

            assistant_message = Message(
                session_id=session_id,
                role="assistant",
                content=full_response
            )
            db.add(assistant_message)
            await db.commit()

            await websocket.send_json({"type": "complete", "content": full_response})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close(code=1011, reason=str(e))