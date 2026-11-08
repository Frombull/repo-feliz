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
    columns = {c["name"] for c in inspect(engine).get_columns("items")}
    assert columns == {"id", "name", "price", "available"}

    command.downgrade(config, "base")
    assert "items" not in inspect(engine).get_table_names()
    engine.dispose()
