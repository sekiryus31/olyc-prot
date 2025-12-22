from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Numeric,
    ForeignKey,
    Index,
)
from sqlalchemy.sql import func
from db.base import Base
from sqlalchemy.orm import relationship

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    order_no = Column(String(30), unique=True, nullable=False)

    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=False)
    room_no = Column(String(20), nullable=False)

    status = Column(String(20), nullable=False, default="placed")

    requested_at = Column(DateTime, nullable=True)

    total_amount = Column(Numeric(12, 2), nullable=False)

    payment = Column(Integer, nullable=False)  
    # 1: Olyc / 2: ホテル / 3: その他

    notes = Column(String(2000), nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_orders_hotel_room", "hotel_id", "room_no"),
    )
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )