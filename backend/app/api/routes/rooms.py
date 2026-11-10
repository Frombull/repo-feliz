from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status

from app.schemas.common import LocalDateTime
from app.schemas.room import Room, RoomCreate, RoomUpdate
from app.services.room_service import RoomService, get_room_service

router = APIRouter(prefix="/rooms", tags=["rooms"])

Service = Annotated[RoomService, Depends(get_room_service)]
RoomId = Annotated[int, Path(gt=0)]


@router.get("", response_model=list[Room])
def list_rooms(service: Service, active: Annotated[bool | None, Query()] = None):
    return service.list(active)


# precisa vir antes de "/{room_id}", senão "available" seria lido como id
@router.get("/available", response_model=list[Room])
def list_available_rooms(
    service: Service,
    start_at: Annotated[LocalDateTime, Query()],
    end_at: Annotated[LocalDateTime, Query()],
    min_capacity: Annotated[int, Query(ge=1)] = 1,
):
    return service.available(start_at, end_at, min_capacity)


@router.get("/{room_id}", response_model=Room)
def get_room(room_id: RoomId, service: Service):
    return service.get(room_id)


@router.post("", response_model=Room, status_code=status.HTTP_201_CREATED)
def create_room(data: RoomCreate, service: Service):
    return service.create(data)


@router.patch("/{room_id}", response_model=Room)
def update_room(room_id: RoomId, data: RoomUpdate, service: Service):
    return service.update(room_id, data)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: RoomId, service: Service):
    service.delete(room_id)
