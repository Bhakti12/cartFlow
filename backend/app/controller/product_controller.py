from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.auth_middleware import get_current_user
from app.models import User
from app.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.service import product_service

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new product in the system. Requires authentication."""
    try:
        return product_service.create_product(db, product)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[ProductResponse])
def get_products(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all active products with pagination. Requires authentication."""
    return product_service.get_all_products(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=ProductResponse)
def get_product(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves a specific product by ID. Requires authentication."""
    try:
        return product_service.get_product(db, id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/{id}", response_model=ProductResponse)
def update_product(
    id: int, 
    product_update: ProductUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates product information by ID. Requires authentication."""
    try:
        return product_service.update_product(db, id, product_update)
    except ValueError as e:
        # Determine status code based on error message
        status_code = status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(e))

@router.delete("/{id}", response_model=ProductResponse)
def delete_product(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft deletes a product by ID. Requires authentication."""
    try:
        return product_service.delete_product(db, id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

