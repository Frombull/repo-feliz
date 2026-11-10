"""Repositories em memória, para testar os services sem banco."""

from datetime import datetime, time, timedelta

from app.models.booking import CONFIRMED, BookingModel
from app.models.room import RoomModel


class FakeBookingRepository:
    def __init__(self):
        self._items: dict[int, BookingModel] = {}
        self._next_id = 1

    def list(self, room_id=None, status=None, day=None):
        items = sorted(self._items.values(), key=lambda b: (b.start_at, b.id))
        if room_id is not None:
            items = [b for b in items if b.room_id == room_id]
        if status is not None:
            items = [b for b in items if b.status == status]
        if day is not None:
            start = datetime.combine(day, time.min)
            end = start + timedelta(days=1)
            items = [b for b in items if start <= b.start_at < end]
        return items

    def get(self, booking_id):
        return self._items.get(booking_id)

    def find_conflicts(self, room_id, start_at, end_at, exclude_id=None):
        return [
            b
            for b in self.list(room_id=room_id)
            if b.status == CONFIRMED
            and b.id != exclude_id
            and b.start_at < end_at
            and b.end_at > start_at
        ]

    def room_has_bookings(self, room_id):
        return any(b.room_id == room_id for b in self._items.values())

    def room_has_upcoming(self, room_id, now):
        return any(
            b.room_id == room_id and b.status == CONFIRMED and b.end_at > now
            for b in self._items.values()
        )

    def add(self, **fields):
        booking = BookingModel(id=self._next_id, **fields)
        self._items[booking.id] = booking
        self._next_id += 1
        return booking

    def update(self, booking, **fields):
        for key, value in fields.items():
            setattr(booking, key, value)
        return booking

    def delete(self, booking):
        del self._items[booking.id]


class FakeRoomRepository:
    def __init__(self, bookings: FakeBookingRepository | None = None):
        self._items: dict[int, RoomModel] = {}
        self._next_id = 1
        self._bookings = bookings or FakeBookingRepository()

    def list(self, active=None):
        items = sorted(self._items.values(), key=lambda r: r.name)
        if active is not None:
            items = [r for r in items if r.active == active]
        return items

    def get(self, room_id):
        return self._items.get(room_id)

    def get_by_name(self, name):
        for room in self._items.values():
            if room.name.lower() == name.lower():
                return room
        return None

    def list_available(self, start_at, end_at, min_capacity=1):
        return [
            r
            for r in self.list()
            if r.active
            and r.capacity >= min_capacity
            and not self._bookings.find_conflicts(r.id, start_at, end_at)
        ]

    def add(self, **fields):
        room = RoomModel(id=self._next_id, **fields)
        self._items[room.id] = room
        self._next_id += 1
        return room

    def update(self, room, **fields):
        for key, value in fields.items():
            setattr(room, key, value)
        return room

    def delete(self, room):
        del self._items[room.id]
