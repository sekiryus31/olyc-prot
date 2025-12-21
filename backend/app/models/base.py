from sqlalchemy.orm import declarative_base
from db.base import Base

Base = declarative_base()


# ★ ここに全部 import する
from models.hotel import Hotel
from models.product import Product
from models.product_category import ProductCategory
from models.order import Order, OrderItem
