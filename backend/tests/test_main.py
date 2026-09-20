import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_root_status_code(client):
    response = client.get("/")
    assert response.status_code == 200


def test_root_body(client):
    response = client.get("/")
    assert response.json() == {"status": "ok"}


def test_health_status_code(client):
    response = client.get("/health")
    assert response.status_code == 200


def test_health_body(client):
    response = client.get("/health")
    assert response.json() == {"status": "healthy"}


@pytest.mark.parametrize(
    "item_id, expected_name",
    [
        (1, "café"),
        (2, "chá"),
        (3, "suco"),
    ],
)
def test_get_item_success(client, item_id, expected_name):
    response = client.get(f"/items/{item_id}")
    assert response.status_code == 200
    assert response.json() == {"id": item_id, "name": expected_name}


def test_get_item_not_found(client):
    response = client.get("/items/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Item não encontrado"}


def test_get_item_invalid_id_type(client):
    response = client.get("/items/abc")
    assert response.status_code == 422
