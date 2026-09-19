import logging
import threading
import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

from app.config import settings

logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    """
    Extract the client IP address from the request.
    If the X-Forwarded-For header is present, it uses the leftmost IP address.
    Otherwise, it falls back to request.client.host.
    Handles missing request.client safely.
    """
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        # Extract the leftmost IP address in the comma-separated list
        parts = [ip.strip() for ip in x_forwarded_for.split(",")]
        if parts and parts[0]:
            return parts[0]

    if request.client:
        return request.client.host
    return "unknown"


class RateLimiter:
    """
    Thread-safe, in-memory sliding window rate limiter dependency for FastAPI.

    Also usable as a plain ``check(key)`` call for callers that need a key other
    than the client IP.
    """

    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.request_history = defaultdict(list)
        self.lock = threading.Lock()

    def check(self, key: str) -> None:
        """Enforce the limit for an arbitrary key (not just a client IP).

        Used directly by callers that need a different identity than the request
        IP, e.g. the WhatsApp webhook keying on the sender's phone number.
        """
        now = time.time()

        with self.lock:
            # Keep only requests within the active time window
            history = [
                t for t in self.request_history.get(key, ()) if now - t < self.window_seconds
            ]
            if not history:
                # Drop the key once its window is empty so keying on high-cardinality
                # values (e.g. phone numbers) does not grow the dict forever.
                self.request_history.pop(key, None)

            if len(history) >= self.requests_limit:
                self.request_history[key] = history
                logger.warning(
                    f"Rate limit exceeded for {key}. "
                    f"Requests: {len(history)}/{self.requests_limit} "
                    f"in last {self.window_seconds}s"
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                )

            history.append(now)
            self.request_history[key] = history

    def __call__(self, request: Request):
        self.check(get_client_ip(request))


# Default global rate limiter instance
default_limiter = RateLimiter(
    requests_limit=settings.API_RATE_LIMIT_REQUESTS, window_seconds=settings.API_RATE_LIMIT_WINDOW
)
