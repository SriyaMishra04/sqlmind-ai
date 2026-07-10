import sqlite3
import time
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

class SQLExecutor:
    @staticmethod
    def execute(db_path: Path, sql_query: str) -> Dict[str, Any]:
        """Executes a SQL query against the SQLite database and returns the result with chart suggestions.
        
        Enforces read-only connection mode.
        """
        if not db_path.exists():
            return {
                "success": False,
                "error": f"Database file not found: {db_path.name}"
            }

        # Format SQLite connection string for Read-Only mode
        # SQLite supports URI connection parameters: file:path?mode=ro
        db_uri = f"file:{db_path.resolve().as_posix()}?mode=ro"
        
        start_time = time.perf_counter()
        conn = None
        try:
            conn = sqlite3.connect(db_uri, uri=True)
            # Enable dictionary factory helper
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute(sql_query)
            
            # Retrieve rows & columns
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            
            # Format row data as list of dictionaries
            data = []
            for row in rows:
                data.append(dict(row))
                
            execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            # Generate chart recommendation based on output data structure
            chart_suggestion = SQLExecutor.suggest_chart(columns, data)
            
            return {
                "success": True,
                "sql": sql_query,
                "data": data,
                "columns": columns,
                "row_count": len(data),
                "execution_time_ms": execution_time_ms,
                "chart_suggestion": chart_suggestion,
                "error": None
            }
            
        except Exception as e:
            execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "success": False,
                "sql": sql_query,
                "execution_time_ms": execution_time_ms,
                "error": str(e)
            }
        finally:
            if conn:
                conn.close()

    @staticmethod
    def suggest_chart(columns: List[str], data: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Analyzes columns and row values to recommend the most fitting chart type."""
        if not data or len(data) < 2 or not columns:
            return None

        # 1. Identify column types based on first few records
        numeric_cols = []
        date_cols = []
        categorical_cols = []

        sample_row = data[0]
        date_patterns = [
            r'^\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
            r'^\d{2}/\d{2}/\d{4}',  # MM/DD/YYYY
            r'^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)', # month names
        ]

        for col in columns:
            val = sample_row.get(col)
            if val is None:
                # check next row
                for next_row in data[1:5]:
                    if next_row.get(col) is not None:
                        val = next_row.get(col)
                        break
            
            if val is None:
                continue

            # check if numeric (int/float)
            if isinstance(val, (int, float)) and not isinstance(val, bool):
                # Don't classify columns like 'id' or 'zipcode' or 'phone' as numeric for plotting
                if col.lower() not in ['id', 'uuid', 'key', 'index', 'pk', 'fk'] and not col.lower().endswith('_id'):
                    numeric_cols.append(col)
            elif isinstance(val, str):
                # check if date
                is_date = False
                for pattern in date_patterns:
                    if re.match(pattern, val.strip(), re.IGNORECASE):
                        is_date = True
                        break
                
                if is_date or col.lower() in ['date', 'created_at', 'updated_at', 'timestamp', 'month', 'year', 'day']:
                    date_cols.append(col)
                else:
                    categorical_cols.append(col)

        # 2. Heuristic mapping
        # Rule A: Time-series Line/Area Chart
        if date_cols and numeric_cols:
            return {
                "type": "area" if len(data) > 10 else "line",
                "x_axis": date_cols[0],
                "y_axis": numeric_cols[0],
                "title": f"{numeric_cols[0].replace('_', ' ').title()} Over Time"
            }

        # Rule B: Categorical Bar or Pie Chart
        if categorical_cols and numeric_cols:
            # Check cardinality of the categorical column
            unique_categories = set(str(row.get(categorical_cols[0])) for row in data if row.get(categorical_cols[0]) is not None)
            
            # If low cardinality (e.g. between 2 and 7 values), suggest a Pie chart, otherwise Bar chart
            if 2 <= len(unique_categories) <= 7:
                return {
                    "type": "pie",
                    "x_axis": categorical_cols[0],
                    "y_axis": numeric_cols[0],
                    "title": f"Distribution of {numeric_cols[0].replace('_', ' ').title()} by {categorical_cols[0].replace('_', ' ').title()}"
                }
            else:
                return {
                    "type": "bar",
                    "x_axis": categorical_cols[0],
                    "y_axis": numeric_cols[0],
                    "title": f"{numeric_cols[0].replace('_', ' ').title()} by {categorical_cols[0].replace('_', ' ').title()}"
                }

        # Rule C: Multiple numeric columns (Scatter plot)
        if len(numeric_cols) >= 2:
            return {
                "type": "scatter",
                "x_axis": numeric_cols[0],
                "y_axis": numeric_cols[1],
                "title": f"{numeric_cols[1].replace('_', ' ').title()} vs {numeric_cols[0].replace('_', ' ').title()}"
            }

        # Rule D: Fallback - Single numeric column plotted against row indices or first category
        if numeric_cols:
            label_col = categorical_cols[0] if categorical_cols else columns[0]
            if label_col != numeric_cols[0]:
                return {
                    "type": "bar",
                    "x_axis": label_col,
                    "y_axis": numeric_cols[0],
                    "title": f"{numeric_cols[0].replace('_', ' ').title()} Chart"
                }

        return None
