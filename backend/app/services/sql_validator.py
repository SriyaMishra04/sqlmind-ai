import re
from typing import Tuple

class SQLValidator:
    # Set of forbidden SQL command tokens (case-insensitive)
    FORBIDDEN_KEYWORDS = {
        "DROP", "DELETE", "UPDATE", "ALTER", "INSERT", "TRUNCATE", 
        "CREATE", "REPLACE", "GRANT", "REVOKE", "ATTACH", "DETACH",
        "RENAME", "EXEC", "EXECUTE", "PRAGMA", "MERGE"
    }

    @classmethod
    def validate(cls, sql_query: str) -> Tuple[bool, str]:
        """Validates that a SQL query is read-only and safe to execute.
        
        Returns:
            Tuple[bool, str]: (is_valid, error_message)
        """
        # Clean whitespaces
        sql = sql_query.strip()
        if not sql:
            return False, "Query is empty."

        # Parse query text into clean alphanumeric and space chunks to detect keywords
        # Use regex to find all word tokens
        tokens = [token.upper() for token in re.findall(r'\b\w+\b', sql)]

        # 1. Must contain SELECT or WITH to be read-only
        if not any(t in ["SELECT", "WITH"] for t in tokens):
            return False, "Only read-only SELECT or WITH statements are allowed."

        # 2. Check for forbidden keywords as standalone word tokens
        for forbidden in cls.FORBIDDEN_KEYWORDS:
            if forbidden in tokens:
                return False, f"Unauthorized SQL command detected: '{forbidden}' is blocked for security."

        # 3. Check for semicolon abuse (multiple statements)
        # Semicolon followed by characters that indicate another statement
        # Check if there is a semicolon followed by any non-whitespace
        parts = [p.strip() for p in sql.split(';') if p.strip()]
        if len(parts) > 1:
            # Check if any part doesn't start with select/with
            for part in parts:
                part_tokens = [t.upper() for t in re.findall(r'\b\w+\b', part)]
                if not any(t in ["SELECT", "WITH"] for t in part_tokens):
                    return False, "Multiple queries or sub-queries containing non-SELECT statements are blocked."

        return True, ""
