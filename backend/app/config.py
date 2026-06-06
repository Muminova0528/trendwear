import socket

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Ma'lumotlar bazasi ulanishi (Docker Compose'dan keladi)
    DATABASE_URL: str = "postgresql://trendwear:trendwear_pass@db:5432/trendwear_db"

    # JWT autentifikatsiya
    SECRET_KEY: str = "CHANGE_ME_super_secret_key_for_production_use"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 kun

    # Server identifikatori (load balancing namoyishi uchun).
    # Har bir konteyner o'z hostname'ini oladi → nodelarni ajratish mumkin.
    SERVER_ID: str = socket.gethostname()

    class Config:
        env_file = ".env"


settings = Settings()
