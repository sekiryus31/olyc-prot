import os
from pathlib import Path
from pydantic import BaseModel

# このファイル(app/core/config.py)から見たプロジェクト基準パス
BASE_DIR = Path(__file__).resolve().parents[2]
# ↑ app/core/config.py → app/core → app → backend

DB_PATH = BASE_DIR / "app" / "cleaning.db"

class Settings(BaseModel):
    PROJECT_NAME: str = "Cleaning Delivery System"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{DB_PATH.as_posix()}",
    )

settings = Settings()
