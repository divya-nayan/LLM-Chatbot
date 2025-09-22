from typing import List, Dict, Any, Optional
import os
import chromadb
from chromadb.config import Settings as ChromaSettings
import numpy as np
from loguru import logger
import uuid
import hashlib

from app.core.config import settings

class VectorStoreService:
    def __init__(self):
        self.chroma_client = None
        self.collection = None
        self.collection_name = "knowledge_base"

    async def initialize(self):
        try:
            logger.info(f"Initializing ChromaDB with persist directory: {settings.CHROMA_PERSIST_DIR}")
            self.chroma_client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(anonymized_telemetry=False)
            )

            # Use ChromaDB's default embedding function
            self.collection = self.chroma_client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )

            logger.info("Vector store initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {str(e)}")
            raise

    def _simple_text_embedding(self, text: str) -> List[float]:
        """Simple text embedding using hash-based method as fallback"""
        # This is a simple hash-based embedding for demo purposes
        # In production, you might want to use Groq's embedding API when available
        text_bytes = text.encode('utf-8')
        hash_object = hashlib.sha256(text_bytes)
        hash_hex = hash_object.hexdigest()

        # Convert hash to a vector of floats
        embedding = []
        for i in range(0, len(hash_hex), 8):
            chunk = hash_hex[i:i+8]
            value = int(chunk, 16) / (2**32) - 0.5  # Normalize to [-0.5, 0.5]
            embedding.append(value)

        # Pad or truncate to fixed size (e.g., 384 dimensions)
        target_size = 384
        if len(embedding) < target_size:
            embedding.extend([0.0] * (target_size - len(embedding)))
        else:
            embedding = embedding[:target_size]

        return embedding

    async def add_documents(self, documents: List[Dict[str, Any]]) -> List[str]:
        try:
            ids = []
            texts = []
            metadatas = []
            embeddings = []

            for doc in documents:
                for chunk in doc.get("chunks", []):
                    doc_id = str(uuid.uuid4())
                    ids.append(doc_id)
                    texts.append(chunk["content"])

                    metadata = {
                        "file_path": doc["metadata"]["file_path"],
                        "file_type": doc["metadata"]["file_type"],
                        "filename": doc["metadata"].get("filename", doc["metadata"]["file_path"].split("/")[-1]),
                        "chunk_id": chunk["chunk_id"],
                        "processed_at": doc["metadata"]["processed_at"],
                        "file_hash": doc["metadata"]["file_hash"]
                    }
                    metadatas.append(metadata)

                    # Use simple embedding for now
                    embedding = self._simple_text_embedding(chunk["content"])
                    embeddings.append(embedding)

            if texts:
                self.collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    documents=texts,
                    metadatas=metadatas
                )

                logger.info(f"Added {len(ids)} document chunks to vector store")

            return ids
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {str(e)}")
            raise

    async def search(
        self,
        query: str,
        n_results: int = 5,
        filter_metadata: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        try:
            # Use simple embedding for query
            query_embedding = self._simple_text_embedding(query)

            # Build ChromaDB where clause for filtering
            where_clause = None
            if filter_metadata:
                if "file_paths" in filter_metadata:
                    # Filter by multiple file paths
                    where_clause = {"file_path": {"$in": filter_metadata["file_paths"]}}
                elif "file_type" in filter_metadata:
                    # Filter by file type
                    where_clause = {"file_type": filter_metadata["file_type"]}
                else:
                    where_clause = filter_metadata

            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_clause,
                include=["documents", "metadatas", "distances"]
            )

            formatted_results = []
            if results["documents"] and len(results["documents"]) > 0:
                for i in range(len(results["documents"][0])):
                    formatted_results.append({
                        "content": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                        "score": 1 - results["distances"][0][i] if results["distances"] else 0
                    })

            return formatted_results
        except Exception as e:
            logger.error(f"Error searching vector store: {str(e)}")
            raise

    async def delete_by_file(self, file_path: str) -> bool:
        try:
            self.collection.delete(
                where={"file_path": file_path}
            )
            logger.info(f"Deleted documents for file: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error deleting documents: {str(e)}")
            return False

    async def get_statistics(self) -> Dict[str, Any]:
        try:
            count = self.collection.count()

            all_results = self.collection.get()
            unique_files = set()
            if all_results["metadatas"]:
                for metadata in all_results["metadatas"]:
                    if metadata and "file_path" in metadata:
                        unique_files.add(metadata["file_path"])

            return {
                "total_chunks": count,
                "total_documents": len(unique_files),
                "collection_name": self.collection_name,
                "embedding_method": "simple_hash"
            }
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}")
            return {
                "total_chunks": 0,
                "total_documents": 0,
                "error": str(e)
            }

    async def clear_all(self) -> bool:
        try:
            self.chroma_client.delete_collection(self.collection_name)
            self.collection = self.chroma_client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("Cleared all documents from vector store")
            return True
        except Exception as e:
            logger.error(f"Error clearing vector store: {str(e)}")
            return False