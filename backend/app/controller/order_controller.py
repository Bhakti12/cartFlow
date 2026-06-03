from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.auth_middleware import get_current_user
from app.models import User
from app.schemas import OrderCreate, OrderResponse
from app.service import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order: OrderCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new order, validating inventory availability and calculating totals. Requires authentication."""
    try:
        return order_service.create_order(db, order)
    except ValueError as e:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(e))

@router.get("/", response_model=List[OrderResponse])
def get_orders(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all active orders. Requires authentication."""
    return order_service.get_all_orders(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=OrderResponse)
def get_order(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves order details by ID. Requires authentication."""
    try:
        return order_service.get_order(db, id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{id}", response_model=OrderResponse)
def delete_order(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancels/soft-deletes an order by ID and restores item stocks. Requires authentication."""
    try:
        return order_service.delete_order(db, id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

