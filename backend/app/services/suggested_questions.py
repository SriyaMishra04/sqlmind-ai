from typing import Dict, Any, List

class SuggestedQuestionsGenerator:
    @staticmethod
    def generate(schema_info: Dict[str, Any]) -> List[str]:
        """Generates schema-driven sample questions for the user to try out."""
        tables = schema_info.get("tables", {})
        if not tables:
            return ["List all tables and their contents."]

        questions = []
        
        # 1. Total counts for each table
        for table_name, details in list(tables.items())[:2]:
            questions.append(f"How many records are in {table_name}?")

        # 2. Look for numeric columns (price, salary, quantity, revenue, amount, age)
        for table_name, details in tables.items():
            cols = details.get("columns", [])
            col_names = [c["name"].lower() for c in cols]
            
            # Numeric column detection
            numeric_terms = ["salary", "revenue", "amount", "price", "cost", "total", "quantity", "age", "sales"]
            found_numeric = None
            for col in cols:
                name_lower = col["name"].lower()
                if any(term in name_lower for term in numeric_terms) and col["type"] in ["INTEGER", "REAL", "FLOAT", "NUMERIC"]:
                    found_numeric = col["name"]
                    break

            # Categorical text detection (name, title, category, status)
            text_terms = ["name", "title", "category", "status", "type", "city", "country", "email"]
            found_text = None
            for col in cols:
                name_lower = col["name"].lower()
                if any(term in name_lower for term in text_terms) and col["type"] in ["TEXT", "VARCHAR"]:
                    found_text = col["name"]
                    break

            # Date detection
            date_terms = ["date", "time", "created_at", "updated_at", "year", "month"]
            found_date = None
            for col in cols:
                name_lower = col["name"].lower()
                if any(term in name_lower for term in date_terms):
                    found_date = col["name"]
                    break

            if found_numeric:
                questions.append(f"What is the average {found_numeric} in {table_name}?")
                questions.append(f"Show the top 5 records in {table_name} sorted by {found_numeric} descending.")
                
            if found_text and found_numeric:
                questions.append(f"Group {table_name} by {found_text} and calculate the total {found_numeric}.")
                
            if found_date:
                questions.append(f"Show the most recent records in {table_name} based on {found_date}.")

        # Deduplicate and limit to 4-5 questions
        seen = set()
        unique_questions = []
        for q in questions:
            if q not in seen:
                seen.add(q)
                unique_questions.append(q)
                
        # Fill in generic defaults if questions list is sparse
        if len(unique_questions) < 3:
            first_table = list(tables.keys())[0]
            unique_questions.append(f"Select all columns from {first_table} limit 10.")
            unique_questions.append(f"What is the schema structure of {first_table}?")

        return unique_questions[:5]
