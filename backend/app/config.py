import os

raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./quiz_platform.db")
# Render provides postgres:// which SQLAlchemy 1.4+ expects as postgresql://
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

class Settings:
    PROJECT_NAME: str = "BIBLE QUIZ Premium Competitive Quiz Platform"
    DATABASE_URL: str = raw_db_url
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-key-for-premium-quiz-platform-2026-xyz-change-me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    CORS_ORIGINS: list[str] = [
        "*",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    HOST: str = os.getenv("BACKEND_HOST", "127.0.0.1")

settings = Settings()
