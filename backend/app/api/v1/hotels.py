from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import get_db
from schemas.hotel import Hotel, HotelCreate, HotelUpdate
import crud.hotel as hotel_crud

router = APIRouter(prefix="/hotels", tags=["hotels"])


@router.get("/", response_model=List[Hotel])
def list_hotels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return hotel_crud.get_hotels(db, skip=skip, limit=limit)


@router.post("/", response_model=Hotel, status_code=status.HTTP_201_CREATED)
def create_hotel(hotel_in: HotelCreate, db: Session = Depends(get_db)):
    return hotel_crud.create_hotel(db, hotel_in)


@router.get("/{hotel_id}", response_model=Hotel)
def get_hotel_detail(hotel_id: int, db: Session = Depends(get_db)):
    hotel = hotel_crud.get_hotel(db, hotel_id=hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel


@router.put("/{hotel_id}", response_model=Hotel)
def update_hotel(
    hotel_id: int,
    hotel_in: HotelUpdate,
    db: Session = Depends(get_db),
):
    hotel = hotel_crud.get_hotel(db, hotel_id=hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel_crud.update_hotel(db, hotel, hotel_in)


@router.delete("/{hotel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hotel(hotel_id: int, db: Session = Depends(get_db)):
    hotel = hotel_crud.get_hotel(db, hotel_id=hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    hotel_crud.delete_hotel(db, hotel)
    return None
