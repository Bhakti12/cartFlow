from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Customer
from app.schemas import CustomerCreate

def get_by_id(db: Session, customer_id: int) -> Optional[Customer]:
    """Retrieves a customer by ID, excluding soft-deleted ones."""
    return db.query(Customer).filter(Customer.id == customer_id, Customer.is_deleted == False).first()

def get_by_email(db: Session, email: str) -> Optional[Customer]:
    """Retrieves an active customer by email address."""
    return db.query(Customer).filter(Customer.email == email, Customer.is_deleted == False).first()

def get_by_email_any(db: Session, email: str) -> Optional[Customer]:
    """Retrieves any customer by email, including soft-deleted ones (useful for uniqueness validation)."""
    return db.query(Customer).filter(Customer.email == email).first()

def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Customer]:
    """Retrieves all active customers with pagination."""
    return db.query(Customer).filter(Customer.is_deleted == False).offset(skip).limit(limit).all()

def create(db: Session, customer_in: CustomerCreate) -> Customer:
    """Inserts a new customer into the database."""
    db_customer = Customer(
        full_name=customer_in.full_name,
        email=customer_in.email,
        phone_number=customer_in.phone_number
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def soft_delete(db: Session, db_customer: Customer) -> Customer:
    """Marks a customer as deleted (soft delete)."""
    db_customer.is_deleted = True
    db_customer.deleted_date = datetime.utcnow()
    db.commit()
    db.refresh(db_customer)
    return db_customer
