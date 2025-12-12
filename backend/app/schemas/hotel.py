from pydantic import BaseModel


class HotelBase(BaseModel):
    name: str
    code: str | None = None
    address: str | None = None


class HotelCreate(HotelBase):
    pass


class HotelUpdate(HotelBase):
    pass


class HotelInDBBase(HotelBase):
    id: int

    class Config:
        from_attributes = True  # SQLAlchemyモデルからの読み取り用（Pydantic v2系）


class Hotel(HotelInDBBase):
    pass
