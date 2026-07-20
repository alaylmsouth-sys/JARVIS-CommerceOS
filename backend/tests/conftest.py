import os
from pathlib import Path

TEST_DB = Path("/app/test_jarvis.db")

if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["DEFAULT_ADMIN_EMAIL"] = "admin@test.example.com"
os.environ["DEFAULT_ADMIN_PASSWORD"] = "test-password"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["REDIS_URL"] = "redis://redis:6379/0"
