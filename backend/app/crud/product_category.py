from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models.product_category import ProductCategory
from schemas.product_category import (
    ProductCategoryCreate,
    ProductCategoryUpdate
)
# from models.product import Product


def get_categories(db: Session):
    return (
        db.query(ProductCategory)
        .filter(ProductCategory.delete_flag == 0)
        .order_by(ProductCategory.sort_order, ProductCategory.id)
        .all()
    )



def create_category(db: Session, category_in: ProductCategoryCreate) -> ProductCategory:
    """
    ProductCategory を新規作成して返す。
    code は unique 想定なので重複時は例外になる（呼び出し側でHTTPExceptionなどに変換）。
    """
    category = ProductCategory(
        code=category_in.code,
        name=category_in.name,
        sort_order=getattr(category_in, "sort_order", 0) or 0,
        delete_flag=getattr(category_in, "delete_flag", 0) or 0,
    )

    db.add(category)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # code の重複など。API側で 409 にするのが一般的
        raise

    db.refresh(category)
    return category



def get_category(db: Session, category_id: int):
    return db.query(ProductCategory).filter(ProductCategory.id == category_id).first()




def update_category_by_id(db: Session, category_id: int, data: ProductCategoryUpdate):
    cat = get_category(db, category_id)
    if not cat:
        return None

    # 入ってきた値だけ更新（None は無視）
    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items():
        setattr(cat, k, v)

    db.commit()
    db.refresh(cat)
    return cat



def delete_category(db: Session, category_id: int) -> bool:
    cat = (
        db.query(ProductCategory)
        .filter(
            ProductCategory.id == category_id,
            ProductCategory.delete_flag == 0,
        )
        .first()
    )
    if not cat:
        return False
    
    cat.delete_flag = 1
    db.commit()
    db.refresh(cat)
    return True