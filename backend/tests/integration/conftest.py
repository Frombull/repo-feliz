import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.item import ItemCreate
from app.services.item_service import ItemService, get_item_service


@pytest.fixture
def client():
    service = ItemService()
    service.create(ItemCreate(name="café", price=5.0))
    service.create(ItemCreate(name="chá", price=4.0, available=False))

    app.dependency_overrides[get_item_service] = lambda: service
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
