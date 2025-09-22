from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from loguru import logger

from app.services.vector_store import VectorStoreService

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    n_results: int = 5
    file_type: Optional[str] = None

@router.post("/search")
async def search_knowledge_base(request: SearchRequest):
    try:
        vector_service = VectorStoreService()
        await vector_service.initialize()

        filter_metadata = None
        if request.file_type:
            filter_metadata = {"file_type": request.file_type}

        results = await vector_service.search(
            query=request.query,
            n_results=request.n_results,
            filter_metadata=filter_metadata
        )

        return {
            "query": request.query,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Error searching knowledge base: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics")
async def get_knowledge_base_stats():
    try:
        vector_service = VectorStoreService()
        await vector_service.initialize()
        stats = await vector_service.get_statistics()

        return stats
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear")
async def clear_knowledge_base():
    try:
        vector_service = VectorStoreService()
        await vector_service.initialize()
        success = await vector_service.clear_all()

        if success:
            return {"message": "Knowledge base cleared successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to clear knowledge base")
    except Exception as e:
        logger.error(f"Error clearing knowledge base: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))