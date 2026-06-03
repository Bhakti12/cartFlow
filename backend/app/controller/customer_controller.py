from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.auth_middleware import get_current_user
from app.models import User
from app.schemas import CustomerCreate, CustomerResponse
from app.service import customer_service

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer: CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new customer. Requires authentication."""
    try:
        return customer_service.create_customer(db, customer)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all active customers. Requires authentication."""
    return customer_service.get_all_customers(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=CustomerResponse)
def get_customer(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves customer details by ID. Requires authentication."""
    try:
        return customer_service.get_customer(db, id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{id}", response_model=CustomerResponse)
def delete_customer(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft deletes a customer by ID. Requires authentication."""
    try:
        return customer_service.delete_customer(db, id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

