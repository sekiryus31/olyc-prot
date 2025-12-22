from fastapi import APIRouter

# 既存のルーターを import（パスはあなたの構成に合わせて調整）
from api.v1.hotels import router as hotel_router
from api.v1.product_category import router as category_router
# 例：今後追加
# from api.v1.products import router as product_router
# from api.v1.orders import router as order_router

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

# api_router.include_router(product_router, prefix="/products", tags=["products"])
# api_router.include_router(order_router, prefix="/orders", tags=["orders"])
