import pytest

from app.config import DEFAULT_CORS_ORIGINS, get_cors_origins


def test_cors_origins_default(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    assert get_cors_origins() == [DEFAULT_CORS_ORIGINS]


def test_cors_origins_empty_uses_default(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "")
    assert get_cors_origins() == [DEFAULT_CORS_ORIGINS]


def test_cors_origins_splits_and_trims(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000, http://127.0.0.1:3000 ,")
    assert get_cors_origins() == ["http://localhost:3000", "http://127.0.0.1:3000"]


def test_cors_origins_rejects_wildcard(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000,*")
    with pytest.raises(ValueError):
        get_cors_origins()
