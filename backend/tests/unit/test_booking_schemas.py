from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from app.schemas.booking import BookingCreate, BookingUpdate

VALID = {
    "room_id": 1,
    "title": "Reunião",
    "requester": "Ana",
    "attendees": 3,
    "start_at": "2030-05-10T09:00",
    "end_at": "2030-05-10T10:00",
}


def test_create_parses_local_datetimes_and_strips_text():
    data = BookingCreate(**{**VALID, "title": "  Reunião  ", "requester": " Ana "})
    assert data.title == "Reunião"
    assert data.requester == "Ana"
    assert data.start_at == datetime(2030, 5, 10, 9, 0)


@pytest.mark.parametrize(
    "change",
    [
        {"room_id": 0},
        {"title": ""},
        {"title": "x" * 101},
        {"requester": "  "},
        {"requester": "x" * 61},
        {"attendees": 0},
        {"start_at": "ontem"},
        {"end_at": "2030-05-10T09:00"},  # fim igual ao início
        {"end_at": "2030-05-10T08:00"},  # fim antes do início
        {"start_at": "2030-05-10T09:00Z"},  # com fuso
        {"end_at": "2030-05-10T10:00-03:00"},  # com fuso
    ],
)
def test_create_rejects_invalid_data(change):
    with pytest.raises(ValidationError):
        BookingCreate(**{**VALID, **change})


@pytest.mark.parametrize("missing", list(VALID))
def test_create_requires_every_field(missing):
    data = {k: v for k, v in VALID.items() if k != missing}
    with pytest.raises(ValidationError):
        BookingCreate(**data)


def test_update_only_includes_sent_fields():
    data = BookingUpdate(title="Nova", attendees=4)
    assert data.model_dump(exclude_unset=True) == {"title": "Nova", "attendees": 4}


@pytest.mark.parametrize("field", ["room_id", "title", "requester", "attendees"])
def test_update_rejects_explicit_null(field):
    with pytest.raises(ValidationError):
        BookingUpdate(**{field: None})


def test_update_rejects_timezone():
    aware = datetime(2030, 5, 10, 9, tzinfo=UTC)
    with pytest.raises(ValidationError):
        BookingUpdate(start_at=aware)
