import pytest

CAFE = {"id": 1, "name": "café", "price": 5.0, "available": True}
CHA = {"id": 2, "name": "chá", "price": 4.0, "available": False}


def test_list_items(client):
    response = client.get("/items")
    assert response.status_code == 200
    assert response.json() == [CAFE, CHA]


@pytest.mark.parametrize("available, expected", [("true", [CAFE]), ("false", [CHA])])
def test_list_items_filter_available(client, available, expected):
    response = client.get("/items", params={"available": available})
    assert response.status_code == 200
    assert response.json() == expected


def test_get_item(client):
    response = client.get("/items/1")
    assert response.status_code == 200
    assert response.json() == CAFE


def test_get_item_not_found(client):
    response = client.get("/items/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Item não encontrado"}


@pytest.mark.parametrize("item_id", ["abc", "0", "-1"])
def test_get_item_invalid_id(client, item_id):
    response = client.get(f"/items/{item_id}")
    assert response.status_code == 422


def test_create_item(client):
    response = client.post("/items", json={"name": "suco", "price": 7.5})
    assert response.status_code == 201
    assert response.json() == {"id": 3, "name": "suco", "price": 7.5, "available": True}
    assert client.get("/items/3").status_code == 200


def test_create_item_invalid(client):
    response = client.post("/items", json={"name": "", "price": -1})
    assert response.status_code == 422


def test_replace_item(client):
    payload = {"name": "café gelado", "price": 8.0, "available": False}
    response = client.put("/items/1", json=payload)
    assert response.status_code == 200
    assert response.json() == {"id": 1, **payload}


def test_replace_item_missing_field(client):
    response = client.put("/items/1", json={"name": "café gelado"})
    assert response.status_code == 422


def test_replace_item_not_found(client):
    response = client.put("/items/999", json={"name": "x", "price": 1.0})
    assert response.status_code == 404


def test_update_item(client):
    response = client.patch("/items/1", json={"price": 6.0})
    assert response.status_code == 200
    assert response.json() == {**CAFE, "price": 6.0}


def test_update_item_invalid(client):
    response = client.patch("/items/1", json={"price": 0})
    assert response.status_code == 422


def test_update_item_not_found(client):
    response = client.patch("/items/999", json={"price": 6.0})
    assert response.status_code == 404


def test_delete_item(client):
    response = client.delete("/items/1")
    assert response.status_code == 204
    assert client.get("/items/1").status_code == 404


def test_delete_item_not_found(client):
    response = client.delete("/items/999")
    assert response.status_code == 404
