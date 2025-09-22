from fastapi import APIRouter, Depends
from app.services.groq_llm_service import GroqLLMService
from app.services.vector_store import VectorStoreService

router = APIRouter()

@router.get("/")
async def health_check():
    return {
        "status": "healthy",
        "service": "MultiModal ChatBot API"
    }

@router.get("/llm")
async def check_llm_health():
    llm_service = GroqLLMService()
    is_healthy = await llm_service.check_health()
    available_models = await llm_service.list_models()

    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "service": "Groq LLM Service",
        "model": llm_service.model,
        "available_models": available_models,
        "provider": "Groq"
    }

@router.get("/vector-store")
async def check_vector_store_health():
    vector_service = VectorStoreService()
    await vector_service.initialize()
    stats = await vector_service.get_statistics()

    return {
        "status": "healthy",
        "service": "Vector Store",
        "statistics": stats
    }