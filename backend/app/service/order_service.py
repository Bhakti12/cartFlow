from typing import List, Optional
from sqlalchemy.orm import Session
from app.repository import order_repository, customer_repository, product_repository
from app.schemas import OrderCreate
from app.models import Order

def get_order(db: Session, order_id: int) -> Optional[Order]:
    """Fetches a single order by ID. Raises ValueError if not found."""
    order = order_repository.get_by_id(db, order_id)
    if not order:
        raise ValueError("Order not found")
    return order

def get_all_orders(db: Session, skip: int = 0, limit: int = 100) -> List[Order]:
    """Retrieves all active orders with pagination."""
    return order_repository.get_all(db, skip=skip, limit=limit)

def create_order(db: Session, order_in: OrderCreate) -> Order:
    """
    Creates a new order, calculates totals, reduces inventory, and links line items.
    Executed inside a single database transaction. Rollback occurs if any step fails.
    """
    # 1. Verify customer exists
    customer = customer_repository.get_by_id(db, order_in.customer_id)
    if not customer:
        raise ValueError("Customer not found")

    try:
        total_amount = 0.0
        validated_items = []

        # 2. Validate all products and stock availability first
        for item in order_in.items:
            product = product_repository.get_by_id(db, item.product_id)
            if not product:
                raise ValueError(f"Product with ID {item.product_id} not found")
            
            if product.quantity_in_stock < item.quantity:
                raise ValueError(
                    f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                    f"Requested: {item.quantity}, Available: {product.quantity_in_stock}"
                )
            
            # Keep track of validated details to process later
            validated_items.append((product, item.quantity))
            total_amount += product.price * item.quantity

        # 3. Create the Order header
        db_order = order_repository.create(db, order_in.customer_id, total_amount)

        # 4. Deduct inventory and insert order line items
        for product, quantity in validated_items:
            product.quantity_in_stock -= quantity
            order_repository.create_item(
                db=db,
                order_id=db_order.id,
                product_id=product.id,
                quantity=quantity,
                price=product.price
            )

        # 5. Commit all changes at once
        db.commit()
        db.refresh(db_order)
        return db_order

    except Exception as e:
        db.rollback()
        raise e

def delete_order(db: Session, order_id: int) -> Order:
    """
    Cancels/soft-deletes an order. Restores items back into product stock.
    Executed inside a single transaction.
    """
    db_order = get_order(db, order_id)
    
    try:
        # Restock items back into product inventory
        for item in db_order.items:
            product = product_repository.get_by_id(db, item.product_id)
            if product:
                product.quantity_in_stock += item.quantity
        
        # Soft delete order
        cancelled_order = order_repository.soft_delete(db, db_order)
        return cancelled_order
    except Exception as e:
        db.rollback()
        raise e
