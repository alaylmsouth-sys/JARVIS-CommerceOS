from sqlalchemy import inspect, text

from app.db.base import Base
from app.db.migrate import BASELINE_TABLES, main
from app.db.session import engine


def drop_alembic_version() -> None:
    with engine.begin() as connection:
        connection.execute(text("DROP TABLE IF EXISTS alembic_version"))


def test_migrations_create_baseline_schema() -> None:
    Base.metadata.drop_all(bind=engine)
    drop_alembic_version()

    try:
        main()
        table_names = set(inspect(engine).get_table_names())

        assert BASELINE_TABLES.issubset(table_names)
        assert "alembic_version" in table_names

        inspector = inspect(engine)
        candidate_constraints = {
            constraint["name"]
            for constraint in inspector.get_unique_constraints("sourcing_candidates")
        }
        project_candidate_constraints = {
            constraint["name"]
            for constraint in inspector.get_unique_constraints("project_candidates")
        }
        assert "uq_sourcing_candidate_identity" in candidate_constraints
        assert "uq_project_candidate" in project_candidate_constraints

        main()
    finally:
        Base.metadata.drop_all(bind=engine)
        drop_alembic_version()
