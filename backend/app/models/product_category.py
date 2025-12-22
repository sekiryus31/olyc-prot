from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from db.base import Base

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)   # ← NO/UNIQUEに合わせる
    name = Column(String(255), nullable=False)
    sort_order = Column(Integer, nullable=True, default=0)
    delete_flag = Column(Integer, nullable=False, server_default="0")  # ← default 0 をDB側

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # products = relationship("Product", back_populates="category")