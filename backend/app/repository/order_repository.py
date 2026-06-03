from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Order, OrderItem

def get_by_id(db: Session, order_id: int) -> Optional[Order]:
    """Retrieves an order by ID, excluding soft-deleted ones."""
    return db.query(Order).filter(Order.id == order_id, Order.is_deleted == False).first()

def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Order]:
    """Retrieves all active orders with pagination."""
    return db.query(Order).filter(Order.is_deleted == False).offset(skip).limit(limit).all()

def create(db: Session, customer_id: int, total_amount: float) -> Order:
    """Creates a new order header (requires flush or commit to generate ID)."""
    db_order = Order(
        customer_id=customer_id,
        total_amount=total_amount
    )
    db.add(db_order)
    db.flush()  # Populates db_order.id before transaction commit
    return db_order

def create_item(db: Session, order_id: int, product_id: int, quantity: int, price: float) -> OrderItem:
    """Creates a line item for an order."""
    db_item = OrderItem(
        order_id=order_id,
        product_id=product_id,
        quantity=quantity,
        price=price
    )
    db.add(db_item)
    return db_item

def soft_delete(db: Session, db_order: Order) -> Order:
    """Marks an order as cancelled / deleted."""
    db_order.is_deleted = True
    db_order.deleted_date = datetime.utcnow()
    db.commit()
    db.refresh(db_order)
    return db_order
