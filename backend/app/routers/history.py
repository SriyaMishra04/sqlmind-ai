import json
from fastapi import APIRouter, HTTPException
from typing import List
from app.config import HISTORY_FILE
from app.schemas import HistoryItem

router = APIRouter(prefix="/history", tags=["History"])

def read_history() -> List[dict]:
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def write_history(history: List[dict]):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

@router.get("/{db_id}", response_model=List[HistoryItem])
async def get_history(db_id: str):
    history = read_history()
    # Filter by db_id
    filtered = [item for item in history if item.get("db_id") == db_id]
    return filtered

@router.post("/{item_id}/favorite", response_model=HistoryItem)
async def toggle_favorite(item_id: str):
    history = read_history()
    found = None
    for item in history:
        if item.get("id") == item_id:
            item["is_favorite"] = not item.get("is_favorite", False)
            found = item
            break
            
    if not found:
        raise HTTPException(status_code=404, detail="History item not found.")
        
    write_history(history)
    return found

@router.delete("/{item_id}")
async def delete_history_item(item_id: str):
    history = read_history()
    initial_len = len(history)
    history = [item for item in history if item.get("id") != item_id]
    
    if len(history) == initial_len:
        raise HTTPException(status_code=404, detail="History item not found.")
        
    write_history(history)
    return {"message": "History item deleted successfully."}

@router.delete("/clear/{db_id}")
async def clear_database_history(db_id: str):
    history = read_history()
    # Keep other DBs history, filter out target DB
    history = [item for item in history if item.get("db_id") != db_id]
    write_history(history)
    return {"message": f"History for database {db_id} cleared successfully."}
