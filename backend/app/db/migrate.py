from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.db.session import engine

BASELINE_REVISION = "0001_initial_schema"
BASELINE_TABLES = {
    "users",
    "sourcing_candidates",
    "audit_logs",
    "projects",
    "project_candidates",
}


def get_alembic_config() -> Config:
    backend_root = Path(__file__).resolve().parents[2]
    return Config(str(backend_root / "alembic.ini"))


def stamp_existing_schema(config: Config) -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    has_version_table = "alembic_version" in table_names
    has_baseline_schema = BASELINE_TABLES.issubset(table_names)

    if has_baseline_schema and not has_version_table:
        command.stamp(config, BASELINE_REVISION)


def main() -> None:
    config = get_alembic_config()
    stamp_existing_schema(config)
    command.upgrade(config, "head")


if __name__ == "__main__":
    main()
