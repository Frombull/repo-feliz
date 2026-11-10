from datetime import datetime

import pytest

from app.repositories.booking_repository import BookingRepository
from app.repositories.room_repository import RoomRepository

INTERVAL = (datetime(2030, 5, 10, 9, 0), datetime(2030, 5, 10, 10, 0))


@pytest.fixture
def rooms(session):
    return RoomRepository(session)


@pytest.fixture
def bookings(session):
    return BookingRepository(session)


def test_add_and_get(rooms):
    room = rooms.add(name="Sala A", capacity=10, location="Bloco 1")
    assert room.id is not None
    assert rooms.get(room.id).name == "Sala A"
    assert rooms.get(999) is None


def test_get_by_name_ignores_case(rooms):
    rooms.add(name="Sala A", capacity=10)
    assert rooms.get_by_name("sala a") is not None
    assert rooms.get_by_name("Sala B") is None


def test_list_orders_by_name_and_filters_active(rooms):
    rooms.add(name="Sala B", capacity=4)
    rooms.add(name="Sala A", capacity=4, active=False)
    assert [r.name for r in rooms.list()] == ["Sala A", "Sala B"]
    assert [r.name for r in rooms.list(active=True)] == ["Sala B"]
    assert [r.name for r in rooms.list(active=False)] == ["Sala A"]


def test_update_and_delete(rooms):
    room = rooms.add(name="Sala A", capacity=10)
    rooms.update(room, capacity=12)
    assert rooms.get(room.id).capacity == 12
    rooms.delete(room)
    assert rooms.get(room.id) is None


def test_list_available_filters_capacity_active_and_conflicts(rooms, bookings):
    small = rooms.add(name="Pequena", capacity=4)
    big = rooms.add(name="Grande", capacity=20)
    busy = rooms.add(name="Ocupada", capacity=20)
    rooms.add(name="Inativa", capacity=20, active=False)
    cancelled = rooms.add(name="Cancelada", capacity=20)
    for room, status in ((busy, "confirmed"), (cancelled, "cancelled")):
        bookings.add(
            room_id=room.id,
            title="x",
            requester="y",
            attendees=2,
            start_at=INTERVAL[0],
            end_at=INTERVAL[1],
            status=status,
        )

    names = [r.name for r in rooms.list_available(*INTERVAL)]
    assert names == ["Pequena", "Cancelada", "Grande"]

    names = [r.name for r in rooms.list_available(*INTERVAL, min_capacity=10)]
    assert names == ["Cancelada", "Grande"]
    assert small.id not in [r.id for r in rooms.list_available(*INTERVAL, 10)]
    assert big.id in [r.id for r in rooms.list_available(*INTERVAL, 10)]
