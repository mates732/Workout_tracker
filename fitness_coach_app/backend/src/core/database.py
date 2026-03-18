from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from core.settings import settings


class Base(DeclarativeBase):
    """Base class for SQLAlchemy ORM models."""


def _ensure_sqlite_directory(database_url: str) -> None:
    sqlite_prefix = "sqlite:///"
    if not database_url.startswith(sqlite_prefix):
        return
    database_path = database_url[len(sqlite_prefix) :]
    directory = os.path.dirname(database_path)
    if directory:
        os.makedirs(directory, exist_ok=True)


def create_database_engine(database_url: str) -> Engine:
    _ensure_sqlite_directory(database_url)
    connect_args: dict[str, bool] = {}
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return create_engine(database_url, future=True, pool_pre_ping=True, connect_args=connect_args)


def create_session_factory(bind_engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=bind_engine, autoflush=False, expire_on_commit=False, class_=Session)


engine = create_database_engine(settings.database_url)
SessionLocal = create_session_factory(engine)

