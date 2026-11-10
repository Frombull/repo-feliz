import pytest
from pydantic import ValidationError

from app.schemas.room import RoomCreate, RoomUpdate


def test_create_accepts_valid_data_and_strips_text():
    room = RoomCreate(name="  Sala A  ", capacity=10, location="  Bloco 1 ")
    assert room.name == "Sala A"
    assert room.location == "Bloco 1"


def test_create_location_is_optional_and_blank_becomes_none():
    assert RoomCreate(name="Sala A", capacity=10).location is None
    assert RoomCreate(name="Sala A", capacity=10, location="   ").location is None


@pytest.mark.parametrize(
    "data",
    [
        {"name": "", "capacity": 10},
        {"name": "   ", "capacity": 10},
        {"name": "x" * 61, "capacity": 10},
        {"name": "Sala A", "capacity": 0},
        {"name": "Sala A", "capacity": -3},
        {"name": "Sala A", "capacity": 501},
        {"name": "Sala A", "capacity": "muitas"},
        {"name": "Sala A", "capacity": 10, "location": "x" * 101},
        {"capacity": 10},
        {"name": "Sala A"},
    ],
)
def test_create_rejects_invalid_data(data):
    with pytest.raises(ValidationError):
        RoomCreate(**data)


def test_update_only_includes_sent_fields():
    data = RoomUpdate(capacity=12)
    assert data.model_dump(exclude_unset=True) == {"capacity": 12}


def test_update_can_clear_location():
    data = RoomUpdate(location="")
    assert data.model_dump(exclude_unset=True) == {"location": None}


@pytest.mark.parametrize("field", ["name", "capacity", "active"])
def test_update_rejects_explicit_null(field):
    with pytest.raises(ValidationError):
        RoomUpdate(**{field: None})
