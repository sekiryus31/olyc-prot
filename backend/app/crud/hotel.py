from typing import List, Optional

from sqlalchemy.orm import Session

from models.hotel import Hotel
from schemas.hotel import HotelCreate, HotelUpdate


def get_hotel(db: Session, hotel_id: int) -> Optional[Hotel]:
    return db.query(Hotel).filter(Hotel.id == hotel_id).first()


def get_hotels(db: Session, skip: int = 0, limit: int = 100) -> List[Hotel]:
    return db.query(Hotel).offset(skip).limit(limit).all()


def create_hotel(db: Session, hotel_in: HotelCreate) -> Hotel:
    hotel = Hotel(
        name=hotel_in.name,
        code=hotel_in.code,
        address=hotel_in.address,
    )
    db.add(hotel)
    db.commit()
    db.refresh(hotel)
    return hotel


def update_hotel(db: Session, hotel: Hotel, hotel_in: HotelUpdate) -> Hotel:
    hotel.name = hotel_in.name
    hotel.code = hotel_in.code
    hotel.address = hotel_in.address
    db.commit()
    db.refresh(hotel)
    return hotel


def delete_hotel(db: Session, hotel: Hotel) -> None:
    db.delete(hotel)
    db.commit()
