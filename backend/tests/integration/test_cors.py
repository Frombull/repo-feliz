import pytest

ALLOWED = "http://localhost:5173"
OTHER = "http://evil.example.com"


def preflight(client, origin, method):
    return client.options(
        "/items",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": method,
            "Access-Control-Request-Headers": "content-type",
        },
    )


@pytest.mark.parametrize("method", ["GET", "POST", "PUT", "PATCH", "DELETE"])
def test_preflight_allows_frontend_origin(client, method):
    response = preflight(client, ALLOWED, method)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED
    assert method in response.headers["access-control-allow-methods"]


def test_preflight_rejects_other_origin(client):
    response = preflight(client, OTHER, "POST")
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_response_has_cors_header_for_frontend_origin(client):
    response = client.get("/items", headers={"Origin": ALLOWED})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED


def test_response_has_no_cors_header_for_other_origin(client):
    response = client.get("/items", headers={"Origin": OTHER})
    assert "access-control-allow-origin" not in response.headers
