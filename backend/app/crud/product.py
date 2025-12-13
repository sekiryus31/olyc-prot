from typing import List, Optional

from sqlalchemy.orm import Session

from models.product import Product
from schemas.product import ProductCreate, ProductUpdate


def get_product(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()


def get_products(
    db: Session,
    *,
    hotel_id: Optional[int] = None,
    category_id: Optional[int] = None,
) -> List[Product]:
    """
    全商品一覧。
    hotel_id や category_id で任意に絞り込み。
    """
    q = db.query(Product)

    if hotel_id is not None:
        q = q.filter(Product.hotel_id == hotel_id)

    if category_id is not None:
        q = q.filter(Product.category_id == category_id)

    return q.order_by(Product.id.desc()).all()


def create_product(db: Session, product_in: ProductCreate) -> Product:
    product = Product(
        code=product_in.code,
        name=product_in.name,
        description=product_in.description,
        category_id=product_in.category_id,
        price=product_in.price,
        hotel_id=product_in.hotel_id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(
    db: Session,
    *,
    db_obj: Product,
    product_in: ProductUpdate,
) -> Product:
    """
    None じゃない項目だけ上書きする。
    """
    if product_in.code is not None:
        db_obj.code = product_in.code
    if product_in.name is not None:
        db_obj.name = product_in.name
    if product_in.description is not None:
        db_obj.description = product_in.description

    if product_in.category_id is not None:
        db_obj.category_id = product_in.category_id
    if product_in.price is not None:
        db_obj.price = product_in.price
    if product_in.tax_rate is not None:
        db_obj.tax_rate = product_in.tax_rate

    if product_in.hotel_id is not None:
        db_obj.hotel_id = product_in.hotel_id

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_product(db: Session, *, db_obj: Product) -> None:
    db.delete(db_obj)
    db.commit()
