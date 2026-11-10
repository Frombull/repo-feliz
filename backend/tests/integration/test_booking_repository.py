from datetime import date, datetime

import pytest

from app.repositories.booking_repository import BookingRepository
from app.repositories.room_repository import RoomRepository


def at(hour, minute=0, day=10):
    return datetime(2030, 5, day, hour, minute)


@pytest.fixture
def room(session):
    return RoomRepository(session).add(name="Sala A", capacity=10)


@pytest.fixture
def repo(session):
    return BookingRepository(session)


def add(repo, room, start, end, **extra):
    fields = {"title": "Reuniao", "requester": "Ana", "attendees": 3}
    return repo.add(room_id=room.id, start_at=start, end_at=end, **fields, **extra)


def test_add_defaults_to_confirmed(repo, room):
    booking = add(repo, room, at(9), at(10))
    assert booking.status == "confirmed"
    assert repo.get(booking.id).title == "Reuniao"
    assert repo.get(999) is None


@pytest.mark.parametrize(
    "start, end, conflicts",
    [
        (at(8), at(9), False),  # termina quando a outra comeca
        (at(10), at(11), False),  # comeca quando a outra termina
        (at(8), at(9, 30), True),  # sobrepoe o comeco
        (at(9, 30), at(11), True),  # sobrepoe o fim
        (at(9, 15), at(9, 45), True),  # dentro da outra
        (at(8), at(11), True),  # contem a outra
        (at(9), at(10), True),  # mesmo horario
    ],
)
def test_find_conflicts_overlap_rules(repo, room, start, end, conflicts):
    add(repo, room, at(9), at(10))
    assert bool(repo.find_conflicts(room.id, start, end)) is conflicts


def test_find_conflicts_ignores_other_room_cancelled_and_excluded(session, repo, room):
    other = RoomRepository(session).add(name="Sala B", capacity=10)
    add(repo, other, at(9), at(10))
    add(repo, room, at(9), at(10), status="cancelled")
    assert repo.find_conflicts(room.id, at(9), at(10)) == []

    own = add(repo, room, at(9), at(10))
    assert repo.find_conflicts(room.id, at(9), at(10)) == [own]
    assert repo.find_conflicts(room.id, at(9), at(10), exclude_id=own.id) == []


def test_list_filters_and_orders(session, repo, room):
    other = RoomRepository(session).add(name="Sala B", capacity=10)
    late = add(repo, room, at(14), at(15))
    early = add(repo, room, at(9), at(10))
    next_day = add(repo, room, at(9, day=11), at(10, day=11))
    cancelled = add(repo, other, at(9), at(10), status="cancelled")

    assert repo.list() == [early, cancelled, late, next_day]
    assert repo.list(room_id=room.id) == [early, late, next_day]
    assert repo.list(status="cancelled") == [cancelled]
    assert repo.list(day=date(2030, 5, 10)) == [early, cancelled, late]
    assert repo.list(day=date(2030, 5, 11)) == [next_day]
    assert repo.list(room_id=room.id, status="confirmed", day=date(2030, 5, 10)) == [
        early,
        late,
    ]


def test_room_has_bookings_and_upcoming(session, repo, room):
    empty = RoomRepository(session).add(name="Vazia", capacity=2)
    assert repo.room_has_bookings(room.id) is False
    booking = add(repo, room, at(9), at(10))

    assert repo.room_has_bookings(room.id) is True
    assert repo.room_has_bookings(empty.id) is False
    assert repo.room_has_upcoming(room.id, at(9, 30)) is True
    assert repo.room_has_upcoming(room.id, at(10)) is False

    repo.update(booking, status="cancelled")
    assert repo.room_has_upcoming(room.id, at(8)) is False
    assert repo.room_has_bookings(room.id) is True


def test_update_and_delete(repo, room):
    booking = add(repo, room, at(9), at(10))
    repo.update(booking, title="Outra", attendees=5)
    assert repo.get(booking.id).title == "Outra"
    repo.delete(booking)
    assert repo.get(booking.id) is None
