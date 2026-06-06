import socket

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Ma'lumotlar bazasi ulanishi (Docker Compose yoki Render'dan keladi).
    # Render PostgreSQL "postgres://" beradi — SQLAlchemy "postgresql://" talab qiladi.
    DATABASE_URL: str = "postgresql://trendwear:trendwear_pass@db:5432/trendwear_db"

    @property
    def db_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    # JWT autentifikatsiya
    SECRET_KEY: str = "CHANGE_ME_super_secret_key_for_production_use"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 kun

    # Server identifikatori (load balancing namoyishi uchun).
    # Har bir konteyner o'z hostname'ini oladi → nodelarni ajratish mumkin.
    SERVER_ID: str = socket.gethostname()

    class Config:
        env_file = ".env"
        extra = "ignore"  # Render qo'shimcha env o'zgaruvchilarini bersa, xatolik bermaymiz


settings = Settings()
