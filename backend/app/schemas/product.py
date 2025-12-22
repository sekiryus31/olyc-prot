from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


# =========================
# 共通ベース
# =========================
class ProductBase(BaseModel):
    code: Optional[str] = None
    name: str
    category_id: Optional[int] = None
    price: Decimal
    hotel_id: Optional[int] = None
    description: Optional[str] = None


# =========================
# 新規作成用
# =========================
class ProductCreate(ProductBase):
    pass


# =========================
# 更新用
# =========================
class ProductUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[Decimal] = None
    hotel_id: Optional[int] = None
    description: Optional[str] = None


# =========================
# レスポンス用
# =========================
class Product(ProductBase):
    id: int
    delete_flag: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # ← Pydantic v2 対応
