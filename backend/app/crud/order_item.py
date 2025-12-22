from __future__ import annotations

from decimal import Decimal
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from models.order_item import OrderItem
from models.order import Order
from models.product import Product
from schemas.order_item import OrderItemCreate, OrderItemUpdate


# -----------------------------
# internal helpers
# -----------------------------
def _to_decimal(v) -> Decimal:
    """
    SQLAlchemy Numeric や float が混ざっても Decimal に寄せる
    """
    if v is None:
        return Decimal("0")
    if isinstance(v, Decimal):
        return v
    return Decimal(str(v))


def _calc_line_amount(unit_price: Decimal, qty: int) -> Decimal:
    return _to_decimal(unit_price) * Decimal(int(qty))


def recompute_order_total_amount(db: Session, order_id: int) -> Decimal:
    """
    指定 order_id の order_items.line_amount を合計して orders.total_amount を更新する
    """
    total = (
        db.query(func.coalesce(func.sum(OrderItem.line_amount), 0))
        .filter(OrderItem.order_id == order_id)
        .scalar()
    )
    total_dec = _to_decimal(total)

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ValueError("Order not found")

    order.total_amount = total_dec
    db.add(order)
    db.commit()
    db.refresh(order)
    return total_dec


# -----------------------------
# CRUD
# -----------------------------
def list_items(db: Session, order_id: int) -> List[OrderItem]:
    return (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order_id)
        .order_by(OrderItem.id.asc())
        .all()
    )


def get_item(db: Session, item_id: int) -> Optional[OrderItem]:
    return db.query(OrderItem).filter(OrderItem.id == item_id).first()


def get_item_in_order(db: Session, order_id: int, item_id: int) -> Optional[OrderItem]:
    return (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order_id, OrderItem.id == item_id)
        .first()
    )


def create_item(db: Session, order_id: int, item_in: OrderItemCreate) -> OrderItem:
    """
    明細追加
    - product を参照してスナップショットを埋める（基本はサーバ側が正）
    - line_amount を計算して保存
    - 最後に orders.total_amount を再計算
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ValueError("Order not found")

    product = db.query(Product).filter(Product.id == item_in.product_id).first()
    if not product:
        raise ValueError("Product not found")

    # snapshot：基本は product から
    category_id = getattr(product, "category_id", None)
    product_code = getattr(product, "code", None)
    product_name = getattr(product, "name", None)
    unit_price = getattr(product, "price", None)

    # ただし item_in に明示があれば、それを優先してもOK（将来拡張用）
    if item_in.category_id is not None:
        category_id = item_in.category_id
    if item_in.product_code is not None:
        product_code = item_in.product_code
    if item_in.product_name is not None:
        product_name = item_in.product_name
    if item_in.unit_price is not None:
        unit_price = item_in.unit_price

    if not product_name:
        raise ValueError("product_name is required (snapshot failed)")
    if unit_price is None:
        raise ValueError("unit_price is required (snapshot failed)")

    unit_price_dec = _to_decimal(unit_price)
    qty = int(item_in.qty)
    line_amount = _calc_line_amount(unit_price_dec, qty)

    item = OrderItem(
        order_id=order_id,
        product_id=item_in.product_id,
        category_id=category_id,
        product_code=product_code,
        product_name=product_name,
        unit_price=unit_price_dec,
        qty=qty,
        line_amount=line_amount,
        notes=item_in.notes,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    # 合計更新
    recompute_order_total_amount(db, order_id)

    return item


def update_item(db: Session, order_id: int, item: OrderItem, item_in: OrderItemUpdate) -> OrderItem:
    """
    明細更新（qty / notes）
    - qty 変更があれば line_amount 再計算
    - 最後に orders.total_amount 再計算
    """
    data = item_in.model_dump(exclude_unset=True)

    qty_changed = False

    if "qty" in data and data["qty"] is not None:
        item.qty = int(data["qty"])
        qty_changed = True

    if "notes" in data:
        item.notes = data["notes"]

    if qty_changed:
        item.unit_price = _to_decimal(item.unit_price)
        item.line_amount = _calc_line_amount(_to_decimal(item.unit_price), int(item.qty))

    db.add(item)
    db.commit()
    db.refresh(item)

    # 合計更新
    recompute_order_total_amount(db, order_id)

    return item


def delete_item(db: Session, order_id: int, item: OrderItem) -> bool:
    """
    明細削除
    - 最後に orders.total_amount 再計算
    """
    db.delete(item)
    db.commit()

    recompute_order_total_amount(db, order_id)
    return True
