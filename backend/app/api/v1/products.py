from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from db.session import get_db
from schemas.product import Product, ProductCreate, ProductUpdate
import crud.product as product_crud


router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=List[Product])
def read_products(
    hotel_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    products = product_crud.get_products(
        db, hotel_id=hotel_id, category_id=category_id
    )
    return products



@router.post("/", response_model=Product, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
):
    # code が unique な前提なので、必要であればここで重複チェックしてもOK
    product = product_crud.create_product(db, product_in=product_in)
    return product


@router.get("/{product_id}", response_model=Product)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = product_crud.get_product(db, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=Product)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
):
    product = product_crud.get_product(db, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product = product_crud.update_product(
        db, db_obj=product, product_in=product_in
    )
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = product_crud.get_product(db, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product_crud.delete_product(db, db_obj=product)
    return None





@router.get("")
def list_products(hotel_id: int, db: Session = Depends(get_db)):
    """
    ?hotel_id=1 で、そのホテル向けの商品を全部返す。
    カテゴリは product.category をフロント側で利用。
    """
    products = (
        db.query(Product)
        .filter(Product.hotel_id == hotel_id)
        .order_by(Product.category, Product.id)
        .all()
    )

    # 最小の dict にして返す
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "category": p.category,
        }
        for p in products
    ]