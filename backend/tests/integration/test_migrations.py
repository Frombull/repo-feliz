from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

BACKEND_DIR = Path(__file__).resolve().parents[2]


def test_migrations_upgrade_and_downgrade(tmp_path):
    url = f"sqlite+pysqlite:///{tmp_path / 'migrations.db'}"
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", url)
    engine = create_engine(url)

    command.upgrade(config, "head")
    inspector = inspect(engine)
    assert set(inspector.get_table_names()) >= {"rooms", "bookings"}
    assert "items" not in inspector.get_table_names()
    room_columns = {c["name"] for c in inspector.get_columns("rooms")}
    assert room_columns == {"id", "name", "capacity", "location", "active"}
    booking_columns = {c["name"] for c in inspector.get_columns("bookings")}
    assert booking_columns == {
        "id",
        "room_id",
        "title",
        "requester",
        "attendees",
        "start_at",
        "end_at",
        "status",
    }

    command.downgrade(config, "base")
    assert not set(inspect(engine).get_table_names()) - {"alembic_version"}
    engine.dispose()
