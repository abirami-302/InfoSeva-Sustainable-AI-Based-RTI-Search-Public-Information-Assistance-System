from datetime import datetime
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config.logging_config import get_logger

logger = get_logger("exception_handler")


def _build_error_payload(
    status_code: int,
    error_code: str,
    error_type: str,
    message: str,
    path: str,
    details: None = None
) -> dict:
    return {
        "success": False,
        "status": status_code,
        "error": {
            "code": error_code,
            "type": error_type,
            "message": message,
            "details": details
        },
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "path": path
    }


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Handles HTTPExceptions thrown across FastAPI routes.
    """
    logger.warning(f"HTTP {exc.status_code} error on path '{request.url.path}': {exc.detail}")
    payload = _build_error_payload(
        status_code=exc.status_code,
        error_code=f"HTTP_{exc.status_code}",
        error_type="HTTPException",
        message=str(exc.detail),
        path=request.url.path
    )
    return JSONResponse(status_code=exc.status_code, content=payload)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handles Pydantic input validation errors on request body or parameters.
    """
    errors_summary = "; ".join([f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in exc.errors()])
    logger.warning(f"Validation failure on path '{request.url.path}': {errors_summary}")

    payload = _build_error_payload(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        error_code="VALIDATION_ERROR",
        error_type="RequestValidationError",
        message="Invalid request body or parameter format.",
        path=request.url.path,
        details=errors_summary
    )
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload)


async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    """
    Handles business validation ValueErrors raised by services.
    """
    logger.warning(f"Business validation ValueError on path '{request.url.path}': {str(exc)}")
    payload = _build_error_payload(
        status_code=status.HTTP_400_BAD_REQUEST,
        error_code="BAD_REQUEST",
        error_type="ValueError",
        message=str(exc),
        path=request.url.path
    )
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=payload)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all global exception handler for unexpected internal server errors.
    Logs full exception trace internally while sanitizing external client response.
    """
    logger.error(f"Unhandled exception on path '{request.url.path}': {str(exc)}", exc_info=True)
    payload = _build_error_payload(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_SERVER_ERROR",
        error_type="ServerError",
        message="An internal server error occurred while processing your request.",
        path=request.url.path
    )
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=payload)


def register_exception_handlers(app) -> None:
    """
    Registers custom exception middleware handlers with the FastAPI application instance.
    """
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValueError, value_error_handler)
    app.add_exception_handler(Exception, global_exception_handler)
