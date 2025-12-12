import os
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "Cleaning Delivery System"
    API_V1_PREFIX: str = "/api/v1"

    # 将来PostgreSQLにするとき用（今はコメントアウトでOK）
    # DATABASE_URL: str = os.getenv(
    #     "DATABASE_URL",
    #     "postgresql+psycopg2://user:password@localhost:5432/cleaning_db",
    # )

    # まずは SQLite で進める
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./cleaning.db",
    )


settings = Settings()
