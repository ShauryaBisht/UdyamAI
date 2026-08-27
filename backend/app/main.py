from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title="UdyamAI Backend API",
    description="API for UdyamAI business feasibility, financial analysis, geo services, and scheme recommendations.",
    version="1.0.0"
)

# Set CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": settings.VERSION}

@app.get("/")
def read_root():
    return {"message": "Welcome to UdyamAI Core API Services"}
