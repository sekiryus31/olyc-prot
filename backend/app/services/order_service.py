# services/order_service.py
from sqlalchemy.orm import Session
from typing import Optional
from ..models.order import Order, OrderItem
from ..schemas.order import OrderCreate


def create_order(db: Session, order_in: OrderCreate) -> Order:
    order = Order(
        hotel_id=order_in.hotel_id,
        remark=order_in.remark,
        status="pending",
    )
    db.add(order)
    db.flush()  # order.id を先に確定

    has_item = False
    for item_in in order_in.items:
        if item_in.quantity <= 0:
            continue
        has_item = True
        db.add(OrderItem(
            order_id=order.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity,
        ))

    if not has_item:
        # 1件も数量がない場合
        raise ValueError("数量が1以上の明細がありません。")

    db.commit()
    db.refresh(order)
    return order


def get_order(db: Session, order_id: int) -> Optional[Order]:
    return db.query(Order).filter(Order.id == order_id).first()
