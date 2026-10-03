import pytest

from app.schemas.item import ItemCreate, ItemUpdate
from app.services.item_service import ItemService


@pytest.fixture
def service():
    service = ItemService()
    service.create(ItemCreate(name="café", price=5.0))
    service.create(ItemCreate(name="chá", price=4.0, available=False))
    return service


def test_create_assigns_incremental_id(service):
    item = service.create(ItemCreate(name="suco", price=7.5))
    assert item.id == 3


def test_list_all(service):
    assert [item.name for item in service.list()] == ["café", "chá"]


@pytest.mark.parametrize("available, expected", [(True, ["café"]), (False, ["chá"])])
def test_list_filter_available(service, available, expected):
    assert [item.name for item in service.list(available)] == expected


def test_get_missing_returns_none(service):
    assert service.get(999) is None


def test_replace(service):
    item = service.replace(1, ItemCreate(name="café gelado", price=8.0))
    assert item.name == "café gelado"
    assert item.price == 8.0
    assert service.get(1) == item


def test_replace_missing(service):
    assert service.replace(999, ItemCreate(name="x", price=1.0)) is None


def test_update_only_sent_fields(service):
    item = service.update(1, ItemUpdate(price=6.0))
    assert item.name == "café"
    assert item.price == 6.0


def test_update_ignores_null_fields(service):
    item = service.update(1, ItemUpdate(name=None, available=False))
    assert item.name == "café"
    assert item.available is False


def test_update_missing(service):
    assert service.update(999, ItemUpdate(price=1.0)) is None


def test_delete(service):
    assert service.delete(1) is True
    assert service.get(1) is None


def test_delete_missing(service):
    assert service.delete(999) is False
