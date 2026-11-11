from datetime import date, datetime

import pytest

from app.core.errors import BusinessRuleError, ConflictError, NotFoundError
from app.schemas.booking import BookingCreate, BookingUpdate
from app.services.booking_service import BookingService
from tests.unit.fakes import FakeBookingRepository, FakeRoomRepository

NOW = datetime(2030, 5, 10, 8, 0)


def at(hour, minute=0, day=10):
    return datetime(2030, 5, day, hour, minute)


class Clock:
    def __init__(self, value):
        self.value = value

    def __call__(self):
        return self.value


@pytest.fixture
def clock():
    return Clock(NOW)


@pytest.fixture
def rooms():
    repo = FakeRoomRepository()
    repo.add(name="Sala A", capacity=10, location=None, active=True)  # id 1
    repo.add(name="Sala B", capacity=5, location=None, active=True)  # id 2
    repo.add(name="Sala C", capacity=10, location=None, active=False)  # id 3
    return repo


@pytest.fixture
def service(rooms, clock):
    return BookingService(FakeBookingRepository(), rooms, clock)


def data(room_id=1, start=None, end=None, attendees=3, title="Reunião"):
    return BookingCreate(
        room_id=room_id,
        title=title,
        requester="Ana",
        attendees=attendees,
        start_at=start or at(9),
        end_at=end or at(10),
    )


# criação: caminho feliz


def test_create_confirms_the_booking(service):
    booking = service.create(data())
    assert booking.id == 1
    assert booking.status == "confirmed"
    assert (booking.start_at, booking.end_at) == (at(9), at(10))


def test_back_to_back_bookings_do_not_conflict(service):
    service.create(data(start=at(9), end=at(10)))
    service.create(data(start=at(10), end=at(11)))
    service.create(data(start=at(8), end=at(9)))
    assert len(service.list()) == 3


def test_same_period_in_another_room_is_allowed(service):
    service.create(data(room_id=1))
    assert service.create(data(room_id=2)).room_id == 2


# criação: conflito de horário


@pytest.mark.parametrize(
    "start, end",
    [(at(9), at(10)), (at(8, 30), at(9, 30)), (at(9, 30), at(10, 30)), (at(8), at(11))],
)
def test_overlapping_booking_is_rejected(service, start, end):
    service.create(data(start=at(9), end=at(10), title="Daily"))
    with pytest.raises(ConflictError, match=r"09:00 às 10:00 \(Daily\)"):
        service.create(data(start=start, end=end))


def test_cancelled_booking_frees_the_slot(service):
    first = service.create(data())
    service.cancel(first.id)
    assert service.create(data()).status == "confirmed"


# criação: demais regras


def test_unknown_room(service):
    with pytest.raises(NotFoundError, match="Sala não encontrada"):
        service.create(data(room_id=99))


def test_inactive_room_does_not_accept_bookings(service):
    with pytest.raises(ConflictError, match="desativada"):
        service.create(data(room_id=3))


def test_attendees_cannot_exceed_capacity(service):
    service.create(data(room_id=2, attendees=5))
    with pytest.raises(BusinessRuleError, match="comporta 5 pessoas"):
        service.create(data(room_id=2, attendees=6, start=at(11), end=at(12)))


def test_cannot_book_in_the_past(service):
    with pytest.raises(BusinessRuleError, match="já passou"):
        service.create(data(start=at(7), end=at(7, 30)))


def test_can_book_starting_exactly_now(service):
    assert service.create(data(start=at(8), end=at(9))).status == "confirmed"


@pytest.mark.parametrize(
    "start, end",
    [
        (at(6, 30, day=11), at(8, day=11)),  # começa antes da abertura
        (at(21, day=11), at(22, 30, day=11)),  # termina depois do fechamento
        (at(21, day=11), at(1, day=12)),  # atravessa a meia-noite
    ],
)
def test_booking_must_fit_in_business_hours(service, start, end):
    with pytest.raises(BusinessRuleError, match="07:00 e 22:00"):
        service.create(data(start=start, end=end))


def test_booking_can_use_the_whole_business_day_limits(service):
    booking = service.create(data(start=at(7, day=11), end=at(15, day=11)))
    assert booking.end_at == at(15, day=11)
    assert service.create(data(start=at(21, day=11), end=at(22, day=11)))


def test_minimum_duration(service):
    with pytest.raises(BusinessRuleError, match="ao menos 15 minutos"):
        service.create(data(start=at(9), end=at(9, 10)))
    assert service.create(data(start=at(9), end=at(9, 15)))


def test_maximum_duration(service):
    with pytest.raises(BusinessRuleError, match="no máximo 8 horas"):
        service.create(data(start=at(9), end=at(17, 1)))
    assert service.create(data(start=at(9), end=at(17)))


def test_inverted_period_is_rejected_by_the_service_too(service):
    # o schema já barra, o service não confia nisso
    booking = data()
    booking.end_at = at(8, 30)
    with pytest.raises(BusinessRuleError, match="depois do início"):
        service.create(booking)


# consulta


def test_get_and_list_filters(service):
    a = service.create(data(room_id=1, start=at(9), end=at(10)))
    b = service.create(data(room_id=2, start=at(9), end=at(10)))
    c = service.create(data(room_id=1, start=at(9, day=11), end=at(10, day=11)))
    service.cancel(b.id)

    assert service.get(a.id) == a
    assert [x.id for x in service.list()] == [a.id, b.id, c.id]
    assert [x.id for x in service.list(room_id=1)] == [a.id, c.id]
    assert [x.id for x in service.list(status="cancelled")] == [b.id]
    assert [x.id for x in service.list(day=date(2030, 5, 11))] == [c.id]


def test_get_missing_booking(service):
    with pytest.raises(NotFoundError, match="Reserva não encontrada"):
        service.get(99)


# alteração


def test_update_changes_only_sent_fields(service):
    booking = service.create(data())
    updated = service.update(booking.id, BookingUpdate(title="Nova", attendees=4))
    assert (updated.title, updated.attendees) == ("Nova", 4)
    assert (updated.start_at, updated.end_at) == (at(9), at(10))


def test_update_can_reschedule_over_its_own_slot(service):
    booking = service.create(data(start=at(9), end=at(10)))
    updated = service.update(booking.id, BookingUpdate(end_at=at(11)))
    assert updated.end_at == at(11)


def test_update_cannot_move_onto_another_booking(service):
    service.create(data(start=at(9), end=at(10)))
    second = service.create(data(start=at(11), end=at(12)))
    with pytest.raises(ConflictError):
        service.update(second.id, BookingUpdate(start_at=at(9, 30), end_at=at(10, 30)))
    assert service.get(second.id).start_at == at(11)


def test_update_can_change_room_but_respects_its_rules(service):
    booking = service.create(data(room_id=1, attendees=8))
    with pytest.raises(BusinessRuleError, match="comporta 5"):
        service.update(booking.id, BookingUpdate(room_id=2))
    with pytest.raises(ConflictError, match="desativada"):
        service.update(booking.id, BookingUpdate(room_id=3))
    with pytest.raises(NotFoundError):
        service.update(booking.id, BookingUpdate(room_id=99))
    assert (
        service.update(booking.id, BookingUpdate(room_id=2, attendees=4)).room_id == 2
    )


def test_update_validates_the_resulting_period(service):
    booking = service.create(data(start=at(9), end=at(10)))
    with pytest.raises(BusinessRuleError, match="depois do início"):
        service.update(booking.id, BookingUpdate(end_at=at(8, 30)))
    with pytest.raises(BusinessRuleError, match="no máximo 8 horas"):
        service.update(booking.id, BookingUpdate(end_at=at(18)))


def test_cancelled_booking_cannot_be_updated(service):
    booking = service.create(data())
    service.cancel(booking.id)
    with pytest.raises(ConflictError, match="cancelada"):
        service.update(booking.id, BookingUpdate(title="Nova"))


def test_started_booking_cannot_be_updated(service, clock):
    booking = service.create(data(start=at(9), end=at(10)))
    clock.value = at(9)
    with pytest.raises(ConflictError, match="já começou"):
        service.update(booking.id, BookingUpdate(title="Nova"))


def test_update_missing_booking(service):
    with pytest.raises(NotFoundError):
        service.update(99, BookingUpdate(title="Nova"))


# cancelamento


def test_cancel_marks_booking_as_cancelled(service):
    booking = service.create(data())
    assert service.cancel(booking.id).status == "cancelled"
    assert service.get(booking.id).status == "cancelled"


def test_cannot_cancel_twice(service):
    booking = service.create(data())
    service.cancel(booking.id)
    with pytest.raises(ConflictError, match="já está cancelada"):
        service.cancel(booking.id)


def test_cannot_cancel_started_booking(service, clock):
    booking = service.create(data(start=at(9), end=at(10)))
    clock.value = at(9, 30)
    with pytest.raises(ConflictError, match="já começou"):
        service.cancel(booking.id)


def test_cancel_missing_booking(service):
    with pytest.raises(NotFoundError):
        service.cancel(99)


# exclusão


def test_cannot_delete_active_future_booking(service):
    booking = service.create(data())
    with pytest.raises(ConflictError, match="Cancele a reserva"):
        service.delete(booking.id)
    assert len(service.list()) == 1


def test_can_delete_cancelled_booking(service):
    booking = service.create(data())
    service.cancel(booking.id)
    service.delete(booking.id)
    assert service.list() == []


def test_can_delete_finished_booking(service, clock):
    booking = service.create(data(start=at(9), end=at(10)))
    clock.value = at(10)
    service.delete(booking.id)
    assert service.list() == []


def test_delete_missing_booking(service):
    with pytest.raises(NotFoundError):
        service.delete(99)
