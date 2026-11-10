from collections.abc import Sequence
from datetime import date, datetime, time, timedelta
from typing import Annotated

from fastapi import Depends
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.booking import CONFIRMED, BookingModel


class BookingRepository:
    def __init__(self, session: Session):
        self._session = session

    def list(
        self,
        room_id: int | None = None,
        status: str | None = None,
        day: date | None = None,
    ) -> list[BookingModel]:
        stmt = select(BookingModel).order_by(BookingModel.start_at, BookingModel.id)
        if room_id is not None:
            stmt = stmt.where(BookingModel.room_id == room_id)
        if status is not None:
            stmt = stmt.where(BookingModel.status == status)
        if day is not None:
            start = datetime.combine(day, time.min)
            stmt = stmt.where(
                BookingModel.start_at >= start,
                BookingModel.start_at < start + timedelta(days=1),
            )
        return list(self._session.scalars(stmt))

    def get(self, booking_id: int) -> BookingModel | None:
        return self._session.get(BookingModel, booking_id)

    def find_conflicts(
        self,
        room_id: int,
        start_at: datetime,
        end_at: datetime,
        exclude_id: int | None = None,
    ) -> Sequence[BookingModel]:
        """Reservas confirmadas da sala que se sobrepoem ao periodo.

        Reservas encostadas (uma termina quando a outra comeca) nao conflitam.
        """
        stmt = (
            select(BookingModel)
            .where(
                BookingModel.room_id == room_id,
                BookingModel.status == CONFIRMED,
                BookingModel.start_at < end_at,
                BookingModel.end_at > start_at,
            )
            .order_by(BookingModel.start_at)
        )
        if exclude_id is not None:
            stmt = stmt.where(BookingModel.id != exclude_id)
        return list(self._session.scalars(stmt))

    def room_has_bookings(self, room_id: int) -> bool:
        stmt = select(exists().where(BookingModel.room_id == room_id))
        return bool(self._session.scalar(stmt))

    def room_has_upcoming(self, room_id: int, now: datetime) -> bool:
        """Se a sala tem reserva confirmada que ainda nao terminou."""
        stmt = select(
            exists().where(
                BookingModel.room_id == room_id,
                BookingModel.status == CONFIRMED,
                BookingModel.end_at > now,
            )
        )
        return bool(self._session.scalar(stmt))

    def add(self, **fields) -> BookingModel:
        booking = BookingModel(**fields)
        self._session.add(booking)
        self._session.commit()
        return booking

    def update(self, booking: BookingModel, **fields) -> BookingModel:
        for key, value in fields.items():
            setattr(booking, key, value)
        self._session.commit()
        return booking

    def delete(self, booking: BookingModel) -> None:
        self._session.delete(booking)
        self._session.commit()


def get_booking_repository(
    session: Annotated[Session, Depends(get_db)],
) -> BookingRepository:
    return BookingRepository(session)
