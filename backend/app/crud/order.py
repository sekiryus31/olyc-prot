# app/crud/order.py
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, List
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from models.order import Order
from models.hotel import Hotel
from schemas.order import OrderCreate, OrderUpdate

# ----------------------------
# order_no 採番
# 例: 20251221-000123
# ----------------------------
def _today_yyyymmdd_jst() -> str:
    # JST固定（サーバTZに依存しない）
    # ※ もしプロジェクトで統一TZユーティリティがあるなら差し替えてOK
    jst = timezone.utc  # 仮でUTCにしないために…と思ったらJSTが必要
    # timezone(+9) を使う
    jst = timezone(datetime.now().astimezone().utcoffset() or timezone.utc.utcoffset(None))  # fallback
    # ↑ これだと環境依存になるので、確実に +9 を指定
    jst = timezone(datetime.timedelta(hours=9))  # type: ignore[attr-defined]


def _jst_now() -> datetime:
    from datetime import timedelta
    JST = timezone(timedelta(hours=9))
    return datetime.now(tz=JST)


def _date_prefix(now: Optional[datetime] = None) -> str:
    now = now or _jst_now()
    return now.strftime("%Y%m%d")


def generate_order_no(db: Session) -> str:
    """
    例: 20251221-000123
    当日の orders の最大連番を見て +1
    """
    prefix = _date_prefix()
    like_pattern = f"{prefix}-%"

    last = (
        db.query(Order.order_no)
        .filter(Order.order_no.like(like_pattern))
        .order_by(desc(Order.order_no))
        .first()
    )

    if not last or not last[0]:
        seq = 1
    else:
        # "YYYYMMDD-000123" の 000123 を取り出し
        try:
            seq = int(last[0].split("-")[1]) + 1
        except Exception:
            seq = 1

    return f"{prefix}-{seq:06d}"



def _make_order_no(order_id: int) -> str:
    """
    例: 20251222-000123
    """
    today = datetime.now().strftime("%Y%m%d")
    return f"{today}-{order_id:06d}"



# ----------------------------
# CRUD
# ----------------------------
def create_order(db: Session, order_in) -> Order:
    hotel = db.query(Hotel).filter(Hotel.id == order_in.hotel_id).first()
    if not hotel:
        raise ValueError("Hotel not found")

    payment = getattr(hotel, "payment", None) or 2

    # ① いったん order_no はダミーで入れる（NOT NULL 回避）
    #    ここは仮文字列なら何でもいいが、ユニーク制約があるなら衝突しない値にする
    order = Order(
        order_no="__TEMP__",  # 後で差し替える
        hotel_id=order_in.hotel_id,
        room_no=order_in.room_no,
        status="draft",
        requested_at=getattr(order_in, "requested_at", None),
        total_amount=Decimal("0.00"),
        payment=payment,
        notes=getattr(order_in, "notes", None),
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # ② id を使って order_no を作り直して更新
    order.order_no = _make_order_no(order.id)
    db.add(order)
    db.commit()
    db.refresh(order)

    return order


def get_order(db: Session, order_id: int) -> Optional[Order]:
    """注文詳細（削除フラグが無い前提）"""
    return db.query(Order).filter(Order.id == order_id).first()


def get_order_by_order_no(db: Session, order_no: str) -> Optional[Order]:
    return db.query(Order).filter(Order.order_no == order_no).first()


def list_orders(
    db: Session,
    hotel_id: Optional[int] = None,
    room_no: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Order]:
    """
    一覧：ホテル/部屋/ステータスで絞り込み
    """
    q = db.query(Order)

    if hotel_id is not None:
        q = q.filter(Order.hotel_id == hotel_id)

    if room_no:
        q = q.filter(Order.room_no == room_no)

    if status:
        q = q.filter(Order.status == status)

    q = q.order_by(desc(Order.created_at), desc(Order.id))
    return q.offset(offset).limit(limit).all()


def update_order(db: Session, order: Order, order_in: OrderUpdate) -> Order:
    """
    更新：許可した項目のみ（schema側でOptionalにしてる）
    """
    data = order_in.model_dump(exclude_unset=True)

    for k, v in data.items():
        setattr(order, k, v)

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def delete_order(db: Session, order: Order) -> bool:
    """
    物理削除（試作向け）
    ※ 本番は delete_flag 方式にした方が安全
    """
    db.delete(order)
    db.commit()
    return True
