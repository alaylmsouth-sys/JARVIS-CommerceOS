import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_render_postgres_url_uses_psycopg_driver() -> None:
    settings = Settings(
        _env_file=None,
        database_url="postgresql://jarvis:secret@db:5432/jarvis",
    )

    assert settings.database_url.startswith("postgresql+psycopg://")


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("database_url", "sqlite:///./production.db"),
        ("jwt_secret", "short-secret"),
        ("default_admin_password", "change-me-now"),
    ],
)
def test_production_rejects_unsafe_defaults(field: str, value: str) -> None:
    values = {
        "environment": "production",
        "database_url": "postgresql://jarvis:secret@db:5432/jarvis",
        "jwt_secret": "x" * 32,
        "default_admin_email": "owner@example.com",
        "default_admin_password": "a-secure-password",
        field: value,
    }

    with pytest.raises(ValidationError):
        Settings(_env_file=None, **values)


def test_production_accepts_secure_render_configuration() -> None:
    settings = Settings(
        _env_file=None,
        environment="production",
        database_url="postgresql://jarvis:secret@db:5432/jarvis",
        jwt_secret="x" * 32,
        default_admin_email="owner@example.com",
        default_admin_password="a-secure-password",
    )

    assert settings.environment == "production"


def test_production_validation_errors_hide_secret_inputs() -> None:
    secret_password = "do-not-log"

    with pytest.raises(ValidationError) as error:
        Settings(
            _env_file=None,
            environment="production",
            database_url="postgresql://jarvis:secret@db:5432/jarvis",
            jwt_secret="x" * 32,
            default_admin_email="owner@example.com",
            default_admin_password=secret_password,
        )

    assert secret_password not in str(error.value)
    assert "input_value" not in str(error.value)
