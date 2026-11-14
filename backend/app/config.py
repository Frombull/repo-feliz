import os

DEFAULT_CORS_ORIGINS = "http://localhost:5173"


def get_cors_origins() -> list[str]:
    """Origens do frontend autorizadas, separadas por vírgula em CORS_ORIGINS."""
    raw = os.getenv("CORS_ORIGINS") or DEFAULT_CORS_ORIGINS
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    if "*" in origins:
        raise ValueError("CORS_ORIGINS deve listar as origens explicitamente, sem '*'")
    return origins
