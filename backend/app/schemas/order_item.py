# app/schemas/order_item.py
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class OrderItemBase(BaseModel):
    order_id: int = Field(..., example=1)
    product_id: int = Field(..., example=10)

    # スナップショット（基本はサーバ側で products から埋める想定）
    category_id: Optional[int] = Field(None, example=3)
    product_code: Optional[str] = Field(None, example="P-0001")
    product_name: Optional[str] = Field(None, example="ワイシャツ クリーニング")
    unit_price: Optional[Decimal] = Field(None, example=400.00)

    qty: int = Field(1, ge=1, example=2)

    # unit_price * qty（通常はサーバ側で計算して保存）
    line_amount: Optional[Decimal] = Field(None, example=800.00)

    notes: Optional[str] = Field(None, example="急ぎでお願いします")


class OrderItemCreate(BaseModel):
    """
    明細追加用
    - 画面では product_id と qty だけ送ればOK（推奨）
    - product_name / unit_price を送ってもいいが、通常はサーバ側で埋める
    """
    product_id: int = Field(..., example=10)
    qty: int = Field(1, ge=1, example=2)
    notes: Optional[str] = Field(None, example="急ぎでお願いします")

    # スナップショットをクライアントから渡したい場合の拡張（任意）
    category_id: Optional[int] = Field(None, example=3)
    product_code: Optional[str] = Field(None, example="P-0001")
    product_name: Optional[str] = Field(None, example="ワイシャツ クリーニング")
    unit_price: Optional[Decimal] = Field(None, example=400.00)


class OrderItemUpdate(BaseModel):
    """
    明細更新（部分更新）
    - qty / notes を変更できる想定
    """
    qty: Optional[int] = Field(None, ge=1, example=3)
    notes: Optional[str] = Field(None, example="備考を更新")


class OrderItemRead(BaseModel):
    id: int
    order_id: int
    product_id: int

    category_id: Optional[int] = None
    product_code: Optional[str] = None
    product_name: str

    unit_price: Decimal
    qty: int
    line_amount: Decimal

    notes: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderItemListItem(BaseModel):
    """
    一覧用（軽量）
    """
    id: int
    product_id: int
    product_name: str
    unit_price: Decimal
    qty: int
    line_amount: Decimal

    class Config:
        from_attributes = True
