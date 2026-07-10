# SQLMind AI - AI-Powered SQL Assistant

SQLMind AI is an intelligent, premium full-stack SQL Assistant that translates natural language queries into optimized SQL statements, executes them securely against uploaded datasets, and displays visual charts and table results.

---

## 🚀 Key Features

- **Multi-Provider LLM Integration**: Generates SQL using Google Gemini (default) or OpenAI GPT models.
- **Visual Dashboard**: Seamless, dark-themed dashboard featuring chat consoles, database schema visualizers, dynamic table grids, and interactive charts.
- **Auto-Visualization**: Suggests and renders appropriate charts (Bar, Line, Area, Pie, Scatter) based on query response schema.
- **Strict SQL Security Sandbox**: Automatically validates generated SQL against unsafe commands (e.g., blocking `DROP`, `DELETE`, `UPDATE` keywords) and executes queries in read-only mode (`mode=ro`) to safeguard data integrity.
- **Chat History with Favorites**: Persists conversation history locally and supports marking queries as favorites.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Zustand, Recharts, Framer Motion, and Lucide React.
- **Backend**: Python FastAPI, SQLite, and the Google GenAI SDK / OpenAI SDK.

---

## 📁 Repository Structure

```
├── backend/                  # FastAPI Backend API
│   ├── app/                  # FastAPI Application Source
│   │   ├── routers/          # API Routers (Upload, Query, History)
│   │   ├── services/         # Core Services (LLM generation, Security validation, execution)
│   │   ├── main.py           # Application Entry Point
│   │   └── schemas.py        # Pydantic Schemas
│   ├── .env.example
│   ├── requirements.txt      # Python Dependencies
│   └── package.json          # Node script wrapper for backend
│
├── frontend/                 # Next.js 16 Client App
│   ├── src/
│   │   ├── app/              # Next.js Page & Layout Router
│   │   ├── components/       # Interface components (Sidebar, Console, RightPanel)
│   │   └── hooks/            # Zustand State Stores
│   ├── package.json
│   └── tsconfig.json
│
├── package.json              # Root script runner
└── .gitignore
```

---

## ⚙️ Setup and Running

### 1. Installation

From the root directory, run:
```bash
npm run install:all
```
*Note: Make sure to also set up a Python virtual environment in the `backend` folder:*
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configuration

Create a `.env` file in the `backend/` directory (you can copy `backend/.env.example` as a template):
```env
PORT=8000
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
LLM_PROVIDER=gemini
LLM_MODEL=gemini-1.5-flash
```

### 3. Run Development Servers

From the root directory, start both the FastAPI backend and Next.js frontend:
```bash
# Start backend on http://localhost:8000
npm run dev:backend

# Start frontend on http://localhost:3000
npm run dev:frontend
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
