# Crisis Command: The Multi-Agent Emergency Response & Resource Coordination Agent

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.1+-blue.svg)](https://langchain-ai.github.io/langgraph/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-10%20Passed-brightgreen.svg)]()

> **Decision-Support Notice**: Crisis Command is an AI-assisted decision-support command center for emergency coordination and tactical simulation. It does not exert autonomous control over municipal emergency apparatus. All resource reassignments are simulated and subject to human command validation.

---

## 📖 Executive Summary

In mass-casualty disasters, emergency dispatchers face simultaneous crises with severely limited field assets. **Crisis Command** orchestrates a team of specialized AI agents via **LangGraph**, coupled with **deterministic Python allocation and priority algorithms**, to evaluate incident severity, coordinate response units, resolve contention, and dynamically re-plan resources when conditions shift in the field.

---

## ⚡ Key Highlights

1. **Safety-Guaranteed AI Architecture**: LLMs extract structured incident semantics and draft human-readable tactical explanations; deterministic Python logic validates availability, priority, and assigns units.
2. **LangGraph StateGraph Workflow**: Sequential 6-node decision graph (`START` &rarr; `Assessment` &rarr; `Priority` &rarr; `Validation` &rarr; `Allocation` &rarr; `Planner` &rarr; `Approval` &rarr; `END`).
3. **Dynamic Replanning Engine**: Automatically detects shifts (new high-severity incidents, field unit breakdowns), captures Before/After states, and preempts lower-priority units with full mathematical justification.
4. **Human Command Approval**: Preemption from existing emergencies or deficits on critical incidents instantly flags `Human Approval Required` with one-click **Approve**, **Reject**, or **Review** actions.
5. **Interactive Geospatial Dashboard**: Interactive Leaflet/OpenStreetMap map, priority gauges, fleet readiness trackers, and a high-resolution multi-agent audit trajectory.

---

## 🛠️ Tech Stack

### Backend
- **Python 3.12+ / 3.14**
- **FastAPI**: Asynchronous high-performance REST API
- **LangGraph**: Stateful multi-agent graph orchestration
- **LangChain / LangChain Core**: LLM abstraction and tool interfaces
- **Pydantic v2**: Strict schema validation for structured outputs
- **Uvicorn**: Production ASGI web server
- **Pytest & Pytest-Asyncio**: Comprehensive test suite

### Frontend
- **React 19 & TypeScript**
- **Vite 8**: Next-generation frontend tooling
- **Tailwind CSS v4**: Command-center dark UI styling
- **Leaflet & OpenStreetMap**: Interactive geospatial visualization
- **Lucide React**: Clean operational iconography

---

## 🧠 LangGraph Decision Pipeline

```
START
  ↓
[Node 1: Incident Assessment Agent]
  - Parses incoming emergency report
  - Infers severity (1-10), urgency (1-10), casualties, and resource categories
  - Validates output using Pydantic schemas (LLM or fallback domain rules)
  ↓
[Node 2: Deterministic Priority Engine]
  - Calculates transparent score: (Severity × 0.40) + (Urgency × 0.30) + (PeopleAtRisk × 0.30)
  - Adds life-safety hazard bonuses and casualty increments
  - Classifies into CRITICAL, HIGH, MEDIUM, or LOW
  ↓
[Node 3: Resource Requirement Validation]
  - Sanitizes requested categories and validates non-zero quantities
  ↓
[Node 4: Resource Allocation Engine]
  - Deterministic priority ranking
  - Haversine proximity-based reserve assignment
  - Lower-priority preemption with audit logging
  ↓
[Node 5: Response Planner]
  - Formulates tactical action items
  - Generates LLM explanations ("Why?") and situational executive summary
  ↓
[Node 6: Human Approval / Decision Check]
  - Evaluates operational disruption and preemption triggers
  - Flags plan as 'proposed' or 'active'
  ↓
END
```

---

## 📂 Project Structure

```
crisis_command/
├── ARCHITECTURE.md                  # Comprehensive architectural deep-dive & Mermaid diagrams
├── README.md                        # Documentation and run instructions
├── package.json                     # Root convenience scripts
├── render.yaml                      # Render cloud backend deployment config
├── .gitignore                       # Git ignore rules
│
├── backend/
│   ├── requirements.txt             # Python backend dependencies
│   ├── .env.example                 # Backend environment variable template
│   ├── .env                         # Local backend configuration
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint with CORS & routes
│   │   ├── config.py                # Pydantic BaseSettings configuration
│   │   ├── api/
│   │   │   ├── incidents.py         # /api/incidents endpoints
│   │   │   ├── resources.py         # /api/resources endpoints
│   │   │   ├── response.py          # /api/response/plan, /api/replan, /api/response/plan/approve
│   │   │   ├── dashboard.py         # /api/dashboard aggregated metrics
│   │   │   └── demo.py              # /api/demo simulation triggers
│   │   ├── graph/
│   │   │   ├── state.py             # CrisisState TypedDict specification
│   │   │   ├── graph.py             # Compiled LangGraph StateGraph
│   │   │   └── nodes/
│   │   │       ├── assessment.py    # Assessment Agent node
│   │   │       ├── priority.py      # Priority evaluation node
│   │   │       ├── validation.py    # Resource validation node
│   │   │       ├── allocation.py    # Allocation engine node
│   │   │       ├── planner.py       # Response planning node
│   │   │       ├── approval.py      # Human approval node
│   │   │       └── replanner.py     # Replanning node
│   │   ├── models/
│   │   │   ├── incident.py          # Incident & IncidentCreate models
│   │   │   ├── resource.py          # Resource & ResourceStatus models
│   │   │   ├── response.py          # ResponsePlan & AllocationChange models
│   │   │   └── assessment.py        # IncidentAssessmentOutput model
│   │   ├── services/
│   │   │   ├── llm_service.py       # Resilient LLM service with mock fallback
│   │   │   ├── coordination_service.py # Thread-safe in-memory simulation engine
│   │   │   ├── incident_service.py  # Incident management service
│   │   │   └── resource_service.py  # Resource fleet service
│   │   ├── engines/
│   │   │   ├── priority_engine.py   # Deterministic priority scoring math
│   │   │   ├── allocation_engine.py # Deterministic multi-incident allocation & preemption
│   │   │   └── replanning_engine.py # State diffing & replanning coordination
│   │   └── data/
│   │       └── demo_data.py         # 19 resources and 4 initial emergencies dataset
│   └── tests/
│       ├── test_priority_engine.py  # Priority formula unit tests
│       ├── test_allocation_engine.py# Deterministic allocation tests
│       ├── test_replanning_and_reallocation.py # Preemption & unit failure tests
│       ├── test_langgraph_workflow.py # End-to-end StateGraph test
│       └── test_api_endpoints.py    # FastAPI HTTP integration tests
│
└── frontend/
    ├── package.json                 # React Vite frontend dependencies
    ├── vite.config.ts               # Vite configuration with Tailwind CSS v4
    ├── tsconfig.json                # TypeScript compiler options
    ├── vercel.json                  # Vercel SPA routing rewrite config
    ├── .env.example                 # Frontend env template
    ├── .env                         # Local frontend environment
    └── src/
        ├── main.tsx                 # React DOM root entrypoint
        ├── App.tsx                  # Root state coordinator and tab switcher
        ├── index.css                # Tailwind CSS v4 & Leaflet imports
        ├── types/                   # TypeScript interfaces & enums
        ├── api/                     # Type-safe API client layer
        │   ├── client.ts
        │   ├── incidents.ts
        │   ├── resources.ts
        │   ├── response.ts
        │   ├── demo.ts
        │   └── dashboard.ts
        ├── components/
        │   ├── Header.tsx           # Command center navigation & demo controls
        │   ├── ReplanningBanner.tsx # Before/After diff & Human Approval UI
        │   ├── MapComponent.tsx     # Interactive Leaflet OpenStreetMap
        │   └── IncidentModal.tsx    # Report emergency modal
        └── pages/
            ├── DashboardPage.tsx    # Main command dashboard with KPI cards & map
            ├── IncidentsPage.tsx    # Emergencies list with transparent priority math
            ├── ResourcesPage.tsx    # Fleet management & failure simulation
            ├── ResponsePlanPage.tsx # Tactical action plans & LLM rationale
            └── ActivityLogPage.tsx  # Multi-agent audit trajectory
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.12+**
- **Node.js 18+** & **npm**

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend is now live at:
- **API Base**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

---

### 2. Frontend Setup

In a separate terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The React Command Center is now live at:
- **Frontend URL**: `http://localhost:5173`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```ini
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# LLM Configuration
# Set to 'mock' for 100% offline hackathon execution, or 'openai' / 'anthropic' with API key
LLM_PROVIDER=mock
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=

# Priority Weights (must sum to 1.0)
SEVERITY_WEIGHT=0.40
URGENCY_WEIGHT=0.30
PEOPLE_AT_RISK_WEIGHT=0.30
```

### Frontend (`frontend/.env`)

```ini
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🎬 Step-by-Step Hackathon Demonstration

Follow this operational flow to showcase the multi-agent system to judges:

1. **Load Standard Scenario**:
   - Click the **"Load Scenario"** button in the header.
   - The system initializes **19 emergency resources** (Ambulances, Rescue Teams, Medical Units, Fire Units, Police Units, Shelters) and **4 simultaneous emergencies**:
     - *Building Collapse* (Severity 9, Urgency 10, Priority 94.0 &rarr; CRITICAL)
     - *Industrial Warehouse Fire* (Severity 8, Urgency 8, Priority 80.0 &rarr; HIGH)
     - *Multi-Vehicle Highway Pileup* (Severity 7, Urgency 8, Priority 73.0 &rarr; HIGH)
     - *Flash Flood & Levee Breach* (Severity 6, Urgency 7, Priority 64.0 &rarr; MEDIUM)
2. **Observe Initial Tactical Plan**:
   - Inspect the **Field Operations Tactical Map** to see geo-located incidents and assigned units.
   - Notice that `AMB-01` and `AMB-02` are assigned to the Building Collapse, and `AMB-03` is assigned to the Road Accident.
3. **Simulate Sudden Critical Emergency**:
   - Click the glowing red button: **"Simulate New Critical Emergency"**.
   - The backend registers an *Industrial Chemical Plant Explosion* (Severity 10, Urgency 10, 50 civilians affected, 15 casualties).
   - LangGraph triggers **Dynamic Replanning**.
   - The Priority Engine computes a priority score of **99.0 (CRITICAL)**.
   - The Allocation Engine detects that all available ambulances are engaged.
   - It performs deterministic preemption, taking `AMB-01` from the lower-priority *Road Accident* (Priority 73.0) and assigning it to the *Chemical Explosion* (Priority 99.0).
4. **Inspect the Replanning Banner**:
   - The top banner flashes: **🚨 REPLANNING TRIGGERED**.
   - View the **BEFORE vs. AFTER** card:
     - `AMB-01`: Road Accident &rarr; Chemical Explosion.
     - **Why**: *"Priority reallocation: Industrial Chemical Plant Explosion (99.0) > Multi-Vehicle Highway Pileup (73.0)"*.
5. **Execute Human Command Decision**:
   - Notice the status badge: **HUMAN APPROVAL REQUIRED**.
   - Click **"Approve Plan"**.
   - The plan transitions to **APPROVED BY COMMAND**, establishing operational signoff.
6. **Simulate Field Unit Failure**:
   - Click **"Simulate Resource Failure"**.
   - An active ambulance experiences mechanical breakdown in the field.
   - Replanning is triggered instantly, dispatching an unassigned reserve or flagging an urgent field deficit.
7. **View Agent Audit Log**:
   - Navigate to the **"Replanning Activity Log"** tab to review the chronological timeline of every agent assessment, priority calculation, and reallocation event.

---

## 🧪 Testing

The backend includes a comprehensive test suite covering all critical workflows:

```bash
cd backend
.\venv\Scripts\python.exe -m pytest tests -v
```

### Verified Test Suite (100% Pass Rate):
- `test_health_check`: Validates FastAPI status and metadata.
- `test_dashboard_api`: Verifies aggregation of live metrics and cards.
- `test_create_and_resolve_incident`: Validates incident lifecycle and resource release.
- `test_demo_scenarios_and_approval`: Verifies scenario reset, load, and human approval.
- `test_langgraph_workflow_execution`: Tests full 6-node LangGraph StateGraph execution.
- `test_priority_engine_calculation`: Verifies multi-factor priority formula and category weights.
- `test_priority_engine_low_incident`: Tests low-priority classification.
- `test_priority_engine_boundary_clamping`: Verifies clamp range [0.0, 100.0].
- `test_resource_preemption_and_reallocation_scenario`: Specifically validates preemption of `AMB-01` from Road Accident to Chemical Explosion and audit change recording.
- `test_resource_failure_replanning`: Validates automatic replacement when an assigned unit fails.

---

## 🌐 Production Deployment

### Frontend (Vercel)
1. Link your GitHub repository to Vercel.
2. Set Root Directory to `frontend`.
3. Set Build Command to `npm run build`.
4. Set Output Directory to `dist`.
5. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com`

### Backend (Render / Railway)
1. Deploy from GitHub repository using `render.yaml` or Docker/Python runtime.
2. Root Directory: `backend`.
3. Build Command: `pip install -r requirements.txt`.
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Environment Variables:
   - `CORS_ORIGINS`: `*` (or your Vercel frontend URL).
   - `LLM_PROVIDER`: `mock` (or `openai` with `LLM_API_KEY`).

---

## 📄 License

MIT License. Developed for the Online Hackathon.
