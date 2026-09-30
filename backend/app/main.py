import logging
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.config import settings
from backend.app.api.incidents import router as incidents_router
from backend.app.api.resources import router as resources_router
from backend.app.api.response import router as response_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.demo import router as demo_router
from backend.app.services.coordination_service import coordination_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("crisis_command")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Crisis Command Center...")
    # Initialize demo data on startup
    coordination_service.load_scenario()
    logger.info(f"Crisis Command initialized with {len(coordination_service.incidents)} incidents and {len(coordination_service.resources)} resources.")
    yield
    logger.info("Crisis Command shutting down.")


app = FastAPI(
    title="Crisis Command: Multi-Agent Emergency Response API",
    description=(
        "Web-based Emergency Response Command Center orchestrating specialized AI agents, "
        "LangGraph decision workflows, and deterministic resource allocation for simultaneous disasters."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = settings.cors_origins_list
# Fallback to allow all if '*' is present or origins is empty
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(incidents_router)
app.include_router(resources_router)
app.include_router(response_router)
app.include_router(dashboard_router)
app.include_router(demo_router)

# Alias for replan endpoint
@app.post("/api/replan", tags=["Response Plan"], include_in_schema=False)
def replan_alias():
    from backend.app.api.response import trigger_replan
    return trigger_replan()



@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint for deployment monitoring."""
    return {
        "status": "healthy",
        "service": "Crisis Command API",
        "llm_provider": settings.LLM_PROVIDER,
        "active_incidents": len(coordination_service.incidents),
        "total_resources": len(coordination_service.resources),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str = ""):
        # Don't hijack API or docs routes
        if full_path.startswith(("api", "health", "docs", "redoc", "openapi.json")):
            raise HTTPException(status_code=404, detail="Not Found")
        target_file = FRONTEND_DIST / full_path
        if full_path and target_file.is_file():
            return FileResponse(str(target_file))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
else:
    @app.get("/", tags=["System"])
    def root():
        return {
            "message": "Crisis Command: The Multi-Agent Emergency Response & Resource Coordination Agent",
            "documentation": "/docs",
            "health": "/health",
            "status": "OPERATIONAL"
        }

