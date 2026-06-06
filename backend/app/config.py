import socket

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL ulanish parametrlari
    POSTGRES_USER: str = "trendwear"
    POSTGRES_PASSWORD: str = "trendwear_pass"
    POSTGRES_DB: str = "trendwear_db"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str | None = None

    # JWT autentifikatsiya
    SECRET_KEY: str = "CHANGE_ME_super_secret_key_for_production_use"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 kun

    # Server identifikatori (load balancing namoyishi uchun).
    # Har bir konteyner o'z hostname'ini oladi → nodelarni ajratish mumkin.
    SERVER_ID: str = socket.gethostname()

    class Config:
        env_file = ".env"

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()
