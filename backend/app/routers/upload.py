import uuid
import shutil
import json
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import UPLOAD_DIR
from app.schemas import UploadResponse
from app.services.schema_analyzer import SchemaAnalyzer
from app.services.suggested_questions import SuggestedQuestionsGenerator

router = APIRouter(prefix="/upload", tags=["Upload"])

SUPPORTED_EXTENSIONS = {".db", ".sqlite", ".csv", ".xlsx", ".xls", ".sql"}

@router.post("", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename
    ext = Path(filename).suffix.lower()
    
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '{ext}'. Supported formats: SQLite (.db, .sqlite), CSV (.csv), Excel (.xlsx, .xls), SQL dumps (.sql)."
        )

    db_id = uuid.uuid4().hex
    temp_file_path = UPLOAD_DIR / f"{db_id}_orig{ext}"
    db_file_path = UPLOAD_DIR / f"{db_id}.db"

    # Save uploaded file
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    # Process and build SQLite database if needed
    try:
        if ext in {".db", ".sqlite"}:
            # For SQLite files, copy them directly to the DB file path
            shutil.copyfile(temp_file_path, db_file_path)
            schema_info = SchemaAnalyzer.analyze_db(db_file_path)
        elif ext in {".csv", ".xlsx", ".xls"}:
            schema_info = SchemaAnalyzer.ingest_csv_or_excel(temp_file_path, db_file_path)
        elif ext == ".sql":
            schema_info = SchemaAnalyzer.ingest_sql_dump(temp_file_path, db_file_path)
        else:
            raise HTTPException(status_code=400, detail="Invalid file state.")
    except Exception as e:
        # Cleanup temporary files on failure
        if temp_file_path.exists():
            temp_file_path.unlink()
        if db_file_path.exists():
            db_file_path.unlink()
        raise HTTPException(status_code=420, detail=f"Failed to analyze data file schema: {str(e)}")

    # Generate suggested questions based on the new schema
    suggested_questions = SuggestedQuestionsGenerator.generate(schema_info)

    # Save schema metadata to JSON
    metadata = {
        "db_id": db_id,
        "filename": filename,
        "extension": ext,
        "tables": list(schema_info.get("tables", {}).keys()),
        "schema_info": schema_info,
        "suggested_questions": suggested_questions
    }
    
    metadata_path = UPLOAD_DIR / f"{db_id}.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return UploadResponse(
        db_id=db_id,
        filename=filename,
        tables=metadata["tables"],
        schema_info=schema_info,
        suggested_questions=suggested_questions
    )
