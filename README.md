# 🚀 UdyamAI - AI-Powered Micro-Entrepreneurship Platform

UdyamAI is a state-of-the-art, AI-powered platform designed to empower micro-entrepreneurs in rural and semi-urban regions. It performs hyper-localized business feasibility studies, detailed financial calculations, geo-spatial market analysis, and government scheme matching to evaluate viability and simplify the path to capital.

---

## 🌟 Core Features

- **💡 Multi-Criteria Scheme Matching Engine**: Matches entrepreneur profiles against NSFDC, Central, and State (e.g., Maharashtra) schemes. Calculates exact subsidy amounts, contribution margins, and maximum loan availability.
- **🗺️ Localized Geographic & Market Analysis**: Uses PostGIS coordinates and radial searches to gauge nearby village populations, local competitors, market hubs, and infrastructural facilities.
- **📊 Business Feasibility Scorer & SWOT Advisor**: Generates a unified risk rating, opportunities checklist, and automated SWOT (Strengths, Weaknesses, Opportunities, Threats) matrices.
- **🧮 Interactive Financial Planners**: Calculators for project costs, EMI streams, moratorium variations, working capital limits, cash flow statements, break-even limits, and repayment margins.
- **💬 Multilingual AI Advisor**: RAG-enhanced interactive chatbot supporting English, Hindi (हिंदी), and Marathi (मराठी) to answer complex regulatory, financial, and policy queries with citations.
- **📄 PDF Business Plan Generator**: Renders beautifully formatted feasibility and financial reports ready to present to banks.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14/15, Tailwind CSS, TypeScript, Zustand |
| **Backend** | FastAPI, Python 3.11, SQLModel / SQLAlchemy, Pydantic v2 |
| **Database** | PostgreSQL, PostGIS extension |
| **AI / RAG** | LangChain / LlamaIndex, OpenAI / Google Gemini API, Vector Embeddings |
| **Containers & Proxy** | Docker & Docker Compose, Nginx |

---

## 📁 Directory Structure Overview

```
UdyamAI/
├── docs/                     # System architecture, schemas, and specs
├── frontend/                 # Next.js web application
├── backend/                  # FastAPI web services and analysis modules
├── data/                     # Raw/processed geographic and market demographic data
├── knowledge_base/           # Scheme PDFs, policy files, guidelines for RAG
├── scripts/                  # Data importing, scheme ingestion, and RAG indexing scripts
└── infrastructure/           # Dockerfiles, Nginx configurations, database schemas
```

---

## ⚡ Getting Started

### 📋 Prerequisites

Ensure you have the following installed on your local machine:
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop)
- [Node.js (v18 or higher)](https://nodejs.org/)
- [Python (v3.11 or higher)](https://www.python.org/downloads/)

---

### 🔑 1. Environment Configuration

1. Copy the example environment file at the root:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` to supply your API keys and configuration parameters:
   - **`DATABASE_URL`**: DB connection string.
   - **`OPENAI_API_KEY`** or **`GEMINI_API_KEY`**: LLM API tokens for the advisor.

---

### 🐳 2. Quickstart with Docker Compose

To spin up all services (Frontend, Backend, PostgreSQL with PostGIS, Nginx) together:

```bash
# Start all containers in detached mode
docker-compose up -d --build
```

The services will be accessible at:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000) (Swagger docs at `/docs`)
- **Nginx Gateway**: [http://localhost](http://localhost) (Proxies `/api` to backend, `/` to frontend)

---

### 💻 3. Manual Development Setup

If you prefer to run services individually for debugging:

#### A. Database Initialization
Spin up only the database container:
```bash
docker-compose up -d database
```

#### B. Backend Setup
1. Create a virtual environment and activate it:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

#### C. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## ⚙️ Data Ingestion & Ingest Pipeline

To initialize geo-demographic profiles and scheme databases, use the provided scripts.

### 🗺️ Ingesting Geographic & Market Data
Ensure your database is running and run the import scripts:
```bash
# Activate virtual environment in backend, then run:
python scripts/data/import_locations.py
python scripts/data/import_population.py
python scripts/data/import_markets.py
```

### 📚 RAG Knowledge Base Ingestion
To parse and index PDFs or scheme policies placed inside `knowledge_base/schemes/`:
```bash
python scripts/rag/ingest_documents.py
python scripts/rag/rebuild_embeddings.py
```

---

## 🧪 Testing

Test target commands are configured in the `Makefile`. Run them using `make`:

```bash
# Run backend pytest suite and frontend test files
make test
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
