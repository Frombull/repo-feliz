from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core.errors import (
    BusinessRuleError,
    ConflictError,
    DomainError,
    NotFoundError,
)

STATUS_BY_ERROR: dict[type[DomainError], int] = {
    NotFoundError: status.HTTP_404_NOT_FOUND,
    ConflictError: status.HTTP_409_CONFLICT,
    BusinessRuleError: status.HTTP_422_UNPROCESSABLE_CONTENT,
}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(request: Request, error: DomainError):
        code = STATUS_BY_ERROR.get(type(error), status.HTTP_400_BAD_REQUEST)
        return JSONResponse(status_code=code, content={"detail": error.message})
