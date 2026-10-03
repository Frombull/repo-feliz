import pytest
from pydantic import ValidationError

from app.schemas.item import ItemCreate, ItemUpdate


def test_item_create_default_available():
    item = ItemCreate(name="café", price=5.0)
    assert item.available is True


@pytest.mark.parametrize(
    "payload",
    [
        {"name": "", "price": 5.0},
        {"name": "café", "price": 0},
        {"name": "café", "price": -1},
        {"price": 5.0},
    ],
)
def test_item_create_invalid(payload):
    with pytest.raises(ValidationError):
        ItemCreate(**payload)


def test_item_update_all_optional():
    data = ItemUpdate()
    assert data.model_dump(exclude_unset=True) == {}
