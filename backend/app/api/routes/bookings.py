from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status

from app.schemas.booking import Booking, BookingCreate, BookingStatus, BookingUpdate
from app.services.booking_service import BookingService, get_booking_service

router = APIRouter(prefix="/bookings", tags=["bookings"])

Service = Annotated[BookingService, Depends(get_booking_service)]
BookingId = Annotated[int, Path(gt=0)]


@router.get("", response_model=list[Booking])
def list_bookings(
    service: Service,
    room_id: Annotated[int | None, Query(gt=0)] = None,
    status: Annotated[BookingStatus | None, Query()] = None,
    day: Annotated[date | None, Query(alias="date")] = None,
):
    return service.list(room_id=room_id, status=status, day=day)


@router.get("/{booking_id}", response_model=Booking)
def get_booking(booking_id: BookingId, service: Service):
    return service.get(booking_id)


@router.post("", response_model=Booking, status_code=status.HTTP_201_CREATED)
def create_booking(data: BookingCreate, service: Service):
    return service.create(data)


@router.patch("/{booking_id}", response_model=Booking)
def update_booking(booking_id: BookingId, data: BookingUpdate, service: Service):
    return service.update(booking_id, data)


@router.post("/{booking_id}/cancel", response_model=Booking)
def cancel_booking(booking_id: BookingId, service: Service):
    return service.cancel(booking_id)


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(booking_id: BookingId, service: Service):
    service.delete(booking_id)
