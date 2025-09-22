from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import shutil
from pathlib import Path
from datetime import datetime
from loguru import logger

from app.db.database import get_db, async_session
from app.models.models import Document
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import VectorStoreService
from app.core.config import settings

router = APIRouter()

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        file_extension = Path(file.filename).suffix.lower().lstrip('.')

        if file_extension not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_extension} not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
            )

        if file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE} bytes"
            )

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        processor = DocumentProcessor()
        file_hash = processor._calculate_file_hash(file_path)

        existing_doc = await db.execute(
            select(Document).where(Document.file_hash == file_hash)
        )
        if existing_doc.scalar_one_or_none():
            os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail="Document with the same content already exists"
            )

        document = Document(
            filename=file.filename,
            file_path=file_path,
            file_type=file_extension,
            file_size=file.size,
            file_hash=file_hash,
            processed=False
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)

        background_tasks.add_task(process_document_task, document.id, file_path, file_extension)

        return {
            "message": "Document uploaded successfully",
            "document_id": document.id,
            "filename": file.filename,
            "status": "processing"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

async def process_document_task(document_id: str, file_path: str, file_type: str):
    try:
        processor = DocumentProcessor()
        vector_service = VectorStoreService()
        await vector_service.initialize()

        processed_data = await processor.process_document(file_path, file_type)

        await vector_service.add_documents([processed_data])

        async with async_session() as db:
            result = await db.execute(
                select(Document).where(Document.id == document_id)
            )
            document = result.scalar_one_or_none()
            if document:
                document.content = processed_data["content"]
                document.doc_metadata = processed_data["metadata"]
                document.processed = True
                await db.commit()

        logger.info(f"Document {document_id} processed successfully")
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")

@router.get("/list")
async def list_documents(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document)
        .order_by(Document.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    documents = result.scalars().all()

    return {
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "processed": doc.processed,
                "created_at": doc.created_at
            }
            for doc in documents
        ]
    }

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    vector_service = VectorStoreService()
    await vector_service.initialize()
    await vector_service.delete_by_file(document.file_path)

    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    await db.delete(document)
    await db.commit()

    return {"message": "Document deleted successfully"}