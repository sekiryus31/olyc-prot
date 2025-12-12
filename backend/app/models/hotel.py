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
# 1. ホテル管理系
# ==============================

class Operator(Base):
    __tablename__ = "operators"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=True)
    address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    # リレーション
    # hotels = relationship("Hotel", back_populates="operator")
    # billing_parties = relationship("BillingParty", back_populates="operator")


class Hotel(Base):
    __tablename__ = "hotels"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)

    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    # # リレーション
    # operator = relationship("Operator", back_populates="hotels")
    # products = relationship("Product", back_populates="hotel")
    # billing_settings = relationship(
    #     "HotelBillingSetting",
    #     back_populates="hotel",
    #     cascade="all, delete-orphan",
    # )
    # billing_parties = relationship("BillingParty", back_populates="hotel")
    # orders = relationship("Order", back_populates="hotel")


class BillingParty(Base):
    """
    内部の「請求先」マスタ
    - type = hotel     → hotel_id を使用
    - type = operator  → operator_id を使用
    """
    __tablename__ = "billing_parties"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(BillingPartyType), nullable=False)

    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)

    name = Column(String(255), nullable=False)
    billing_addr = Column(String(255), nullable=True)
    payment_terms = Column(String(255), nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    # リレーション
    # hotel = relationship("Hotel", back_populates="billing_parties")
    # operator = relationship("Operator", back_populates="billing_parties")
    # hotel_settings = relationship("HotelBillingSetting", back_populates="billing_party")
    # orders = relationship("Order", back_populates="billing_party")


class HotelBillingSetting(Base):
    """
    ホテルごとのデフォルト請求先
    valid_from / valid_to で履歴管理
    """
    __tablename__ = "hotel_billing_settings"

    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=False)
    billing_party_id = Column(Integer, ForeignKey("billing_parties.id"), nullable=False)

    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=True)  # None = 現在有効

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # リレーション
    # hotel = relationship("Hotel", back_populates="billing_settings")
    # billing_party = relationship("BillingParty", back_populates="hotel_settings")

