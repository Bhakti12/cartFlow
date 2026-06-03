from typing import List, Optional
from sqlalchemy.orm import Session
from app.repository import product_repository
from app.schemas import ProductCreate, ProductUpdate
from app.models import Product

def get_product(db: Session, product_id: int) -> Optional[Product]:
    """Fetches a single product by ID. Raises ValueError if not found."""
    product = product_repository.get_by_id(db, product_id)
    if not product:
        raise ValueError("Product not found")
    return product

def get_all_products(db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
    """Retrieves all active products with pagination."""
    return product_repository.get_all(db, skip=skip, limit=limit)

def create_product(db: Session, product_in: ProductCreate) -> Product:
    """Creates a new product. Validates unique SKU and non-negative values."""
    # Enforce unique SKU check
    existing = product_repository.get_by_sku(db, product_in.sku)
    if existing:
        raise ValueError(f"Product SKU/code '{product_in.sku}' must be unique")
    
    # Validation for negative price or stock (redundant with Pydantic but good for service safety)
    if product_in.price < 0:
        raise ValueError("Product price cannot be negative")
    if product_in.quantity_in_stock < 0:
        raise ValueError("Product quantity cannot be negative")
        
    return product_repository.create(db, product_in)

def update_product(db: Session, product_id: int, product_update: ProductUpdate) -> Product:
    """Updates product details. Checks SKU uniqueness if updated."""
    db_product = get_product(db, product_id)
    
    updates = product_update.model_dump(exclude_unset=True)
    
    if "sku" in updates and updates["sku"] != db_product.sku:
        existing = product_repository.get_by_sku(db, updates["sku"])
        if existing:
            raise ValueError(f"Product SKU/code '{updates['sku']}' must be unique")
            
    if "price" in updates and updates["price"] < 0:
        raise ValueError("Product price cannot be negative")
    if "quantity_in_stock" in updates and updates["quantity_in_stock"] < 0:
        raise ValueError("Product quantity cannot be negative")
        
    return product_repository.update(db, db_product, updates)

def delete_product(db: Session, product_id: int) -> Product:
    """Soft deletes a product."""
    db_product = get_product(db, product_id)
    return product_repository.soft_delete(db, db_product)
