from app.db.base import Base
from app.db.session import engine

# Import models so SQLAlchemy registers all tables before create_all runs.
from app.db import models as _models  # noqa: F401


def main() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    main()
