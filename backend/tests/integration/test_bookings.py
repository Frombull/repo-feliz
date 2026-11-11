from datetime import datetime

import pytest


def create_room(client, name="Sala A", capacity=10):
    response = client.post("/rooms", json={"name": name, "capacity": capacity})
    assert response.status_code == 201
    return response.json()


def payload(room_id, start="2030-05-10T09:00", end="2030-05-10T10:00", **extra):
    return {
        "room_id": room_id,
        "title": "Reunião",
        "requester": "Ana",
        "attendees": 3,
        "start_at": start,
        "end_at": end,
        **extra,
    }


def create_booking(client, room_id, **kwargs):
    response = client.post("/bookings", json=payload(room_id, **kwargs))
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
def room(client):
    return create_room(client)


def test_create_booking(client, room):
    response = client.post("/bookings", json=payload(room["id"]))
    assert response.status_code == 201
    assert response.json() == {
        "id": 1,
        "room_id": room["id"],
        "title": "Reunião",
        "requester": "Ana",
        "attendees": 3,
        "start_at": "2030-05-10T09:00:00",
        "end_at": "2030-05-10T10:00:00",
        "status": "confirmed",
    }


@pytest.mark.parametrize(
    "change",
    [
        {"title": ""},
        {"attendees": 0},
        {"start_at": "nao-e-data"},
        {"end_at": "2030-05-10T08:00"},
        {"start_at": "2030-05-10T09:00Z"},
    ],
)
def test_create_booking_invalid_payload(client, room, change):
    response = client.post("/bookings", json=payload(room["id"], **change))
    assert response.status_code == 422


def test_create_booking_for_unknown_room(client):
    response = client.post("/bookings", json=payload(99))
    assert response.status_code == 404
    assert response.json() == {"detail": "Sala não encontrada"}


def test_create_booking_conflict(client, room):
    create_booking(client, room["id"])
    response = client.post(
        "/bookings",
        json=payload(room["id"], start="2030-05-10T09:30", end="2030-05-10T10:30"),
    )
    assert response.status_code == 409
    assert "09:00 às 10:00" in response.json()["detail"]


def test_create_booking_back_to_back_is_allowed(client, room):
    create_booking(client, room["id"])
    create_booking(client, room["id"], start="2030-05-10T10:00", end="2030-05-10T11:00")


@pytest.mark.parametrize(
    "change, message",
    [
        ({"attendees": 11}, "comporta 10 pessoas"),
        (
            {"start_at": "2030-05-11T06:00", "end_at": "2030-05-11T08:00"},
            "07:00 e 22:00",
        ),
        ({"start_at": "2030-05-10T09:00", "end_at": "2030-05-10T09:05"}, "15 minutos"),
        ({"start_at": "2030-05-10T09:00", "end_at": "2030-05-10T18:00"}, "8 horas"),
        ({"start_at": "2030-05-10T07:00", "end_at": "2030-05-10T07:30"}, "já passou"),
    ],
)
def test_create_booking_business_rules(client, room, change, message):
    response = client.post("/bookings", json=payload(room["id"], **change))
    assert response.status_code == 422
    assert message in response.json()["detail"]


def test_create_booking_in_inactive_room(client, room):
    client.patch(f"/rooms/{room['id']}", json={"active": False})
    response = client.post("/bookings", json=payload(room["id"]))
    assert response.status_code == 409
    assert "desativada" in response.json()["detail"]


def test_list_and_filter_bookings(client, room):
    other = create_room(client, "Sala B")
    a = create_booking(client, room["id"])
    b = create_booking(client, other["id"])
    c = create_booking(
        client, room["id"], start="2030-05-11T09:00", end="2030-05-11T10:00"
    )
    client.post(f"/bookings/{b['id']}/cancel")

    def ids(**params):
        return [x["id"] for x in client.get("/bookings", params=params).json()]

    assert ids() == [a["id"], b["id"], c["id"]]
    assert ids(room_id=room["id"]) == [a["id"], c["id"]]
    assert ids(status="cancelled") == [b["id"]]
    assert ids(date="2030-05-11") == [c["id"]]
    assert ids(room_id=room["id"], status="confirmed", date="2030-05-10") == [a["id"]]


@pytest.mark.parametrize(
    "params", [{"status": "x"}, {"date": "ontem"}, {"room_id": "abc"}, {"room_id": 0}]
)
def test_list_bookings_invalid_filters(client, params):
    assert client.get("/bookings", params=params).status_code == 422


def test_get_booking(client, room):
    booking = create_booking(client, room["id"])
    response = client.get(f"/bookings/{booking['id']}")
    assert response.status_code == 200
    assert response.json() == booking


def test_get_booking_not_found(client):
    response = client.get("/bookings/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Reserva não encontrada"}


def test_update_booking(client, room):
    booking = create_booking(client, room["id"])
    response = client.patch(
        f"/bookings/{booking['id']}",
        json={"title": "Nova", "end_at": "2030-05-10T11:00"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Nova"
    assert response.json()["end_at"] == "2030-05-10T11:00:00"


def test_update_booking_conflict_and_not_found(client, room):
    create_booking(client, room["id"])
    second = create_booking(
        client, room["id"], start="2030-05-10T11:00", end="2030-05-10T12:00"
    )
    response = client.patch(
        f"/bookings/{second['id']}", json={"start_at": "2030-05-10T09:30"}
    )
    assert response.status_code == 409
    assert client.patch("/bookings/999", json={"title": "x"}).status_code == 404


def test_update_booking_invalid_payload(client, room):
    booking = create_booking(client, room["id"])
    url = f"/bookings/{booking['id']}"
    assert client.patch(url, json={"attendees": 0}).status_code == 422
    assert client.patch(url, json={"title": None}).status_code == 422


def test_cancel_booking_frees_the_slot(client, room):
    booking = create_booking(client, room["id"])
    response = client.post(f"/bookings/{booking['id']}/cancel")
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    create_booking(client, room["id"])  # mesmo horário, agora livre


def test_cancel_twice_and_unknown(client, room):
    booking = create_booking(client, room["id"])
    client.post(f"/bookings/{booking['id']}/cancel")
    assert client.post(f"/bookings/{booking['id']}/cancel").status_code == 409
    assert client.post("/bookings/999/cancel").status_code == 404


def test_cannot_change_a_booking_that_already_started(client, room, clock):
    booking = create_booking(client, room["id"])
    clock.value = datetime(2030, 5, 10, 9, 30)
    assert client.post(f"/bookings/{booking['id']}/cancel").status_code == 409
    response = client.patch(f"/bookings/{booking['id']}", json={"title": "x"})
    assert response.status_code == 409


def test_delete_requires_cancelling_first(client, room):
    booking = create_booking(client, room["id"])
    assert client.delete(f"/bookings/{booking['id']}").status_code == 409
    client.post(f"/bookings/{booking['id']}/cancel")
    assert client.delete(f"/bookings/{booking['id']}").status_code == 204
    assert client.get(f"/bookings/{booking['id']}").status_code == 404


def test_delete_finished_booking_and_unknown(client, room, clock):
    booking = create_booking(client, room["id"])
    clock.value = datetime(2030, 5, 10, 10, 0)
    assert client.delete(f"/bookings/{booking['id']}").status_code == 204
    assert client.delete("/bookings/999").status_code == 404


def test_room_with_bookings_cannot_be_deleted_or_deactivated(client, room):
    booking = create_booking(client, room["id"])
    url = f"/rooms/{room['id']}"
    assert client.delete(url).status_code == 409
    assert client.patch(url, json={"active": False}).status_code == 409

    client.post(f"/bookings/{booking['id']}/cancel")
    assert client.patch(url, json={"active": False}).status_code == 200
    assert client.delete(url).status_code == 409  # o histórico continua na sala
    client.delete(f"/bookings/{booking['id']}")
    assert client.delete(url).status_code == 204


def test_available_rooms(client):
    small = create_room(client, "Pequena", 2)
    free = create_room(client, "Livre", 10)
    busy = create_room(client, "Ocupada", 10)
    inactive = create_room(client, "Inativa", 10)
    client.patch(f"/rooms/{inactive['id']}", json={"active": False})
    create_booking(client, busy["id"])

    params = {"start_at": "2030-05-10T09:30", "end_at": "2030-05-10T10:30"}
    response = client.get("/rooms/available", params=params)
    assert response.status_code == 200
    assert [r["id"] for r in response.json()] == [small["id"], free["id"]]

    response = client.get("/rooms/available", params={**params, "min_capacity": 5})
    assert [r["id"] for r in response.json()] == [free["id"]]

    response = client.get(
        "/rooms/available",
        params={"start_at": "2030-05-10T10:00", "end_at": "2030-05-10T11:00"},
    )
    assert busy["id"] in [r["id"] for r in response.json()]  # encostada, não conflita


@pytest.mark.parametrize(
    "params, status",
    [
        ({"start_at": "2030-05-10T10:00"}, 422),
        ({"start_at": "2030-05-10T10:00", "end_at": "2030-05-10T10:00"}, 422),
        ({"start_at": "2030-05-10T10:00", "end_at": "2030-05-10T09:00"}, 422),
        ({"start_at": "2030-05-10T09:00Z", "end_at": "2030-05-10T10:00Z"}, 422),
        (
            {
                "start_at": "2030-05-10T09:00",
                "end_at": "2030-05-10T10:00",
                "min_capacity": 0,
            },
            422,
        ),
    ],
)
def test_available_rooms_invalid_params(client, params, status):
    assert client.get("/rooms/available", params=params).status_code == status
