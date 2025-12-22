from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import get_db
from schemas.order_item import (
    OrderItemCreate,
    OrderItemUpdate,
    OrderItemRead,
    OrderItemListItem,
)
from crud import order_item as item_crud

router = APIRouter()

@router.get("", response_model=List[OrderItemListItem])
def list_order_items_api(
    order_id: int,
    db: Session = Depends(get_db),
):
    """
    注文明細一覧
    """
    return item_crud.list_items(db, order_id)


@router.post("", response_model=OrderItemRead, status_code=status.HTTP_201_CREATED)
def create_order_item_api(
    order_id: int,
    item_in: OrderItemCreate,
    db: Session = Depends(get_db),
):
    """
    注文明細追加
    """
    try:
        item = item_crud.create_item(db, order_id, item_in)
        return item
    except ValueError as e:
        msg = str(e)
        if "Order not found" in msg:
            raise HTTPException(status_code=404, detail="Order not found")
        if "Product not found" in msg:
            raise HTTPException(status_code=404, detail="Product not found")
        raise HTTPException(status_code=400, detail=msg)


@router.get("/{item_id}", response_model=OrderItemRead)
def get_order_item_api(
    order_id: int,
    item_id: int,
    db: Session = Depends(get_db),
):
    """
    注文明細1件取得
    """
    item = item_crud.get_item_in_order(db, order_id, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")
    return item


@router.patch("/{item_id}", response_model=OrderItemRead)
def update_order_item_api(
    order_id: int,
    item_id: int,
    item_in: OrderItemUpdate,
    db: Session = Depends(get_db),
):
    """
    注文明細更新（qty / notes）
    """
    item = item_crud.get_item_in_order(db, order_id, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")

    try:
        item = item_crud.update_item(db, order_id, item, item_in)
        return item
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order_item_api(
    order_id: int,
    item_id: int,
    db: Session = Depends(get_db),
):
    """
    注文明細削除
    """
    item = item_crud.get_item_in_order(db, order_id, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")

    item_crud.delete_item(db, order_id, item)
    return None
