from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app import crud
from app.schemas.product_category import (
    ProductCategory,
    ProductCategoryCreate,
    ProductCategoryUpdate
)

router = APIRouter()

@router.get("/", response_model=List[ProductCategory])
def read_categories(db: Session = Depends(deps.get_db)):
    return crud.product_category.get_categories(db)

@router.post("/", response_model=ProductCategory)
def create_category(
    category_in: ProductCategoryCreate,
    db: Session = Depends(deps.get_db),
):
    return crud.product_category.create_category(db, category_in)

@router.put("/{category_id}", response_model=ProductCategory)
def update_category(
    category_id: int,
    category_in: ProductCategoryUpdate,
    db: Session = Depends(deps.get_db),
):
    category = crud.product_category.get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return crud.product_category.update_category(db, category, category_in)

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(deps.get_db),
):
    category = crud.product_category.get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    crud.product_category.delete_category(db, category)
    return {"ok": True}
