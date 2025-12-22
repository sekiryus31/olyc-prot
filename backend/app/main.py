from fastapi import FastAPI
from core.config import settings
from api.v1.hotels import router as hotels_router       #ホテル
from api.v1.product_category import router as category_router       #カテゴリ
from api.v1.api import api_router
# from api.v1.products import router as products_router   #商品
# from api.v1.order import router as orders_router   #注文
from db.base import Base
from db.session import engine

from models.hotel import Hotel
from models.product_category import ProductCategory
from models.product import Product

from fastapi.staticfiles import StaticFiles
from pathlib import Path
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# ★ static フォルダを /static 配下で公開
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_root():
    return {"message": "Cleaning Delivery System API"}

@app.get("/db")
def show_db():
    # settings.DATABASE_URL は "sqlite:///...." なので、実ファイルパスだけ抜く
    url = settings.DATABASE_URL

    # sqlite:///C:/... から C:/... を取り出す（Windows対応）
    db_path = url.replace("sqlite:///", "")
    p = Path(db_path)

    return {
        "DATABASE_URL": url,
        "db_path": str(p),
        "exists": p.exists(),
        "size_bytes": p.stat().st_size if p.exists() else None,
        "cwd": str(Path().resolve()),
    }


# app.include_router(hotels_router, prefix=settings.API_V1_PREFIX)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
# app.include_router(products_router, prefix=settings.API_V1_PREFIX)
# app.include_router(orders_router, prefix=settings.API_V1_PREFIX)


