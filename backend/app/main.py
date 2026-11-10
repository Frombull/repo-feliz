from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.errors import register_error_handlers
from app.api.routes import health, rooms
from app.config import get_cors_origins

app = FastAPI(title="Reserva de Salas")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

register_error_handlers(app)

app.include_router(health.router)
app.include_router(rooms.router)
