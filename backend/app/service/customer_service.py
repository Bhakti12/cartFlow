from typing import List, Optional
from sqlalchemy.orm import Session
from app.repository import customer_repository
from app.schemas import CustomerCreate
from app.models import Customer

def get_customer(db: Session, customer_id: int) -> Optional[Customer]:
    """Fetches a single customer by ID. Raises ValueError if not found."""
    customer = customer_repository.get_by_id(db, customer_id)
    if not customer:
        raise ValueError("Customer not found")
    return customer

def get_all_customers(db: Session, skip: int = 0, limit: int = 100) -> List[Customer]:
    """Retrieves all active customers with pagination."""
    return customer_repository.get_all(db, skip=skip, limit=limit)

def create_customer(db: Session, customer_in: CustomerCreate) -> Customer:
    """Creates a new customer. Enforces unique email check."""
    existing = customer_repository.get_by_email(db, customer_in.email)
    if existing:
        raise ValueError(f"Customer email '{customer_in.email}' must be unique")
    return customer_repository.create(db, customer_in)

def delete_customer(db: Session, customer_id: int) -> Customer:
    """Soft deletes a customer."""
    db_customer = get_customer(db, customer_id)
    return customer_repository.soft_delete(db, db_customer)
