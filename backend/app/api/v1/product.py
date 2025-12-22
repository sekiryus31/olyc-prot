from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from db.session import get_db
from models.product import Product
from schemas.product import Product as ProductSchema
from schemas.product import ProductCreate, ProductUpdate


router = APIRouter()


@router.get("", response_model=List[ProductSchema])
def list_products(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(default=None, description="コード/商品名検索"),
    category_id: Optional[int] = Query(default=None),
    hotel_id: Optional[int] = Query(default=None),
    include_common: bool = Query(default=True, description="hotel_id指定時に共通商品(NULL)も含める"),
):
    """
    商品一覧（論理削除は除外）
    """
    query = db.query(Product).filter(Product.delete_flag == 0)

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(Product.code.ilike(like), Product.name.ilike(like)))

    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    if hotel_id is not None:
        if include_common:
            query = query.filter(or_(Product.hotel_id == hotel_id, Product.hotel_id.is_(None)))
        else:
            query = query.filter(Product.hotel_id == hotel_id)

    # とりあえず更新日の降順（新しい順）
    return query.order_by(Product.updated_at.desc()).all()


@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    商品詳細（論理削除は404扱い）
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.delete_flag == 0)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductSchema)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    """
    商品新規作成（試作品：最低限）
    """
    product = Product(
        code=payload.code,
        name=payload.name,
        category_id=payload.category_id,
        price=payload.price,
        hotel_id=payload.hotel_id,
        description=payload.description,
        delete_flag=0,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductSchema)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    """
    商品更新（試作品：全部任意）
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.delete_flag == 0)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    data = payload.model_dump(exclude_unset=True)

    for k, v in data.items():
        setattr(product, k, v)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    論理削除（delete_flag=1）
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.delete_flag == 0)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.delete_flag = 1
    db.commit()
    return {"ok": True}
