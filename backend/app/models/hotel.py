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

orders = relationship("Order", back_populates="hotel")




class Hotel(Base):
    __tablename__ = "hotels"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)

    # operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    operator_id = Column(Integer, nullable=True)
    delete_flg = Column(Integer, nullable=False, server_default="0")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # リレーション（operator側のモデルは後で作ればOK。ひとまず文字列参照で成立する）
    # operator = relationship("Operator", back_populates="hotels", lazy="joined")
