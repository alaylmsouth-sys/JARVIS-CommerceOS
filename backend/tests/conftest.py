import os
from pathlib import Path

import pytest


TEST_DATABASE = Path(__file__).resolve().parent.parent / "test_jarvis.db"
TEST_DATABASE.unlink(missing_ok=True)

os.environ["DATABASE_URL"] = "sqlite:///./test_jarvis.db"
os.environ["DEFAULT_ADMIN_EMAIL"] = "admin@test.example.com"
os.environ["DEFAULT_ADMIN_PASSWORD"] = "test-password"
os.environ["JWT_SECRET"] = "test-secret"


@pytest.fixture(autouse=True)
def reset_database():
    from app.db.base import Base
    from app.db.session import engine
    from app.main import init_db

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    init_db()
    yield


def pytest_sessionfinish(session, exitstatus) -> None:
    from app.db.session import engine

    engine.dispose()
    TEST_DATABASE.unlink(missing_ok=True)
