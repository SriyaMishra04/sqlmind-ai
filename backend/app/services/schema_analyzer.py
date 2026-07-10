import os
import sqlite3
import pandas as pd
import re
from pathlib import Path
from typing import Dict, Any, List

def sanitize_identifier(name: str) -> str:
    # Sanitize table/column names to prevent SQL issues
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name.strip())
    # Ensure it starts with a letter or underscore
    if name and name[0].isdigit():
        name = '_' + name
    return name.lower()

class SchemaAnalyzer:
    @staticmethod
    def analyze_db(db_path: Path) -> Dict[str, Any]:
        """Analyzes an SQLite database and extracts its full schema details."""
        if not db_path.exists():
            raise FileNotFoundError(f"Database file not found: {db_path}")

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        try:
            # 1. Get all user tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
            tables = [row[0] for row in cursor.fetchall()]

            schema_info = {
                "tables": {},
                "relationships": []
            }

            for table in tables:
                # 2. Get column information
                # cid, name, type, notnull, dflt_value, pk
                cursor.execute(f"PRAGMA table_info(`{table}`);")
                col_rows = cursor.fetchall()
                
                columns = []
                primary_keys = []
                for col in col_rows:
                    col_name = col[1]
                    col_type = col[2]
                    is_nullable = col[3] == 0
                    is_pk = col[5] > 0
                    
                    columns.append({
                        "name": col_name,
                        "type": col_type or "TEXT",
                        "nullable": is_nullable,
                        "primary_key": is_pk
                    })
                    if is_pk:
                        primary_keys.append(col_name)

                # 3. Get row count
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM `{table}`;")
                    row_count = cursor.fetchone()[0]
                except Exception:
                    row_count = 0

                # 4. Get foreign keys
                # id, seq, table, from, to, on_update, on_delete, match
                cursor.execute(f"PRAGMA foreign_key_list(`{table}`);")
                fk_rows = cursor.fetchall()
                foreign_keys = []
                for fk in fk_rows:
                    ref_table = fk[2]
                    from_col = fk[3]
                    to_col = fk[4]
                    
                    foreign_keys.append({
                        "from": from_col,
                        "to_table": ref_table,
                        "to_column": to_col
                    })
                    
                    schema_info["relationships"].append({
                        "from_table": table,
                        "from_column": from_col,
                        "to_table": ref_table,
                        "to_column": to_col
                    })

                schema_info["tables"][table] = {
                    "columns": columns,
                    "primary_keys": primary_keys,
                    "foreign_keys": foreign_keys,
                    "row_count": row_count
                }

            return schema_info

        finally:
            conn.close()

    @classmethod
    def ingest_csv_or_excel(cls, file_path: Path, db_path: Path) -> Dict[str, Any]:
        """Ingests a CSV or Excel file, converts it into a table in an SQLite database, and returns the schema."""
        ext = file_path.suffix.lower()
        table_name = sanitize_identifier(file_path.stem)

        # Read dataset using pandas
        if ext == '.csv':
            df = pd.read_csv(file_path)
        elif ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")

        # Sanitize column names
        df.columns = [sanitize_identifier(col) for col in df.columns]

        # Write to SQLite
        conn = sqlite3.connect(db_path)
        try:
            df.to_sql(table_name, conn, index=False, if_exists='replace')
        finally:
            conn.close()

        # Run database schema analysis
        return cls.analyze_db(db_path)

    @classmethod
    def ingest_sql_dump(cls, file_path: Path, db_path: Path) -> Dict[str, Any]:
        """Ingests an SQL script/dump file, executes it in a new SQLite DB, and returns the schema."""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            sql_script = f.read()

        conn = sqlite3.connect(db_path)
        try:
            conn.executescript(sql_script)
            conn.commit()
        except Exception as e:
            # Try splitting by semicolons as fallback if executescript fails
            # clean comments first
            cleaned = re.sub(r'--.*?\n', '', sql_script)
            cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)
            statements = cleaned.split(';')
            for stmt in statements:
                stmt_str = stmt.strip()
                if stmt_str:
                    try:
                        conn.execute(stmt_str)
                    except Exception:
                        pass
            conn.commit()
        finally:
            conn.close()

        # Run database schema analysis
        return cls.analyze_db(db_path)
