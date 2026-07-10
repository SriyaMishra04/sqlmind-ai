from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class QueryRequest(BaseModel):
    prompt: str
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None

class ChartSuggestion(BaseModel):
    type: str # bar, line, area, pie, scatter
    x_axis: str
    y_axis: str
    title: str

class QueryResponse(BaseModel):
    success: bool
    sql: Optional[str] = None
    summary: Optional[str] = None
    explanation: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    columns: Optional[List[str]] = None
    row_count: Optional[int] = None
    execution_time_ms: Optional[float] = None
    chart_suggestion: Optional[ChartSuggestion] = None
    error: Optional[str] = None

class UploadResponse(BaseModel):
    db_id: str
    filename: str
    tables: List[str]
    schema_info: Dict[str, Any]
    suggested_questions: List[str]

class HistoryItem(BaseModel):
    id: str
    db_id: str
    question: str
    sql: str
    timestamp: float
    execution_time_ms: float
    status: str
    is_favorite: bool = False
