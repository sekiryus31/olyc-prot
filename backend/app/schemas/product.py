# app/schemas/product.py
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel
from schemas.product import Product, ProductCreate, ProductUpdate


class ProductBase(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None

    category_id: Optional[int] = None
    price: Decimal
    tax_rate: Optional[Decimal] = None

    # 特定ホテル専用にしたい場合だけセット
    hotel_id: Optional[int] = None


class ProductCreate(ProductBase):
    """
    name / price は必須にしている前提。
    他は任意。
    """
    pass


class ProductUpdate(BaseModel):
    """
    部分更新用。全部 Optional にして、来たものだけ上書きする。
    """
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None

    category_id: Optional[int] = None
    price: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    hotel_id: Optional[int] = None


class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
