from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger

from app.services.groq_llm_service import GroqLLMService

class ChatSessionService:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.history: List[Dict[str, str]] = []
        self.context: Optional[str] = None
        self.llm_service = GroqLLMService()

    def add_message(self, role: str, content: str):
        self.history.append({
            "role": role,
            "content": content,
            "timestamp": str(datetime.utcnow())
        })

    def set_context(self, context: str):
        self.context = context

    async def generate_response(self, user_message: str, stream: bool = False):
        self.add_message("user", user_message)

        system_prompt = """You are a helpful AI assistant with access to a knowledge base.
        Use the provided context to answer questions accurately.
        If the context doesn't contain relevant information, say so and provide a general response."""

        response = await self.llm_service.generate_response(
            prompt=user_message,
            context=self.context,
            system_prompt=system_prompt,
            stream=stream
        )

        if not stream:
            self.add_message("assistant", response)

        return response

    def get_history(self, limit: Optional[int] = None) -> List[Dict[str, str]]:
        if limit:
            return self.history[-limit:]
        return self.history

    def clear_history(self):
        self.history = []
        self.context = None