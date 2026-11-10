from collections.abc import Callable, Sequence
from datetime import datetime
from typing import Annotated

from fastapi import Depends

from app.core.errors import BusinessRuleError, ConflictError, NotFoundError
from app.repositories.booking_repository import (
    BookingRepository,
    get_booking_repository,
)
from app.repositories.room_repository import RoomRepository, get_room_repository
from app.schemas.room import Room, RoomCreate, RoomUpdate

Clock = Callable[[], datetime]


def get_clock() -> Clock:
    return datetime.now


class RoomService:
    def __init__(
        self,
        rooms: RoomRepository,
        bookings: BookingRepository,
        clock: Clock = datetime.now,
    ):
        self._rooms = rooms
        self._bookings = bookings
        self._clock = clock

    def list(self, active: bool | None = None) -> list[Room]:
        return [Room.model_validate(m) for m in self._rooms.list(active)]

    def get(self, room_id: int) -> Room:
        return Room.model_validate(self._get_model(room_id))

    def create(self, data: RoomCreate) -> Room:
        self._ensure_name_is_free(data.name)
        model = self._rooms.add(**data.model_dump(), active=True)
        return Room.model_validate(model)

    def update(self, room_id: int, data: RoomUpdate) -> Room:
        model = self._get_model(room_id)
        changes = data.model_dump(exclude_unset=True)
        if "name" in changes:
            self._ensure_name_is_free(changes["name"], ignore_id=room_id)
        deactivating = changes.get("active") is False and model.active
        if deactivating and self._bookings.room_has_upcoming(room_id, self._clock()):
            raise ConflictError(
                "A sala tem reservas confirmadas que ainda não terminaram. "
                "Cancele-as antes de desativar a sala."
            )
        model = self._rooms.update(model, **changes)
        return Room.model_validate(model)

    def delete(self, room_id: int) -> None:
        model = self._get_model(room_id)
        if self._bookings.room_has_bookings(room_id):
            raise ConflictError(
                "A sala já tem reservas e não pode ser excluída. Desative-a no lugar."
            )
        self._rooms.delete(model)

    def available(
        self, start_at: datetime, end_at: datetime, min_capacity: int = 1
    ) -> Sequence[Room]:
        """Salas ativas, com a capacidade pedida e livres durante todo o período."""
        if end_at <= start_at:
            raise BusinessRuleError("O fim deve ser depois do início")
        models = self._rooms.list_available(start_at, end_at, min_capacity)
        return [Room.model_validate(m) for m in models]

    def _get_model(self, room_id: int):
        model = self._rooms.get(room_id)
        if model is None:
            raise NotFoundError("Sala não encontrada")
        return model

    def _ensure_name_is_free(self, name: str, ignore_id: int | None = None) -> None:
        existing = self._rooms.get_by_name(name)
        if existing is not None and existing.id != ignore_id:
            raise ConflictError("Já existe uma sala com esse nome")


def get_room_service(
    rooms: Annotated[RoomRepository, Depends(get_room_repository)],
    bookings: Annotated[BookingRepository, Depends(get_booking_repository)],
    clock: Annotated[Clock, Depends(get_clock)],
) -> RoomService:
    return RoomService(rooms, bookings, clock)
