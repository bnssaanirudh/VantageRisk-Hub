"""
VendGuard — Gemini LLM Client (LangChain)
Provides a configured, retry-ready ChatGoogleGenerativeAI singleton.
All AI calls in the services layer import from here.
"""
from __future__ import annotations

import logging
from typing import Optional

from langchain_core.rate_limiters import InMemoryRateLimiter
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Gemini 1.5 Pro: 60 requests/min on free tier, 360 on paid.
# The rate limiter prevents 429s during bulk audits.
_rate_limiter = InMemoryRateLimiter(
    requests_per_second=0.5,   # conservative: 30 req/min
    check_every_n_seconds=0.1,
    max_bucket_size=10,
)

_llm_instance: Optional[ChatGoogleGenerativeAI] = None


def get_llm() -> ChatGoogleGenerativeAI:
    """Returns a cached Gemini 1.5 Pro client with structured JSON output."""
    global _llm_instance

    if _llm_instance is None:
        _llm_instance = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.gemini_api_key,
            temperature=settings.gemini_temperature,
            # Force structured JSON output — eliminates markdown fences, etc.
            response_mime_type="application/json",
            # Retry config via langchain_core tenacity
            max_retries=3,
            rate_limiter=_rate_limiter,
            # Safety settings — loosen for compliance content 
            safety_settings={
                "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
                "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
                "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
                "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
            },
        )
        logger.info("Gemini client initialised: model=%s", settings.gemini_model)

    return _llm_instance
