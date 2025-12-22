from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal



class OrderBase(BaseModel):
    hotel_id: int = Field(..., example=1)
    room_no: str = Field(..., example="1203")

    status: str = Field(default="placed", example="placed")

    requested_at: Optional[datetime] = Field(
        None, example="2025-12-25T10:00:00"
    )

    total_amount: Decimal = Field(
        ..., example=8800.00
    )

    payment: int = Field(
        ..., example=1, description="1: Olyc / 2: ホテル / 3: その他"
    )

    notes: Optional[str] = Field(
        None, example="午前中希望"
    )


class OrderCreate(OrderBase):
    hotel_id: int
    room_no: str = Field(..., max_length=20)
    # 画面入力しないので Optional にする（サーバ側で埋める）
    payment: Optional[int] = None
    total_amount: Optional[Decimal] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    requested_at: Optional[datetime] = None
    payment: Optional[int] = None
    notes: Optional[str] = None



class OrderRead(OrderBase):
    id: int
    order_no: str

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderListItem(BaseModel):
    id: int
    order_no: str
    room_no: str
    status: str
    total_amount: Decimal
    created_at: datetime

    class Config:
        from_attributes = True
