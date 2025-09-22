import os
from typing import List, Dict, Any, Optional, AsyncGenerator
import json
from datetime import datetime
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
import httpx
from groq import Groq, AsyncGroq

from app.core.config import settings

class GroqLLMService:
    """Service for interacting with Groq's LLM API"""

    # Groq's current free models (as of late 2024)
    AVAILABLE_MODELS = {
        "llama-3.1-8b-instant": "LLaMA 3.1 8B Instant (Fast, 128k context)",
        "llama-3.1-70b-versatile": "LLaMA 3.1 70B Versatile (Best quality)",
        "llama-3.2-1b-preview": "LLaMA 3.2 1B Preview (Fastest)",
        "llama-3.2-3b-preview": "LLaMA 3.2 3B Preview (Fast)",
        "gemma2-9b-it": "Gemma2 9B Instruct"
    }

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.max_tokens = settings.MAX_TOKENS
        self.temperature = settings.TEMPERATURE

        # Initialize Groq clients
        self.client = Groq(api_key=self.api_key)
        self.async_client = AsyncGroq(api_key=self.api_key)

        logger.info(f"Initialized Groq LLM Service with model: {self.model}")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def generate_response(
        self,
        prompt: str,
        context: Optional[str] = None,
        system_prompt: Optional[str] = None,
        stream: bool = False
    ) -> str | AsyncGenerator[str, None]:
        """Generate a response using Groq's API"""
        try:
            messages = self._build_messages(prompt, context, system_prompt)

            if stream:
                return self._stream_response(messages)
            else:
                completion = await self.async_client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                    stream=False
                )
                return completion.choices[0].message.content or ""

        except Exception as e:
            logger.error(f"Error generating response with Groq: {str(e)}")
            raise

    async def _stream_response(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """Stream response from Groq API"""
        try:
            stream = await self.async_client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error(f"Error in stream response: {str(e)}")
            yield f"Error: {str(e)}"

    def _build_messages(
        self,
        user_prompt: str,
        context: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """Build message list for Groq API"""
        messages = []

        # Add system prompt if provided
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })

        # Add context if provided
        if context:
            context_message = f"Here is some context to help answer the question:\n\n{context}\n\nNow, please answer the following question:"
            messages.append({
                "role": "system",
                "content": context_message
            })

        # Add user prompt
        messages.append({
            "role": "user",
            "content": user_prompt
        })

        return messages

    async def generate_embeddings(self, text: str) -> List[float]:
        """
        Generate embeddings for text.
        Note: Groq doesn't provide embedding models yet, so we use a simple hash-based approach
        """
        try:
            import hashlib

            # Simple hash-based embedding for demo
            text_bytes = text.encode('utf-8')
            hash_object = hashlib.sha256(text_bytes)
            hash_hex = hash_object.hexdigest()

            # Convert to vector
            embedding = []
            for i in range(0, min(len(hash_hex), 96), 8):  # 384/4 = 96
                chunk = hash_hex[i:i+8]
                value = int(chunk, 16) / (2**32) - 0.5
                embedding.append(value)

            # Pad to 384 dimensions
            while len(embedding) < 384:
                embedding.append(0.0)

            return embedding[:384]

        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            return []

    async def list_models(self) -> List[Dict[str, Any]]:
        """List available Groq models"""
        return [
            {"name": model_id, "description": desc}
            for model_id, desc in self.AVAILABLE_MODELS.items()
        ]

    async def check_health(self) -> bool:
        """Check if Groq API is accessible"""
        try:
            # Make a simple API call to check connectivity
            completion = await self.async_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=5,
                temperature=0
            )
            return True
        except Exception as e:
            logger.error(f"Groq health check failed: {str(e)}")
            return False

    def estimate_tokens(self, text: str) -> int:
        """Estimate token count for text (rough approximation)"""
        # Rough estimation: 1 token ≈ 4 characters
        return len(text) // 4

    async def generate_with_retry(
        self,
        prompt: str,
        context: Optional[str] = None,
        system_prompt: Optional[str] = None,
        fallback_model: Optional[str] = None
    ) -> str:
        """Generate response with automatic fallback to another model if needed"""
        try:
            return await self.generate_response(prompt, context, system_prompt)
        except Exception as e:
            if fallback_model and fallback_model in self.AVAILABLE_MODELS:
                logger.warning(f"Primary model failed, trying fallback: {fallback_model}")
                original_model = self.model
                self.model = fallback_model
                try:
                    response = await self.generate_response(prompt, context, system_prompt)
                    self.model = original_model
                    return response
                except Exception as fallback_e:
                    self.model = original_model
                    logger.error(f"Fallback model also failed: {str(fallback_e)}")
                    raise
            raise