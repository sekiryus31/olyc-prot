from sqlalchemy.orm import Session
from app.models.product_category import ProductCategory
from app.schemas.product_category import (
    ProductCategoryCreate,
    ProductCategoryUpdate
)

def get_categories(db: Session):
    return (
        db.query(ProductCategory)
        .filter(ProductCategory.delete_flag == 0)
        .order_by(ProductCategory.sort_order, ProductCategory.id)
        .all()
    )

def get_category(db: Session, category_id: int):
    return (
        db.query(ProductCategory)
        .filter(
            ProductCategory.id == category_id,
            ProductCategory.delete_flag == 0
        )
        .first()
    )

def create_category(db: Session, category_in: ProductCategoryCreate):
    category = ProductCategory(
        code=category_in.code,
        name=category_in.name,
        description=category_in.description,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

def update_category(
    db: Session,
    category: ProductCategory,
    category_in: ProductCategoryUpdate
):
    for field, value in category_in.dict(exclude_unset=True).items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category

def soft_delete_category(db: Session, category: ProductCategory):
    category.delete_flag = 1
    db.commit()
    db.refresh(category)
    return True
