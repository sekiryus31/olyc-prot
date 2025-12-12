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


# ==============================
# 3. 注文管理系
# ==============================

class Guest(Base):
    __tablename__ = "guests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # orders = relationship("Order", back_populates="guest")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=False)
    guest_id = Column(Integer, ForeignKey("guests.id"), nullable=True)
    billing_party_id = Column(Integer, ForeignKey("billing_parties.id"), nullable=False)

    order_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.PENDING)

    total_amount = Column(Numeric(10, 2), nullable=False, default=0)
    currency = Column(String(3), nullable=False, default="JPY")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    # リレーション
    # hotel = relationship("Hotel", back_populates="orders")
    # guest = relationship("Guest", back_populates="orders")
    # billing_party = relationship("BillingParty", back_populates="orders")
    # items = relationship(
    #     "OrderItem",
    #     back_populates="order",
    #     cascade="all, delete-orphan",
    # )
    # payments = relationship(
    #     "Payment",
    #     back_populates="order",
    #     cascade="all, delete-orphan",
    # )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    # order = relationship("Order", back_populates="items")
    # product = relationship("Product", back_populates="order_items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)

    payment_method = Column(Enum(PaymentMethod), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    paid_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    external_id = Column(String(255), nullable=True)  # 決済代行側IDなど

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # order = relationship("Order", back_populates="payments")