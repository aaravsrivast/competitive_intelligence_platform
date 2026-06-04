from typing import List, Optional

from pydantic import BaseModel


class CompetitorFinancialsItem(BaseModel):
    company: str
    financials_markdown: str


class CompetitorsResponse(BaseModel):
    companies: List[str]
    financials: Optional[CompetitorFinancialsItem] = None
