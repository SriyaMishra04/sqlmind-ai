import os
import json
import re
from google import genai
from google.genai import types
from openai import OpenAI
from typing import Dict, Any, Optional
from app.config import GEMINI_API_KEY, OPENAI_API_KEY, LLM_PROVIDER, LLM_MODEL

SYSTEM_PROMPT = """You are an expert SQL Assistant called SQLMind AI.
Your task is to translate natural language questions into valid, optimized SQLite SQL queries, and explain how they work.

You are given the database schema below:
{schema_description}

RULES:
1. ONLY generate read-only queries (SELECT, WITH, JOIN, GROUP BY, ORDER BY, HAVING, LIMIT).
2. NEVER generate modifying statements (DROP, DELETE, UPDATE, INSERT, ALTER, CREATE, TRUNCATE, etc.).
3. ONLY use tables and columns defined in the schema above. Do not invent any names.
4. When filtering text columns, prefer using `LIKE` for case-insensitive search if applicable (e.g., `WHERE name LIKE '%john%'`), unless exact match is required.
5. If the user asks for "top N", use `LIMIT N`. If no limit is requested, consider adding a protective `LIMIT 1000` to prevent huge memory usage, unless the user query implies returning all (like counting all or doing list of all).
6. Always name computed fields clearly with aliases (e.g. `COUNT(*) as total_employees`).
7. Pay attention to foreign keys and join tables correctly.

You MUST respond ONLY with a JSON object. Do NOT wrap the JSON in markdown code blocks. The JSON object must contain exactly three keys:
- "sql": the generated SQLite query string. Do NOT put comments inside the SQL string. Keep the SQL query on a single line or nicely formatted.
- "summary": a short, one-sentence plain English summary of what the query retrieves.
- "explanation": a clear, step-by-step explanation of the SQL logic (bullet points, explain how joins, filters, or aggregations are applied).

Example Output Format:
{{
  "sql": "SELECT category, AVG(price) as avg_price FROM products GROUP BY category ORDER BY avg_price DESC LIMIT 5",
  "summary": "This query retrieves the top 5 product categories with the highest average price.",
  "explanation": "1. It groups rows by the 'category' column.\\n2. It computes the average price for each group using AVG(price).\\n3. It orders the categories in descending order based on this average.\\n4. It limits the output to the top 5 results."
}}
"""

def format_schema(schema_info: Dict[str, Any]) -> str:
    lines = []
    tables = schema_info.get("tables", {})
    for table_name, details in tables.items():
        lines.append(f"Table: {table_name}")
        cols = [f"  - {c['name']} ({c['type']})" + (" [PRIMARY KEY]" if c['primary_key'] else "") for c in details.get("columns", [])]
        lines.extend(cols)
        
        fks = details.get("foreign_keys", [])
        if fks:
            lines.append("  Foreign Keys:")
            for fk in fks:
                lines.append(f"    - {fk['from']} references {fk['to_table']}({fk['to_column']})")
                
        row_count = details.get("row_count", 0)
        lines.append(f"  Estimated Rows: {row_count}")
        lines.append("")
        
    relationships = schema_info.get("relationships", [])
    if relationships:
        lines.append("Relationships:")
        for rel in relationships:
            lines.append(f"  - {rel['from_table']}.{rel['from_column']} -> {rel['to_table']}.{rel['to_column']}")
            
    return "\n".join(lines)

class SQLGenerator:
    @staticmethod
    def generate_sql(
        schema_info: Dict[str, Any],
        user_prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        
        provider = provider or LLM_PROVIDER
        model = model or LLM_MODEL
        
        schema_desc = format_schema(schema_info)
        system_prompt = SYSTEM_PROMPT.format(schema_description=schema_desc)
        
        # Select client & invoke
        if provider == "gemini":
            active_key = api_key or GEMINI_API_KEY
            if not active_key or active_key == "your-gemini-api-key-here":
                raise ValueError("Gemini API key is not configured. Please add it to .env or supply it in the Settings panel.")
                
            client = genai.Client(api_key=active_key)
            
            # Map standard model names to actual Gemini names if needed
            gemini_model = model
            if "1.5" in gemini_model:
                # Redirect retired 1.5 models to active 2.5 equivalents
                gemini_model = gemini_model.replace("1.5", "2.5")
            elif "2.0" not in gemini_model and "2.5" not in gemini_model and "3.5" not in gemini_model:
                gemini_model = "gemini-2.5-flash"
                
            response = client.models.generate_content(
                model=gemini_model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.1,
                    response_mime_type="application/json"
                )
            )
            raw_text = response.text
            
        elif provider == "openai":
            active_key = api_key or OPENAI_API_KEY
            if not active_key or active_key == "your-openai-api-key-here":
                raise ValueError("OpenAI API key is not configured. Please add it to .env or supply it in the Settings panel.")
                
            client = OpenAI(api_key=active_key)
            
            openai_model = model
            if "gpt-" not in openai_model:
                openai_model = "gpt-4-turbo" # fallback
                
            response = client.chat.completions.create(
                model=openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            raw_text = response.choices[0].message.content
            
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

        # Parse JSON output
        try:
            # Clean markdown codeblocks if they slip through
            cleaned_text = raw_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            
            result = json.loads(cleaned_text)
            
            # Basic validation of keys
            if "sql" not in result or "explanation" not in result:
                raise ValueError("AI response is missing 'sql' or 'explanation' keys.")
                
            return result
        except Exception as e:
            raise ValueError(f"Failed to parse generated AI response: {str(e)}. Raw response was: {raw_text}")
