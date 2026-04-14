"""
VendGuard — Document Ingestion Service
Handles PDF parsing, chunking, embedding, and FAISS indexing.
"""
from __future__ import annotations

import hashlib
import logging
import uuid
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings
from app.core.vector_store import get_vector_store

logger = logging.getLogger(__name__)
settings = get_settings()


class IngestionResult:
    """Value object returned after a successful ingestion."""
    __slots__ = ("document_id", "filename", "pages", "chunks")

    def __init__(self, document_id: str, filename: str, pages: int, chunks: int) -> None:
        self.document_id = document_id
        self.filename = filename
        self.pages = pages
        self.chunks = chunks

    def __repr__(self) -> str:
        return (
            f"IngestionResult(document_id={self.document_id!r}, "
            f"filename={self.filename!r}, pages={self.pages}, chunks={self.chunks})"
        )


class IngestionService:
    """
    Orchestrates the full PDF → chunks → embeddings → FAISS pipeline.

    Step 1: Parse PDF with PyMuPDF (preserves page numbers for source citation)
    Step 2: Split with RecursiveCharacterTextSplitter (optimised for compliance prose)
    Step 3: Enrich metadata (page_number, paragraph_index, source)
    Step 4: Embed + index in FAISS via VectorStore
    """

    def __init__(self) -> None:
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len,
            is_separator_regex=False,
            add_start_index=True,
        )
        self._vector_store = get_vector_store()

    async def ingest_pdf(
        self,
        file_path: str | Path,
        filename: str,
        document_id: Optional[str] = None,
    ) -> IngestionResult:
        """
        Parse, chunk, embed and index a PDF file.
        Returns an IngestionResult with document_id for subsequent RAG queries.
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"PDF not found: {file_path}")

        if document_id is None:
            document_id = self._generate_document_id(file_path, filename)

        logger.info("Starting ingestion: file=%s document_id=%s", filename, document_id)

        # Step 1: Parse PDF
        pages_data = self._parse_pdf(file_path)
        total_pages = len(pages_data)
        logger.info("Parsed %d pages from %s", total_pages, filename)

        # Step 2 & 3: Split and enrich metadata
        texts, metadatas = self._chunk_pages(pages_data, filename, document_id)
        logger.info("Created %d chunks from %d pages", len(texts), total_pages)

        # Step 4: Embed and index
        chunk_count = await self._vector_store.add_documents(
            document_id=document_id,
            texts=texts,
            metadatas=metadatas,
        )

        return IngestionResult(
            document_id=document_id,
            filename=filename,
            pages=total_pages,
            chunks=chunk_count,
        )

    # ── Private Helpers ────────────────────────────────────────────────────────

    def _parse_pdf(self, file_path: Path) -> list[dict]:
        """
        Extract text per page using PyMuPDF.
        Returns list of {'page_number': int, 'text': str} dicts.
        """
        doc = fitz.open(str(file_path))
        pages = []
        try:
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text("text")  # type: ignore[call-overload]
                if text.strip():
                    pages.append({
                        "page_number": page_num + 1,  # 1-indexed for human display
                        "text": text,
                    })
        finally:
            doc.close()
        return pages

    def _chunk_pages(
        self,
        pages_data: list[dict],
        filename: str,
        document_id: str,
    ) -> tuple[list[str], list[dict]]:
        """
        Split page texts into overlapping chunks and attach rich metadata.
        Metadata preserved:
          - page_number:      original PDF page (for citation)
          - paragraph_index:  position within page splits
          - source:           original filename
          - document_id:      for FAISS namespace lookup
          - chunk_id:         unique identifier for this specific chunk
        """
        all_texts: list[str] = []
        all_metadatas: list[dict] = []

        for page_data in pages_data:
            page_num = page_data["page_number"]
            page_text = page_data["text"]

            # Split the page into paragraphs first, then apply the text splitter
            splits = self._splitter.split_text(page_text)

            for para_idx, chunk_text in enumerate(splits):
                chunk_text = chunk_text.strip()
                if not chunk_text:
                    continue

                chunk_id = str(uuid.uuid4())
                all_texts.append(chunk_text)
                all_metadatas.append({
                    "page_number": page_num,
                    "paragraph_index": para_idx,
                    "source": filename,
                    "document_id": document_id,
                    "chunk_id": chunk_id,
                    "char_count": len(chunk_text),
                })

        return all_texts, all_metadatas

    @staticmethod
    def _generate_document_id(file_path: Path, filename: str) -> str:
        """
        Deterministic document ID based on file hash + name.
        Re-uploading the same file returns the same document_id.
        """
        hasher = hashlib.sha256()
        hasher.update(filename.encode())
        # Hash first 64KB for speed on large PDFs
        with open(file_path, "rb") as f:
            hasher.update(f.read(65536))
        return hasher.hexdigest()[:16]
