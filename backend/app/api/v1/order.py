# app/api/v1/orders.py
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from db.session import get_db
from schemas.order import OrderCreate, OrderUpdate, OrderRead, OrderListItem
from crud import order as order_crud

router = APIRouter()

@router.post(
    "",
    response_model=OrderRead,
    status_code=status.HTTP_201_CREATED,
)
def create_order_api(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
):
    """
    注文作成（ヘッダのみ）
    """
    order = order_crud.create_order(db, order_in)
    return order


@router.get(
    "",
    response_model=List[OrderListItem],
)
def list_orders_api(
    hotel_id: Optional[int] = Query(None),
    room_no: Optional[str] = Query(None),
    status_: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    注文一覧
    - hotel_id / room_no / status で絞り込み可能
    """
    orders = order_crud.list_orders(
        db,
        hotel_id=hotel_id,
        room_no=room_no,
        status=status_,
        limit=limit,
        offset=offset,
    )
    return orders


@router.get(
    "/{order_id}",
    response_model=OrderRead,
)
def get_order_api(
    order_id: int,
    db: Session = Depends(get_db),
):
    """
    注文詳細
    """
    order = order_crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch(
    "/{order_id}",
    response_model=OrderRead,
)
def update_order_api(
    order_id: int,
    order_in: OrderUpdate,
    db: Session = Depends(get_db),
):
    """
    注文更新（部分更新）
    """
    order = order_crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order = order_crud.update_order(db, order, order_in)
    return order


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_order_api(
    order_id: int,
    db: Session = Depends(get_db),
):
    """
    注文削除（試作：物理削除）
    """
    order = order_crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order_crud.delete_order(db, order)
    return None


@router.get(
    "/by-no/{order_no}",
    response_model=OrderRead,
)
def get_order_by_no_api(
    order_no: str,
    db: Session = Depends(get_db),
):
    """
    order_no で取得（必要なら）
    """
    order = order_crud.get_order_by_order_no(db, order_no)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
