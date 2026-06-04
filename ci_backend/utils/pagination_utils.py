from math import ceil
from typing import Any, Generic, List, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    limit: int
    pages: int


def paginate(
    items: List[Any],
    total: int,
    page: int,
    limit: int,
) -> PaginatedResponse[Any]:
    pages = ceil(total / limit) if limit > 0 else 0
    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )
