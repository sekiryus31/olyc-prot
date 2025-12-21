from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ProductCategoryBase(BaseModel):
    code: Optional[str] = None
    name: str
    sort_order: Optional[int] = 0

class ProductCategoryCreate(ProductCategoryBase):
    pass

class ProductCategoryUpdate(ProductCategoryBase):
    pass

class ProductCategory(ProductCategoryBase):
    id: int
    delete_flag: int
    created_at: datetime
    updated_at: datetime
