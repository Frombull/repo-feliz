from collections.abc import Sequence
from datetime import datetime
from typing import Annotated

from fastapi import Depends
from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.booking import CONFIRMED, BookingModel
from app.models.room import RoomModel


class RoomRepository:
    def __init__(self, session: Session):
        self._session = session

    def list(self, active: bool | None = None) -> list[RoomModel]:
        stmt = select(RoomModel).order_by(RoomModel.name)
        if active is not None:
            stmt = stmt.where(RoomModel.active == active)
        return list(self._session.scalars(stmt))

    def get(self, room_id: int) -> RoomModel | None:
        return self._session.get(RoomModel, room_id)

    def get_by_name(self, name: str) -> RoomModel | None:
        stmt = select(RoomModel).where(func.lower(RoomModel.name) == name.lower())
        return self._session.scalars(stmt).first()

    def list_available(
        self, start_at: datetime, end_at: datetime, min_capacity: int = 1
    ) -> Sequence[RoomModel]:
        """Salas ativas, com a capacidade pedida e sem reserva confirmada no periodo."""
        busy = exists().where(
            BookingModel.room_id == RoomModel.id,
            BookingModel.status == CONFIRMED,
            BookingModel.start_at < end_at,
            BookingModel.end_at > start_at,
        )
        stmt = (
            select(RoomModel)
            .where(RoomModel.active.is_(True), RoomModel.capacity >= min_capacity)
            .where(~busy)
            .order_by(RoomModel.capacity, RoomModel.name)
        )
        return list(self._session.scalars(stmt))

    def add(self, **fields) -> RoomModel:
        room = RoomModel(**fields)
        self._session.add(room)
        self._session.commit()
        return room

    def update(self, room: RoomModel, **fields) -> RoomModel:
        for key, value in fields.items():
            setattr(room, key, value)
        self._session.commit()
        return room

    def delete(self, room: RoomModel) -> None:
        self._session.delete(room)
        self._session.commit()


def get_room_repository(session: Annotated[Session, Depends(get_db)]) -> RoomRepository:
    return RoomRepository(session)
