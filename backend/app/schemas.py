from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator

# Helper for strict password validation
def validate_password_strength(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not any(c.isupper() for c in v):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not any(c.islower() for c in v):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not any(c.isdigit() for c in v):
        raise ValueError("Password must contain at least one digit.")
    special_chars = "!@#$%^&*()-_=+[]{}|;:',.<>?/`~"
    if not any(c in special_chars for c in v):
        raise ValueError("Password must contain at least one special character.")
    return v

# ----------------- PRODUCT SCHEMAS -----------------

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the product")
    sku: str = Field(..., min_length=1, description="Stock Keeping Unit / Code (must be unique)")
    price: float = Field(..., ge=0.0, description="Price of the product (cannot be negative)")
    quantity_in_stock: int = Field(..., ge=0, description="Available stock quantity (cannot be negative)")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    sku: Optional[str] = Field(None, min_length=1)
    price: Optional[float] = Field(None, ge=0.0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int
    created_date: datetime
    updated_date: datetime
    is_deleted: bool

    model_config = ConfigDict(from_attributes=True)


# ----------------- CUSTOMER SCHEMAS -----------------

class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, description="Full name of the customer")
    email: EmailStr = Field(..., description="Unique email address of the customer")
    phone_number: Optional[str] = Field(None, description="Contact phone number")

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_date: datetime
    updated_date: datetime
    is_deleted: bool

    model_config = ConfigDict(from_attributes=True)


# ----------------- ORDER ITEM SCHEMAS -----------------

class OrderItemBase(BaseModel):
    product_id: int = Field(..., gt=0, description="Reference to the product")
    quantity: int = Field(..., gt=0, description="Quantity ordered (must be greater than 0)")

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    price: float  # Price at which the item was purchased

    model_config = ConfigDict(from_attributes=True)


# ----------------- ORDER SCHEMAS -----------------

class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0, description="Reference to the customer placing the order")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items in the order")

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: float
    created_date: datetime
    updated_date: datetime
    is_deleted: bool
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


# ----------------- USER AUTH SCHEMAS -----------------

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: EmailStr
    phone_number: str = Field(..., min_length=5, description="Mobile number for OTP verification")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")

    @field_validator("password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        return validate_password_strength(v)

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone_number: str
    is_email_verified: bool
    is_mobile_verified: bool
    is_active: bool
    created_date: datetime

    model_config = ConfigDict(from_attributes=True)

class OTPVerify(BaseModel):
    email: EmailStr
    email_otp: str = Field(..., min_length=6, max_length=6)
    mobile_otp: str = Field(..., min_length=6, max_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    csrf_token: str
    token_type: str = "bearer"

class PasswordChange(BaseModel):
    old_password: str = Field(..., min_length=6, description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")

    @field_validator("new_password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        return validate_password_strength(v)
