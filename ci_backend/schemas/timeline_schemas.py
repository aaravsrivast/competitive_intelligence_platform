from typing import Any, Dict, List

from pydantic import BaseModel


class TimelineQuarterBucket(BaseModel):
    year: int
    quarter: int
    label: str
    items: List[Dict[str, Any]]


class TimelineResponse(BaseModel):
    buckets: List[TimelineQuarterBucket]
