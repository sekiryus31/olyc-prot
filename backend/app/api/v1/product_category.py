from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from db.session import get_db
from schemas.product_category import ProductCategory, ProductCategoryCreate, ProductCategoryUpdate
from crud.product_category import get_categories, get_category, update_category_by_id, delete_category, create_category

# router = APIRouter(prefix="/category", tags=["category"])
router = APIRouter()

@router.get("/", response_model=List[ProductCategory])
def read_categories(db: Session = Depends(get_db)):
    return get_categories(db)



@router.get("/{category_id}", response_model=ProductCategory)
def get_category_endpoint(category_id: int, db: Session = Depends(get_db)):
    cat = get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat




@router.post("/", response_model=ProductCategory)
def create_category_endpoint(
    category_in: ProductCategoryCreate,
    db: Session = Depends(get_db),
):
    return create_category(db, category_in)




@router.put("/{category_id}", response_model=ProductCategory)
def update_category_endpoint(
    category_id: int,
    category_in: ProductCategoryUpdate,
    db: Session = Depends(get_db),
):
    category = get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return update_category_by_id(db, category_id, category_in)




@router.delete("/{category_id}")
def delete_category_endpoint(
    category_id: int,
    db: Session = Depends(get_db),
):
    try:
        ok = delete_category(db, category_id)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    if not ok:
        raise HTTPException(status_code=404, detail="Category not found")

    return {"ok": True}
