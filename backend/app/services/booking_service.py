from collections.abc import Sequence
from datetime import date, datetime, time, timedelta
from typing import Annotated

from fastapi import Depends

from app.core.errors import BusinessRuleError, ConflictError, NotFoundError
from app.models.booking import CANCELLED, CONFIRMED
from app.repositories.booking_repository import (
    BookingRepository,
    get_booking_repository,
)
from app.repositories.room_repository import RoomRepository, get_room_repository
from app.schemas.booking import Booking, BookingCreate, BookingUpdate
from app.services.room_service import Clock, get_clock

OPENING_TIME = time(7, 0)
CLOSING_TIME = time(22, 0)
MIN_DURATION = timedelta(minutes=15)
MAX_DURATION = timedelta(hours=8)


class BookingService:
    def __init__(
        self,
        bookings: BookingRepository,
        rooms: RoomRepository,
        clock: Clock = datetime.now,
    ):
        self._bookings = bookings
        self._rooms = rooms
        self._clock = clock

    def list(
        self,
        room_id: int | None = None,
        status: str | None = None,
        day: date | None = None,
    ) -> Sequence[Booking]:
        models = self._bookings.list(room_id=room_id, status=status, day=day)
        return [Booking.model_validate(m) for m in models]

    def get(self, booking_id: int) -> Booking:
        return Booking.model_validate(self._get_model(booking_id))

    def create(self, data: BookingCreate) -> Booking:
        self._check_rules(
            data.room_id, data.attendees, data.start_at, data.end_at, exclude_id=None
        )
        model = self._bookings.add(**data.model_dump(), status=CONFIRMED)
        return Booking.model_validate(model)

    def update(self, booking_id: int, data: BookingUpdate) -> Booking:
        model = self._get_model(booking_id)
        if model.status == CANCELLED:
            raise ConflictError("Uma reserva cancelada não pode ser alterada")
        if model.start_at <= self._clock():
            raise ConflictError("Uma reserva que já começou não pode ser alterada")

        changes = data.model_dump(exclude_unset=True)
        merged = {
            "room_id": model.room_id,
            "attendees": model.attendees,
            "start_at": model.start_at,
            "end_at": model.end_at,
            **{k: v for k, v in changes.items() if k in _CHECKED_FIELDS},
        }
        self._check_rules(exclude_id=booking_id, **merged)
        model = self._bookings.update(model, **changes)
        return Booking.model_validate(model)

    def cancel(self, booking_id: int) -> Booking:
        model = self._get_model(booking_id)
        if model.status == CANCELLED:
            raise ConflictError("A reserva já está cancelada")
        if model.start_at <= self._clock():
            raise ConflictError(
                "Uma reserva que já começou ou terminou não pode ser cancelada"
            )
        model = self._bookings.update(model, status=CANCELLED)
        return Booking.model_validate(model)

    def delete(self, booking_id: int) -> None:
        model = self._get_model(booking_id)
        finished = model.end_at <= self._clock()
        if model.status == CONFIRMED and not finished:
            raise ConflictError("Cancele a reserva antes de excluí-la")
        self._bookings.delete(model)

    def _get_model(self, booking_id: int):
        model = self._bookings.get(booking_id)
        if model is None:
            raise NotFoundError("Reserva não encontrada")
        return model

    def _check_rules(
        self,
        room_id: int,
        attendees: int,
        start_at: datetime,
        end_at: datetime,
        exclude_id: int | None,
    ) -> None:
        room = self._rooms.get(room_id)
        if room is None:
            raise NotFoundError("Sala não encontrada")
        self._check_period(start_at, end_at)
        if not room.active:
            raise ConflictError("A sala está desativada e não aceita reservas")
        if attendees > room.capacity:
            raise BusinessRuleError(
                f"A sala comporta {room.capacity} pessoas e a reserva tem {attendees}"
            )
        conflicts = self._bookings.find_conflicts(
            room_id, start_at, end_at, exclude_id=exclude_id
        )
        if conflicts:
            other = conflicts[0]
            raise ConflictError(
                "A sala já está reservada das "
                f"{other.start_at:%H:%M} às {other.end_at:%H:%M} "
                f"({other.title})"
            )

    def _check_period(self, start_at: datetime, end_at: datetime) -> None:
        if end_at <= start_at:
            raise BusinessRuleError("O fim deve ser depois do início")
        if start_at < self._clock():
            raise BusinessRuleError("Não é possível reservar um horário que já passou")
        closing = datetime.combine(start_at.date(), CLOSING_TIME)
        if start_at.time() < OPENING_TIME or end_at > closing:
            raise BusinessRuleError(
                "As reservas devem ficar entre "
                f"{OPENING_TIME:%H:%M} e {CLOSING_TIME:%H:%M}, no mesmo dia"
            )
        duration = end_at - start_at
        if duration < MIN_DURATION:
            minutes = int(MIN_DURATION.total_seconds() // 60)
            raise BusinessRuleError(f"A reserva deve durar ao menos {minutes} minutos")
        if duration > MAX_DURATION:
            hours = int(MAX_DURATION.total_seconds() // 3600)
            raise BusinessRuleError(f"A reserva pode durar no máximo {hours} horas")


_CHECKED_FIELDS = {"room_id", "attendees", "start_at", "end_at"}


def get_booking_service(
    bookings: Annotated[BookingRepository, Depends(get_booking_repository)],
    rooms: Annotated[RoomRepository, Depends(get_room_repository)],
    clock: Annotated[Clock, Depends(get_clock)],
) -> BookingService:
    return BookingService(bookings, rooms, clock)
