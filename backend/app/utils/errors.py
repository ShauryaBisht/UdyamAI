import logging

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("udyam_ai")


def setup_exception_handlers(app):
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.error(f"HTTP error on {request.url.path}: {exc.detail}")

        # If detail is already a dict, return it directly inside "detail" or unpack
        detail = exc.detail
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": detail,
                "error_code": f"HTTP_{exc.status_code}",
                "status_code": exc.status_code,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = exc.errors()
        logger.error(f"Validation error on {request.url.path}: {errors}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation error",
                "errors": errors,
                "error_code": "VALIDATION_ERROR",
                "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled error on {request.url.path}: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected error occurred on the server.",
                "error_code": "INTERNAL_SERVER_ERROR",
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            },
        )
