# GrowEasy AI CSV Importer

An intelligent, production-ready AI-powered CSV lead importer that parses unstructured CSV files with varying columns and layouts, standardizes them to a target CRM lead schema using an LLM, and provides a premium user interface. 

Built as a Software Developer Internship assignment with a completely decoupled architecture, robust error fallback paths, and dynamic dark mode design.

---

## 🚀 Key Features

*   **Sleek SaaS Dashboard UI**: Designed following Vercel, Linear, and Stripe aesthetics with rounded cards, glassmorphism elements, custom grids, and smooth animations using Framer Motion.
*   **Zero-Overhead Local Preview (Step 2)**: Parses CSV files locally in the browser using PapaParse. Renders a high-performance interactive grid utilizing TanStack Table supporting:
    *   Sticky headers
    *   Horizontal & vertical scroll virtualization
    *   Global filtering & search
    *   Column sorting
    *   Drag-to-resize columns
*   **Unified AI Extraction Adapter (Step 4)**: Maps unstructured columns (e.g., `fname`, `lname`, `cell`, `mail`) to 15 standard CRM lead fields using OpenAI SDK. Supports both OpenAI models (`gpt-4o-mini`) and Google Gemini models (`gemini-1.5-flash`) via environment variables.
*   **Fail-Safe Heuristic Fallback**: Includes a regex key-matching engine that acts as a backup. If the LLM rate limits or fails, the importer falls back to heuristic mappings so import uploads never fail.
*   **CRM Schema Validation**: Evaluates imported records against strict Zod validations (names, valid email syntax).
*   **Import Analytics**: Renders metrics cards (Total Leads, Skipped Rows, Pipeline Execution Time) and detailed logs explaining validation issues for skipped rows.
*   **JSON Exporter**: Allows downloading the structured output results as a JSON file.

---

## 🛠️ Technology Stack

### Frontend
*   **Next.js 15** (App Router)
*   **TypeScript**
*   **Tailwind CSS v4**
*   **shadcn/ui** primitives
*   **TanStack Table v8** (React Table)
*   **Framer Motion** (Micro-animations)
*   **PapaParse** (Local CSV parser)
*   **Axios** & **React Hook Form**

### Backend
*   **Node.js** & **Express**
*   **TypeScript**
*   **Multer** (Multipart file uploads)
*   **OpenAI SDK** (with Gemini OpenAI-compatibility API endpoint support)
*   **Zod** (Schema validation)
*   **Nodemon** & **ts-node** (Hot-reloading)

---

## 📁 Repository Structure

```
├── backend/                  # Node.js + Express TypeScript API
│   ├── src/
│   │   ├── controllers/      # CSV import controller
│   │   ├── routes/           # Routing for /api/csv
│   │   ├── services/         # CSV processing & AI mapping services
│   │   ├── middleware/       # Multer config & error handlers
│   │   ├── types/            # CRM Lead and process metrics definitions
│   │   ├── utils/            # Logger and custom AppError
│   │   └── index.ts          # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # Next.js 15 App Router TypeScript app
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Document wrappers, dark theme
│   │   │   └── page.tsx      # Main application page governing step state router
│   │   ├── components/       # UI Components
│   │   │   ├── ui/           # shadcn buttons, cards, dialogs
│   │   │   └── CSVImporter/  # Step components (Landing, Preview, Loading, Result)
│   │   └── lib/
│   │       └── api.ts        # Axios configuration
│   ├── package.json
│   └── tailwind.config.ts
│
├── LICENSE                   # MIT License
├── package.json              # Workspace script definitions
└── .gitignore                # Global git ignore configuration
```

---

## ⚙️ Installation & Setup

### 1. Clone & Install Dependencies
Run the installation command in the root directory to bootstrap both workspaces:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory (you can copy [backend/.env.example](backend/.env.example)):
```env
PORT=5000
NODE_ENV=development

# LLM Providers: 'openai' | 'gemini' | 'heuristic' (local fallback)
LLM_PROVIDER=gemini
LLM_MODEL=gemini-1.5-flash

# API Credentials
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Start Development Servers
Run the development command from the root directory for both services:

Start the **Backend API** (Port 5000):
```bash
npm run dev:backend
```

Start the **Frontend App** (Port 3000):
```bash
npm run dev:frontend
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📊 Target CRM Fields
All parsed rows are standardized into this schema:
*   `created_at`: Creation date (ISO 8601 string)
*   `name`: Full name
*   `email`: Email address
*   `country_code`: Phone country prefix (e.g. `+1`, `+91`)
*   `mobile_without_country_code`: Phone number digits (without spaces or country code)
*   `company`: Company name
*   `city`: City location
*   `state`: State or Province
*   `country`: Country name
*   `lead_owner`: Assigned owner name
*   `crm_status`: Lead status (e.g., `New`, `Qualified`)
*   `crm_note`: Standardized notes
*   `data_source`: Channel name (e.g. `CSV Import`)
*   `possession_time`: Ownership duration details
*   `description`: Unstructured row details summary

---

## 📄 License
This project is licensed under the terms of the [MIT License](LICENSE).
