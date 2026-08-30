from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analysis, businesses, finance, health, locations, reports, schemes, users
from app.config import settings
from app.utils.errors import setup_exception_handlers
from app.utils.logging import setup_logging

# Setup logging
setup_logging()

app = FastAPI(
    title="UdyamAI Backend API",
    description="API for UdyamAI business feasibility, financial analysis, geo services, and scheme recommendations.",
    version=settings.VERSION,
)

# Set CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup custom exception handlers
setup_exception_handlers(app)

# Include Routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(locations.router, prefix="/locations", tags=["Locations"])
app.include_router(businesses.router, prefix="/business-categories", tags=["Business Categories"])
app.include_router(schemes.router, prefix="/schemes", tags=["Schemes"])
app.include_router(analysis.router, prefix="/analysis", tags=["Feasibility Analysis"])
app.include_router(finance.router, prefix="/finance", tags=["Finance"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(users.router, prefix="/users", tags=["Users"])


@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} Core API Services"}
