from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime,
    Numeric, Float, Boolean,
    ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, date

# Enum（独自のenum）はここから
from models.enums import OrderStatus, PaymentMethod, BillingPartyType

from db.base import Base


order_items = relationship("OrderItem", back_populates="product")



# ==============================
# 2. 商品管理系
# ==============================

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    display_ord = Column(Integer, nullable=True)

    # products = relationship("Product", back_populates="category")



class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=True)
    name = Column(String(255), nullable=False)

    category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=True)
    price = Column(Numeric(10, 2), nullable=False)

    # 特定ホテル専用の商品にしたい場合
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=True)

    description = Column(String(1000), nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    # リレーション
    # category = relationship("ProductCategory", back_populates="products")
    # hotel = relationship("Hotel", back_populates="products")
    # prices = relationship(
    #     "ProductPrice",
    #     back_populates="product",
    #     cascade="all, delete-orphan",
    # )
    # order_items = relationship("OrderItem", back_populates="product")


class ProductPrice(Base):
    """
    任意：期間別価格（繁忙期・閑散期など）
    """
    __tablename__ = "product_prices"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # product = relationship("Product", back_populates="prices")

