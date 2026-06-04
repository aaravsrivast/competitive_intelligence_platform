from math import ceil
from typing import Any, Optional

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def paginated_success_response(
    data: Any,
    total: int,
    page: int,
    limit: int,
    message: str = "OK",
    code: str = "ok",
) -> JSONResponse:
    pages = ceil(total / limit) if limit > 0 else 0
    return JSONResponse(
        content=jsonable_encoder(
            {
                "success": True,
                "message": message,
                "code": code,
                "data": data,
                "total": total,
                "page": page,
                "limit": limit,
                "pages": pages,
            }
        ),
        status_code=200,
    )


def success_response(
    data: Any = None,
    message: str = "OK",
    code: str = "ok",
    status_code: int = 200,
) -> JSONResponse:
    body: dict = {"success": True, "message": message, "code": code}
    if data is not None:
        body["data"] = jsonable_encoder(data)
    return JSONResponse(content=body, status_code=status_code)


def error_response(
    message: str,
    code: str = "error",
    status_code: int = 400,
    details: Optional[Any] = None,
) -> JSONResponse:
    body: dict = {"success": False, "message": message, "code": code}
    if details is not None:
        body["details"] = details
    return JSONResponse(content=body, status_code=status_code)
