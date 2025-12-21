# app/schemas/hotel.py
from pydantic import BaseModel, ConfigDict
from typing import Optional


class HotelBase(BaseModel):
    code: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    operator_id: Optional[int] = None


class HotelCreate(HotelBase):
    pass


class HotelUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    operator_id: Optional[int] = None


class HotelRead(HotelBase):
    id: int

    # Pydantic v2 用（v1なら Config = orm_mode = True）
    model_config = ConfigDict(from_attributes=True)


class HotelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: Optional[str] = None
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None