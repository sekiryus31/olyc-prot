from fastapi import APIRouter

# 既存のルーターを import（パスはあなたの構成に合わせて調整）
from api.v1.hotels import router as hotel_router
from api.v1.product_category import router as category_router
from api.v1.product import router as product_router
from api.v1.order import router as order_router
from api.v1.order_item import router as order_item_router

api_router = APIRouter()

api_router.include_router(
    hotel_router,
    prefix="/hotels",
    tags=["hotels"],
)

api_router.include_router(
    category_router,
    prefix="/category",
    tags=["category"],
)

api_router.include_router(
    product_router,
    prefix="/products",
    tags=["products"],
)

api_router.include_router(
    order_router,
    prefix="/orders",
    tags=["orders"],
)

api_router.include_router(
    order_item_router,
    prefix="/orders/{order_id}/items",
    tags=["order_items"],
)
