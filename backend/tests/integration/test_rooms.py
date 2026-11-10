import pytest


def create_room(client, name="Sala A", capacity=10, **extra):
    response = client.post("/rooms", json={"name": name, "capacity": capacity, **extra})
    assert response.status_code == 201
    return response.json()


def test_create_room(client):
    response = client.post(
        "/rooms", json={"name": "Sala A", "capacity": 10, "location": "Bloco 1"}
    )
    assert response.status_code == 201
    assert response.json() == {
        "id": 1,
        "name": "Sala A",
        "capacity": 10,
        "location": "Bloco 1",
        "active": True,
    }


def test_list_rooms_ordered_and_filtered(client):
    create_room(client, "Sala B")
    a = create_room(client, "Sala A")
    client.patch(f"/rooms/{a['id']}", json={"active": False})

    assert [r["name"] for r in client.get("/rooms").json()] == ["Sala A", "Sala B"]
    response = client.get("/rooms", params={"active": "true"})
    assert [r["name"] for r in response.json()] == ["Sala B"]


def test_get_room(client):
    room = create_room(client)
    response = client.get(f"/rooms/{room['id']}")
    assert response.status_code == 200
    assert response.json() == room


def test_get_room_not_found(client):
    response = client.get("/rooms/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Sala não encontrada"}


@pytest.mark.parametrize("room_id", ["abc", "0", "-1"])
def test_get_room_invalid_id(client, room_id):
    assert client.get(f"/rooms/{room_id}").status_code == 422


@pytest.mark.parametrize(
    "payload",
    [
        {"name": "", "capacity": 10},
        {"name": "Sala A", "capacity": 0},
        {"name": "Sala A", "capacity": 501},
        {"name": "Sala A"},
        {"capacity": 10},
        {},
    ],
)
def test_create_room_invalid(client, payload):
    assert client.post("/rooms", json=payload).status_code == 422


def test_create_room_duplicate_name(client):
    create_room(client, "Sala A")
    response = client.post("/rooms", json={"name": "SALA a", "capacity": 4})
    assert response.status_code == 409
    assert response.json() == {"detail": "Já existe uma sala com esse nome"}


def test_update_room(client):
    room = create_room(client)
    response = client.patch(
        f"/rooms/{room['id']}", json={"capacity": 20, "location": "Bloco 2"}
    )
    assert response.status_code == 200
    assert response.json() == {**room, "capacity": 20, "location": "Bloco 2"}


def test_update_room_not_found(client):
    assert client.patch("/rooms/999", json={"capacity": 3}).status_code == 404


def test_update_room_invalid(client):
    room = create_room(client)
    response = client.patch(f"/rooms/{room['id']}", json={"capacity": 0})
    assert response.status_code == 422
    response = client.patch(f"/rooms/{room['id']}", json={"name": None})
    assert response.status_code == 422


def test_update_room_duplicate_name(client):
    create_room(client, "Sala A")
    b = create_room(client, "Sala B")
    response = client.patch(f"/rooms/{b['id']}", json={"name": "Sala A"})
    assert response.status_code == 409


def test_delete_room(client):
    room = create_room(client)
    assert client.delete(f"/rooms/{room['id']}").status_code == 204
    assert client.get(f"/rooms/{room['id']}").status_code == 404


def test_delete_room_not_found(client):
    assert client.delete("/rooms/999").status_code == 404
