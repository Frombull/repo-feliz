from datetime import datetime

import pytest

from app.core.errors import BusinessRuleError, ConflictError, NotFoundError
from app.schemas.room import RoomCreate, RoomUpdate
from app.services.room_service import RoomService
from tests.unit.fakes import FakeBookingRepository, FakeRoomRepository

NOW = datetime(2030, 5, 10, 8, 0)


@pytest.fixture
def bookings():
    return FakeBookingRepository()


@pytest.fixture
def service(bookings):
    return RoomService(FakeRoomRepository(bookings), bookings, clock=lambda: NOW)


def book(bookings, room_id, start_hour, end_hour, status="confirmed"):
    return bookings.add(
        room_id=room_id,
        title="Reunião",
        requester="Ana",
        attendees=2,
        start_at=datetime(2030, 5, 10, start_hour),
        end_at=datetime(2030, 5, 10, end_hour),
        status=status,
    )


def test_create_returns_active_room_with_id(service):
    room = service.create(RoomCreate(name="Sala A", capacity=10, location="Bloco 1"))
    assert (room.id, room.name, room.capacity, room.active) == (1, "Sala A", 10, True)
    assert room.location == "Bloco 1"


def test_create_rejects_duplicate_name_ignoring_case(service):
    service.create(RoomCreate(name="Sala A", capacity=10))
    with pytest.raises(ConflictError, match="Já existe uma sala"):
        service.create(RoomCreate(name="sala a", capacity=4))


def test_get_missing_room(service):
    with pytest.raises(NotFoundError):
        service.get(99)


def test_list_filters_by_active(service):
    service.create(RoomCreate(name="Sala A", capacity=10))
    other = service.create(RoomCreate(name="Sala B", capacity=10))
    service.update(other.id, RoomUpdate(active=False))
    assert [r.name for r in service.list()] == ["Sala A", "Sala B"]
    assert [r.name for r in service.list(active=True)] == ["Sala A"]
    assert [r.name for r in service.list(active=False)] == ["Sala B"]


def test_update_changes_only_sent_fields(service):
    room = service.create(RoomCreate(name="Sala A", capacity=10, location="Bloco 1"))
    updated = service.update(room.id, RoomUpdate(capacity=12))
    assert (updated.name, updated.capacity, updated.location) == (
        "Sala A",
        12,
        "Bloco 1",
    )


def test_update_can_keep_own_name_but_not_take_another(service):
    a = service.create(RoomCreate(name="Sala A", capacity=10))
    service.create(RoomCreate(name="Sala B", capacity=10))
    assert service.update(a.id, RoomUpdate(name="Sala A")).name == "Sala A"
    with pytest.raises(ConflictError):
        service.update(a.id, RoomUpdate(name="Sala B"))


def test_update_missing_room(service):
    with pytest.raises(NotFoundError):
        service.update(99, RoomUpdate(capacity=3))


def test_cannot_deactivate_room_with_upcoming_booking(service, bookings):
    room = service.create(RoomCreate(name="Sala A", capacity=10))
    book(bookings, room.id, 9, 10)
    with pytest.raises(ConflictError, match="Cancele-as"):
        service.update(room.id, RoomUpdate(active=False))
    assert service.get(room.id).active is True


def test_can_deactivate_room_when_bookings_are_cancelled_or_finished(service, bookings):
    room = service.create(RoomCreate(name="Sala A", capacity=10))
    book(bookings, room.id, 9, 10, status="cancelled")
    book(bookings, room.id, 6, 8)  # terminou exatamente no "agora"
    assert service.update(room.id, RoomUpdate(active=False)).active is False


def test_can_reactivate_room(service):
    room = service.create(RoomCreate(name="Sala A", capacity=10))
    service.update(room.id, RoomUpdate(active=False))
    assert service.update(room.id, RoomUpdate(active=True)).active is True


def test_delete_room_without_bookings(service):
    room = service.create(RoomCreate(name="Sala A", capacity=10))
    service.delete(room.id)
    assert service.list() == []


def test_cannot_delete_room_that_has_bookings(service, bookings):
    room = service.create(RoomCreate(name="Sala A", capacity=10))
    book(bookings, room.id, 9, 10, status="cancelled")
    with pytest.raises(ConflictError, match="Desative-a"):
        service.delete(room.id)
    assert len(service.list()) == 1


def test_delete_missing_room(service):
    with pytest.raises(NotFoundError):
        service.delete(99)


def test_available_excludes_busy_inactive_and_small_rooms(service, bookings):
    small = service.create(RoomCreate(name="Pequena", capacity=2))
    free = service.create(RoomCreate(name="Livre", capacity=10))
    busy = service.create(RoomCreate(name="Ocupada", capacity=10))
    inactive = service.create(RoomCreate(name="Inativa", capacity=10))
    service.update(inactive.id, RoomUpdate(active=False))
    book(bookings, busy.id, 9, 10)

    start, end = datetime(2030, 5, 10, 9, 30), datetime(2030, 5, 10, 10, 30)
    names = [r.name for r in service.available(start, end)]
    assert names == ["Livre", "Pequena"]
    names = [r.name for r in service.available(start, end, min_capacity=5)]
    assert names == ["Livre"]
    assert small.id != free.id


def test_available_rejects_inverted_period(service):
    start = datetime(2030, 5, 10, 10)
    with pytest.raises(BusinessRuleError):
        service.available(start, start)
