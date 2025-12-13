# schemas/order.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    hotel_id: int
    remark: Optional[str] = None
    items: List[OrderItemCreate]


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int

    class Config:
        orm_mode = True


class OrderRead(BaseModel):
    id: int
    hotel_id: int
    ordered_at: datetime
    status: str
    remark: Optional[str]
    items: List[OrderItemRead]

    class Config:
        orm_mode = True
