"""
VendGuard — FAISS Vector Store Wrapper
Manages document embeddings with Google's text-embedding-004 model.
Thread-safe singleton with async-friendly interface.
"""
from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path
from typing import Optional

import numpy as np
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class VectorStore:
    """
    Singleton FAISS wrapper.
    - Embeddings: Google text-embedding-004 (768-dim)
    - Persistence: local FAISS index files
    - Namespace support: one index per document_id to avoid cross-vendor leakage
    """

    def __init__(self) -> None:
        self._embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.embedding_model,
            google_api_key=settings.gemini_api_key,
        )
        self._indexes: dict[str, FAISS] = {}   # keyed by document_id
        self._lock = asyncio.Lock()

    # ── Ingestion ──────────────────────────────────────────────────────────────

    async def add_documents(
        self,
        document_id: str,
        texts: list[str],
        metadatas: list[dict],
    ) -> int:
        """
        Embed and store chunks. Returns number of chunks indexed.
        Runs embedding in a thread-pool to avoid blocking the event loop.
        """
        loop = asyncio.get_event_loop()
        index = await loop.run_in_executor(
            None,
            lambda: FAISS.from_texts(
                texts=texts,
                embedding=self._embeddings,
                metadatas=metadatas,
            ),
        )
        async with self._lock:
            self._indexes[document_id] = index

        await self._save_index(document_id, index)
        logger.info("Indexed %d chunks for document_id=%s", len(texts), document_id)
        return len(texts)

    # ── Retrieval ──────────────────────────────────────────────────────────────

    async def similarity_search(
        self,
        document_id: str,
        query: str,
        k: int = 8,
    ) -> list[tuple[str, dict, float]]:
        """
        Returns list of (text, metadata, score) tuples.
        Score is cosine similarity (0-1); higher = more relevant.
        """
        index = await self._get_index(document_id)
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            lambda: index.similarity_search_with_relevance_scores(query, k=k),
        )
        return [(doc.page_content, doc.metadata, score) for doc, score in results]

    # ── Persistence ────────────────────────────────────────────────────────────

    async def _save_index(self, document_id: str, index: FAISS) -> None:
        path = self._index_path(document_id)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: index.save_local(str(path)))
        logger.debug("Saved FAISS index to %s", path)

    async def _get_index(self, document_id: str) -> FAISS:
        async with self._lock:
            if document_id in self._indexes:
                return self._indexes[document_id]

        # Try loading from disk
        path = self._index_path(document_id)
        if path.exists():
            loop = asyncio.get_event_loop()
            index = await loop.run_in_executor(
                None,
                lambda: FAISS.load_local(
                    str(path),
                    self._embeddings,
                    allow_dangerous_deserialization=True,
                ),
            )
            async with self._lock:
                self._indexes[document_id] = index
            return index

        raise FileNotFoundError(
            f"No FAISS index found for document_id={document_id!r}. "
            "Upload the document first via POST /api/v1/audit/upload"
        )

    @staticmethod
    def _index_path(document_id: str) -> Path:
        base = Path(settings.faiss_index_path)
        base.mkdir(parents=True, exist_ok=True)
        return base / document_id


# ── Singleton ──────────────────────────────────────────────────────────────────

_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
