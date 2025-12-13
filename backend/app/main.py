# from fastapi import FastAPI

# from core.config import settings
# from api.v1.hotels import router as hotels_router
# from db.base import Base
# from db.session import engine

# # モデルからテーブルを作成（開発中はこれでもOK / 本番はAlembic推奨）
# Base.metadata.create_all(bind=engine)

# app = FastAPI(title=settings.PROJECT_NAME)


# @app.get("/")
# def read_root():
#     return {"message": "Cleaning Delivery System API"}


# ルーター登録
# app.include_router(hotels_router, prefix=settings.API_V1_PREFIX)


from fastapi import FastAPI
from core.config import settings
from api.v1.hotels import router as hotels_router       #ホテル
from api.v1.products import router as products_router   #商品
from api.v1.order import router as orders_router   #注文
from db.base import Base
from db.session import engine

from fastapi.staticfiles import StaticFiles

import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# ★ static フォルダを /static 配下で公開
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_root():
    return {"message": "Cleaning Delivery System API"}


app.include_router(hotels_router, prefix=settings.API_V1_PREFIX)
app.include_router(products_router, prefix=settings.API_V1_PREFIX)
app.include_router(orders_router, prefix=settings.API_V1_PREFIX)