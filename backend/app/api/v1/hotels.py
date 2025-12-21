from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from db.session import get_db
from schemas.hotel import HotelRead, HotelCreate, HotelUpdate, HotelOut
from crud.hotel import get_hotels, create_hotel, get_hotel, update_hotel, soft_delete_hotel

router = APIRouter(prefix="/hotels", tags=["hotels"])


# @router.get("/", response_model=List[Hotel])
# def list_hotels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
#     return hotel_crud.get_hotels(db, skip=skip, limit=limit)
@router.get("", response_model=List[HotelRead])
def list_hotels(
    q: Optional[str] = Query(default=None, description="code or name contains"),
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return get_hotels(db=db, q=q, limit=limit, offset=offset)



@router.get("/{hotel_id}")
def read_hotel(hotel_id: int, db: Session = Depends(get_db)):
    hotel = get_hotel(db, hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel


@router.patch("/{hotel_id}", response_model=HotelOut)
def patch_hotel(hotel_id: int, hotel_in: HotelUpdate, db: Session = Depends(get_db)):
    hotel = update_hotel(db, hotel_id, hotel_in)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel


# PUT: “置き換え更新” として扱いたい場合
# ただしフロントが「全部送る」前提じゃないと危険なので、実務ではPATCHに寄せるのがおすすめ
@router.put("/{hotel_id}", response_model=HotelOut)
def put_hotel(hotel_id: int, hotel_in: HotelUpdate, db: Session = Depends(get_db)):
    # PUTでもHotelUpdateを使って「送られたものだけ更新」に寄せちゃうのが無難
    hotel = update_hotel(db, hotel_id, hotel_in)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel


@router.post("", response_model=HotelRead, status_code=201)
def create_hotel_api(hotel_in: HotelCreate, db: Session = Depends(get_db)):
    print("POST /hotels payload:", hotel_in)
    try:
        return create_hotel(db, hotel_in)
    # except Exception as e:
    #     raise HTTPException(status_code=400, detail="ホテル作成に失敗しました（code重複など）")
    except IntegrityError as e:
            db.rollback()
            # code重複などはここ
            raise HTTPException(status_code=400, detail=f"DB制約エラー: {str(e)}")
    except Exception as e:
        db.rollback()
        # 握りつぶさない
        raise HTTPException(status_code=500, detail=f"想定外エラー: {str(e)}")


@router.delete("/{hotel_id}", status_code=204)
def delete_hotel(hotel_id: int, db: Session = Depends(get_db)):
    ok = soft_delete_hotel(db, hotel_id)  # ★ 自分じゃなくCRUD呼ぶ
    if not ok:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return
