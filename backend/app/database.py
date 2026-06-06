from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import settings

# PostgreSQL bilan ulanish (pool_pre_ping qayta ulanishlarda foydali)
engine = create_engine(settings.db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Har bir so'rov uchun DB sessiyasini ochib, so'ngida yopadi."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
