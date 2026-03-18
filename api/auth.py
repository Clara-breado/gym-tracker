from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

from api.config import get_settings

API_KEY_HEADER = APIKeyHeader(name="X-API-Key")


async def verify_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    settings = get_settings()
    if not settings["API_KEY"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API_KEY not configured on server",
        )
    if api_key != settings["API_KEY"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )
    return api_key
