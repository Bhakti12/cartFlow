from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.security import decode_access_token
from app.models import User

# Define HTTPBearer security scheme (which automatically extracts Bearer <token>)
security_scheme = HTTPBearer()

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to extract and authenticate the current user from a JWT Bearer token.
    Raises 401 Unauthorized if token is missing, expired, invalid, or user is unverified.
    Raises 403 Forbidden if CSRF token verification fails on state-changing methods.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    # CSRF check for state-changing HTTP requests
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        expected_csrf = payload.get("csrf")
        client_csrf = request.headers.get("x-csrf-token")
        
        if not expected_csrf or not client_csrf or expected_csrf != client_csrf:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token validation failed. Custom 'X-CSRF-Token' header is missing or mismatching."
            )

        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user ID claim (sub)"
        )
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated"
        )
        
    # Check email and mobile OTP verification status
    if not (user.is_email_verified and user.is_mobile_verified):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not verified. Please verify OTP first before accessing this API."
        )
        
    return user
