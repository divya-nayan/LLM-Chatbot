from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from loguru import logger

from app.core.config import settings
from app.api.endpoints import documents, chat, knowledge_base, health
from app.db.database import init_db
from app.services.vector_store import VectorStoreService

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
    os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)

    await init_db()

    vector_service = VectorStoreService()
    await vector_service.initialize()

    yield

    logger.info("Shutting down application")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=f"{settings.API_PREFIX}/health", tags=["health"])
app.include_router(documents.router, prefix=f"{settings.API_PREFIX}/documents", tags=["documents"])
app.include_router(chat.router, prefix=f"{settings.API_PREFIX}/chat", tags=["chat"])
app.include_router(knowledge_base.router, prefix=f"{settings.API_PREFIX}/knowledge", tags=["knowledge"])

if settings.DEBUG:
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_PREFIX}/docs"
    }