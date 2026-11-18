"""Database engine factory.

The starter does not open a connection on startup. Call these helpers when a
feature needs PostgreSQL. `DATABASE_URL` is optional until then.
"""

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def create_db_engine() -> Engine:
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set")
    return create_engine(settings.database_url, pool_pre_ping=True)


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)
