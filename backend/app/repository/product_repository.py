from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Product
from app.schemas import ProductCreate

def get_by_id(db: Session, product_id: int) -> Optional[Product]:
    """Retrieves a product by ID, excluding soft-deleted ones."""
    return db.query(Product).filter(Product.id == product_id, Product.is_deleted == False).first()

def get_by_sku(db: Session, sku: str) -> Optional[Product]:
    """Retrieves an active product by SKU."""
    return db.query(Product).filter(Product.sku == sku, Product.is_deleted == False).first()

def get_by_sku_any(db: Session, sku: str) -> Optional[Product]:
    """Retrieves any product by SKU, including soft-deleted ones (useful for uniqueness validation)."""
    return db.query(Product).filter(Product.sku == sku).first()

def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
    """Retrieves all active products with pagination."""
    return db.query(Product).filter(Product.is_deleted == False).offset(skip).limit(limit).all()

def create(db: Session, product_in: ProductCreate) -> Product:
    """Inserts a new product into the database."""
    db_product = Product(
        name=product_in.name,
        sku=product_in.sku,
        price=product_in.price,
        quantity_in_stock=product_in.quantity_in_stock
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update(db: Session, db_product: Product, updates: dict) -> Product:
    """Updates an existing product in the database."""
    for field, value in updates.items():
        setattr(db_product, field, value)
    db_product.updated_date = datetime.utcnow()
    db.commit()
    db.refresh(db_product)
    return db_product

def soft_delete(db: Session, db_product: Product) -> Product:
    """Marks a product as deleted (soft delete)."""
    db_product.is_deleted = True
    db_product.deleted_date = datetime.utcnow()
    db.commit()
    db.refresh(db_product)
    return db_product
