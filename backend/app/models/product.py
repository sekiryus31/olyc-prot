from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    func,
)
from db.base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=True)
    name = Column(String(255), nullable=False)
    category_id = Column(
        Integer,
        ForeignKey("product_categories.id"),
        nullable=True,
    )

    # 現在価格
    price = Column(Numeric(10, 2), nullable=False)

    # ホテル紐づけ（NULLなら共通商品）
    hotel_id = Column(
        Integer,
        ForeignKey("hotels.id"),
        nullable=True,
    )

    # 説明文
    description = Column(String(1000), nullable=True)

    # 論理削除フラグ
    delete_flag = Column(Integer, nullable=False, default=0)

    # 作成・更新日時
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
