import random
import secrets
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.rate_limiter import limiter
from app.config.security import get_password_hash, verify_password, create_access_token
from app.models import User
from app.schemas import UserCreate, UserResponse, OTPVerify, UserLogin, TokenResponse, PasswordChange
from app.config.auth_middleware import get_current_user

logger = logging.getLogger("auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user, generates email & mobile OTPs, and outputs them to the console."""
    # 1. Uniqueness checks
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
        
    existing_phone = db.query(User).filter(User.phone_number == user_in.phone_number).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this phone number already exists."
        )

    # 2. Hashing password
    hashed_pwd = get_password_hash(user_in.password)

    # 4. Creating user record (pre-activated/verified)
    db_user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        phone_number=user_in.phone_number,
        hashed_password=hashed_pwd,
        is_email_verified=True,
        is_mobile_verified=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    logger.info(f"Registered user {db_user.email} (auto-activated).")

    return db_user


@router.post("/verify-otp", status_code=status.HTTP_200_OK)
def verify_otp(verify_in: OTPVerify, db: Session = Depends(get_db)):
    """Verifies the email and mobile OTPs to activate the user account."""
    user = db.query(User).filter(User.email == verify_in.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    if user.is_email_verified and user.is_mobile_verified:
        return {"message": "Account is already verified and active."}

    now = datetime.utcnow()

    # 1. Verify email OTP
    if user.email_otp != verify_in.email_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email OTP code."
        )
    if user.email_otp_expires and now > user.email_otp_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email OTP code has expired."
        )

    # 2. Verify mobile OTP
    if user.mobile_otp != verify_in.mobile_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mobile OTP code."
        )
    if user.mobile_otp_expires and now > user.mobile_otp_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile OTP code has expired."
        )

    # 3. Mark user verified and reset OTP fields
    user.is_email_verified = True
    user.is_mobile_verified = True
    user.email_otp = None
    user.email_otp_expires = None
    user.mobile_otp = None
    user.mobile_otp_expires = None

    db.commit()
    return {"message": "Email and mobile number verified successfully. Account is now active."}


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, login_in: UserLogin, db: Session = Depends(get_db)):
    """Logs in an activated user and returns a JWT access token. Throttled at 5 requests/minute."""
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated."
        )

    if not (user.is_email_verified and user.is_mobile_verified):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is not verified. Please complete OTP verification first."
        )

    # Generate CSRF token and embed its value in the JWT payload
    csrf_token = secrets.token_hex(32)
    access_token = create_access_token(data={"sub": str(user.id), "csrf": csrf_token})
    return {"access_token": access_token, "csrf_token": csrf_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieves the profile of the current logged-in user."""
    return current_user


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Changes the password for the current logged-in user."""
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully."}
