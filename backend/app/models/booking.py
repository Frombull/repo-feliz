from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

CONFIRMED = "confirmed"
CANCELLED = "cancelled"


class BookingModel(Base):
    __tablename__ = "bookings"
    __table_args__ = (Index("ix_bookings_room_id_start_at", "room_id", "start_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id", ondelete="RESTRICT"))
    title: Mapped[str] = mapped_column(String(100))
    requester: Mapped[str] = mapped_column(String(60))
    attendees: Mapped[int] = mapped_column(Integer)
    start_at: Mapped[datetime] = mapped_column(DateTime)
    end_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), default=CONFIRMED)
