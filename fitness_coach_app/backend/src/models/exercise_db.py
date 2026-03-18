from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class ExerciseDB(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    muscle_group: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    equipment: Mapped[str] = mapped_column(String(120), nullable=False, default="", server_default="")
    instructions: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default="")

