from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RoomModel(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True)
    capacity: Mapped[int] = mapped_column(Integer)
    location: Mapped[str | None] = mapped_column(String(100), default=None)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
