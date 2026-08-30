from fastapi import APIRouter, HTTPException
from app.database import verify_db_connection
from app.config import settings

router = APIRouter()

@router.get("")
def health_check():
    db_ok = verify_db_connection()
    status = "healthy" if db_ok else "unhealthy"
    
    if not db_ok:
        raise HTTPException(
            status_code=503,
            detail={
                "status": status,
                "version": settings.VERSION,
                "database": "disconnected"
            }
        )
        
    return {
        "status": status,
        "version": settings.VERSION,
        "database": "connected"
    }
