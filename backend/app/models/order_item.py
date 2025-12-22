# app/models/order_item.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Numeric,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.base import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)

    # 当時情報のスナップショット（推奨）
    category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=True)
    product_code = Column(String(50), nullable=True)
    product_name = Column(String(255), nullable=False)

    unit_price = Column(Numeric(12, 2), nullable=False)
    qty = Column(Integer, nullable=False, default=1)

    # unit_price * qty（保存推奨）
    line_amount = Column(Numeric(12, 2), nullable=False)

    notes = Column(String(1000), nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_order_items_order", "order_id"),
        Index("idx_order_items_product", "product_id"),
    )

    # ---- relations（既存モデル側に back_populates を足すと便利）
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    category = relationship("ProductCategory")
