from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.product import Product
from schemas.product import ProductCreate, ProductUpdate


def list_products(
    db: Session,
    *,
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    hotel_id: Optional[int] = None,
    include_common: bool = True,
    limit: int = 200,
    offset: int = 0,
) -> List[Product]:
    """
    商品一覧（delete_flag=0 のみ）
    - q: code / name の部分一致
    - category_id: 完全一致
    - hotel_id: 完全一致（include_common=True なら hotel_id=NULL も含める）
    """
    query = db.query(Product).filter(Product.delete_flag == 0)

    if q:
        like = f"%{q.strip()}%"
        # SQLiteでは ilike が効かないケースがあるので、必要なら like に寄せてOK
        query = query.filter(or_(Product.code.ilike(like), Product.name.ilike(like)))

    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    if hotel_id is not None:
        if include_common:
            query = query.filter(or_(Product.hotel_id == hotel_id, Product.hotel_id.is_(None)))
        else:
            query = query.filter(Product.hotel_id == hotel_id)

    return (
        query.order_by(Product.updated_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_product(db: Session, product_id: int) -> Optional[Product]:
    """商品詳細（delete_flag=0 のみ）"""
    return (
        db.query(Product)
        .filter(Product.id == product_id, Product.delete_flag == 0)
        .first()
    )


def create_product(db: Session, payload: ProductCreate) -> Product:
    """商品作成（delete_flag は常に0で作る）"""
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


def update_product(db: Session, product_id: int, payload: ProductUpdate) -> Optional[Product]:
    """商品更新（delete_flag=0 のみ更新可能）"""
    product = get_product(db, product_id)
    if not product:
        return None

    data = payload.model_dump(exclude_unset=True)

    # 試作品なので単純に上書き。必要ならここでバリデーション追加。
    for k, v in data.items():
        setattr(product, k, v)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> bool:
    """商品論理削除（delete_flag=1）"""
    product = get_product(db, product_id)
    if not product:
        return False

    product.delete_flag = 1
    db.commit()
    return True
