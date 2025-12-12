import enum


class BillingPartyType(str, enum.Enum):
    HOTEL = "hotel"
    OPERATOR = "operator"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"


class PaymentMethod(str, enum.Enum):
    CARD = "card"
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
