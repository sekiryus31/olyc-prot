from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from db.session import get_db
from schemas.order import Product, ProductCreate, ProductUpdate
import crud.order as order_crud


router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.post("", response_model=OrderRead)
def create_order_endpoint(order_in: OrderCreate, db: Session = Depends(get_db)):
    if not order_in.items:
        raise HTTPException(status_code=400, detail="明細が1件もありません。")

    try:
        order = create_order(db, order_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return order


@router.get("/{order_id}", response_model=OrderRead)
def get_order_endpoint(order_id: int, db: Session = Depends(get_db)):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="注文が見つかりません。")
    return order
