"""Caching layer for UdyamAI with in-memory and Redis backends.

Provides embedding cache, RAG retrieval cache, and safe LLM response cache.
LLM response caching is user-context-aware to prevent data leakage.
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from abc import ABC, abstractmethod
from threading import Lock
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


class CacheBackend(ABC):
    """Abstract cache interface."""

    @abstractmethod
    def get(self, key: str) -> Any | None: ...

    @abstractmethod
    def set(self, key: str, value: Any, ttl: int | None = None) -> None: ...

    @abstractmethod
    def delete(self, key: str) -> None: ...

    @abstractmethod
    def clear(self) -> None: ...


class InMemoryCache(CacheBackend):
    """Thread-safe in-memory cache with TTL support."""

    def __init__(self, max_size: int = 10000):
        self._store: dict[str, tuple[Any, float]] = {}
        self._max_size = max_size
        self._lock = Lock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if expires_at > 0 and time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        with self._lock:
            if len(self._store) >= self._max_size:
                self._evict_expired()
                if len(self._store) >= self._max_size:
                    # Evict oldest entries
                    oldest = sorted(self._store.items(), key=lambda x: x[1][1])[:100]
                    for k, _ in oldest:
                        del self._store[k]

            expires_at = (
                time.monotonic() + (ttl or settings.CACHE_TTL)
                if (ttl or settings.CACHE_TTL) > 0
                else 0
            )
            self._store[key] = (value, expires_at)

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

    def _evict_expired(self) -> None:
        now = time.monotonic()
        expired = [k for k, (_, exp) in self._store.items() if exp > 0 and now > exp]
        for k in expired:
            del self._store[k]


class RedisCache(CacheBackend):
    """Redis-backed cache. Falls back to InMemoryCache if Redis unavailable."""

    def __init__(self, url: str):
        try:
            import importlib

            redis = importlib.import_module("redis")
            self._client = redis.from_url(url, decode_responses=True)
            self._client.ping()
            self._available = True
            logger.info("Redis cache connected: %s", url.split("@")[-1] if "@" in url else url)
        except Exception as exc:
            logger.warning("Redis unavailable, falling back to in-memory cache: %s", exc)
            self._available = False
            self._fallback = InMemoryCache()

    def get(self, key: str) -> Any | None:
        if not self._available:
            return self._fallback.get(key)
        try:
            data = self._client.get(key)
            if data is None:
                return None
            return json.loads(data)
        except Exception:
            return None

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        if not self._available:
            return self._fallback.set(key, value, ttl)
        try:
            ttl_val = ttl or settings.CACHE_TTL
            self._client.setex(key, ttl_val, json.dumps(value, default=str))
        except Exception as exc:
            logger.debug("Redis set failed: %s", exc)

    def delete(self, key: str) -> None:
        if not self._available:
            return self._fallback.delete(key)
        try:
            self._client.delete(key)
        except Exception:
            pass

    def clear(self) -> None:
        if not self._available:
            return self._fallback.clear()
        try:
            self._client.flushdb()
        except Exception:
            pass


# ── Cache instance ────────────────────────────────────────────────────

_cache: CacheBackend | None = None


def get_cache() -> CacheBackend:
    """Return the global cache instance, creating it on first access."""
    global _cache
    if _cache is not None:
        return _cache

    if settings.CACHE_BACKEND == "redis" and settings.REDIS_URL:
        _cache = RedisCache(settings.REDIS_URL)
    else:
        _cache = InMemoryCache()
    return _cache


# ── Cache key builders ────────────────────────────────────────────────


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def embedding_cache_key(query: str, model: str) -> str:
    """Cache key for query embeddings."""
    return f"emb:{model}:{_hash(query)}"


def rag_cache_key(query: str, config_version: str = "v1") -> str:
    """Cache key for RAG retrieval results."""
    return f"rag:{config_version}:{_hash(query)}"


def llm_cache_key(query: str, model: str, user_id: str | None = None) -> str:
    """Cache key for LLM responses.

    SECURITY: If user_id is provided, it's included in the key to prevent
    one user's personalized response from being served to another user.
    """
    if user_id:
        return f"llm:{model}:{_hash(user_id)}:{_hash(query)}"
    return f"llm:{model}:{_hash(query)}"
