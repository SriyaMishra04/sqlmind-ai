import json
import time
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException
from app.config import UPLOAD_DIR, HISTORY_FILE
from app.schemas import QueryRequest, QueryResponse
from app.services.sql_generator import SQLGenerator
from app.services.sql_validator import SQLValidator
from app.services.sql_executor import SQLExecutor

router = APIRouter(prefix="/query", tags=["Query"])

def add_to_history(db_id: str, question: str, sql: str, exec_time: float, status: str):
    """Saves a query run to history.json."""
    history = []
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            history = []

    history_item = {
        "id": uuid.uuid4().hex,
        "db_id": db_id,
        "question": question,
        "sql": sql,
        "timestamp": time.time(),
        "execution_time_ms": exec_time,
        "status": status,
        "is_favorite": False
    }
    
    # Prepend to keep latest first
    history.insert(0, history_item)
    # Limit to last 100 entries
    history = history[:100]

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

@router.post("/{db_id}", response_model=QueryResponse)
async def query_database(db_id: str, request: QueryRequest):
    db_file_path = UPLOAD_DIR / f"{db_id}.db"
    metadata_path = UPLOAD_DIR / f"{db_id}.json"

    if not db_file_path.exists() or not metadata_path.exists():
        raise HTTPException(status_code=404, detail="Database not found or session expired.")

    # 1. Read cached schema metadata
    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        schema_info = metadata["schema_info"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read schema metadata: {str(e)}")

    # 2. Call LLM to generate SQL & explanations
    try:
        ai_output = SQLGenerator.generate_sql(
            schema_info=schema_info,
            user_prompt=request.prompt,
            provider=request.provider,
            model=request.model,
            api_key=request.api_key
        )
    except Exception as e:
        # Fallback history log for LLM failures
        add_to_history(db_id, request.prompt, "LLM Failure", 0.0, "error")
        return QueryResponse(
            success=False,
            error=f"AI SQL generation error: {str(e)}"
        )

    generated_sql = ai_output.get("sql", "").strip()
    summary = ai_output.get("summary", "")
    explanation = ai_output.get("explanation", "")

    # 3. Validate generated SQL
    is_valid, validation_error = SQLValidator.validate(generated_sql)
    if not is_valid:
        add_to_history(db_id, request.prompt, generated_sql, 0.0, "error")
        return QueryResponse(
            success=False,
            sql=generated_sql,
            summary=summary,
            explanation=explanation,
            error=f"SQL Security Validation Denied: {validation_error}"
        )

    # 4. Execute SQL
    exec_result = SQLExecutor.execute(db_file_path, generated_sql)
    
    status = "success" if exec_result["success"] else "error"
    exec_time = exec_result.get("execution_time_ms", 0.0)
    
    # Save to history log
    add_to_history(db_id, request.prompt, generated_sql, exec_time, status)

    if not exec_result["success"]:
        return QueryResponse(
            success=False,
            sql=generated_sql,
            summary=summary,
            explanation=explanation,
            execution_time_ms=exec_time,
            error=exec_result["error"]
        )

    return QueryResponse(
        success=True,
        sql=generated_sql,
        summary=summary,
        explanation=explanation,
        data=exec_result["data"],
        columns=exec_result["columns"],
        row_count=exec_result["row_count"],
        execution_time_ms=exec_time,
        chart_suggestion=exec_result["chart_suggestion"]
    )

class DirectSQLRequest(QueryRequest):
    sql: str
    prompt: str = "Direct SQL execution"

@router.post("/{db_id}/execute", response_model=QueryResponse)
async def execute_direct_sql(db_id: str, request: DirectSQLRequest):
    """Directly executes a SQL query written or edited by the user, applying security validation."""
    db_file_path = UPLOAD_DIR / f"{db_id}.db"

    if not db_file_path.exists():
        raise HTTPException(status_code=404, detail="Database not found or session expired.")

    # Validate
    is_valid, validation_error = SQLValidator.validate(request.sql)
    if not is_valid:
        return QueryResponse(
            success=False,
            sql=request.sql,
            error=f"SQL Security Validation Denied: {validation_error}"
        )

    # Execute
    exec_result = SQLExecutor.execute(db_file_path, request.sql)
    
    status = "success" if exec_result["success"] else "error"
    exec_time = exec_result.get("execution_time_ms", 0.0)
    
    # Log to history
    add_to_history(db_id, request.prompt, request.sql, exec_time, status)

    if not exec_result["success"]:
        return QueryResponse(
            success=False,
            sql=request.sql,
            execution_time_ms=exec_time,
            error=exec_result["error"]
        )

    return QueryResponse(
        success=True,
        sql=request.sql,
        summary="User custom executed query.",
        explanation="Executed direct user custom query.",
        data=exec_result["data"],
        columns=exec_result["columns"],
        row_count=exec_result["row_count"],
        execution_time_ms=exec_time,
        chart_suggestion=exec_result["chart_suggestion"]
    )
