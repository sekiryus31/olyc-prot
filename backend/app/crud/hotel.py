from sqlalchemy.orm import Session
from typing import List, Optional
from models.hotel import Hotel
from schemas.hotel import HotelCreate
from schemas.hotel import HotelUpdate

def get_hotels(db: Session, q: Optional[str] = None, limit: int = 200, offset: int = 0) -> List[Hotel]:
    query = db.query(Hotel).order_by(Hotel.id.desc())

    if q:
        like = f"%{q}%"
        query = query.filter((Hotel.name.like(like)) | (Hotel.code.like(like)))

    # return query.offset(offset).limit(limit).all()
    return (
        db.query(Hotel)
        .filter(Hotel.delete_flg == 0)
        .order_by(Hotel.id.desc())
        .all()
    )


# ホテルを1つ詳細取得
def get_hotel(db: Session, hotel_id: int) -> Hotel | None:
    # return db.query(Hotel).filter(Hotel.id == hotel_id).first()
    return (
        db.query(Hotel)
        .filter(
            Hotel.id == hotel_id,
            Hotel.delete_flg == 0
        )
        .first()
    )


def update_hotel(db: Session, hotel_id: int, hotel_in: HotelUpdate) -> Optional[Hotel]:
    hotel = get_hotel(db, hotel_id)
    if not hotel:
        return None

    # PATCH的に「渡ってきた項目だけ」更新したいなら exclude_unset=True を使う
    update_data = hotel_in.model_dump(exclude_unset=True)

    # 空文字を許容しないならここで整形（必要なら）
    # 例: code="" が来たら None にするなど
    if "code" in update_data and update_data["code"] == "":
        update_data["code"] = None
    if "address" in update_data and update_data["address"] == "":
        update_data["address"] = None
    if "phone" in update_data and update_data["phone"] == "":
        update_data["phone"] = None

    for k, v in update_data.items():
        setattr(hotel, k, v)

    db.add(hotel)
    db.commit()
    db.refresh(hotel)
    return hotel


def create_hotel(db: Session, hotel_in: HotelCreate) -> Hotel:
    hotel = Hotel(
        code=hotel_in.code,
        name=hotel_in.name,
        address=hotel_in.address,
        phone=hotel_in.phone,
        operator_id=hotel_in.operator_id,
    )
    db.add(hotel)
    db.commit()
    db.refresh(hotel)
    return hotel



def soft_delete_hotel(db: Session, hotel_id: int) -> bool:
    hotel = (
        db.query(Hotel)
        .filter(Hotel.id == hotel_id, Hotel.delete_flg == 0)
        .first()
    )
    if not hotel:
        return False

    hotel.delete_flg = 1
    db.commit()
    return True

