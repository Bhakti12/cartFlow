from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.config.database import init_db_connection, Base, engine
from app.config.settings import settings
from app.config.rate_limiter import limiter
import app.models
from app.controller import product_controller, customer_controller, order_controller, auth_controller

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and verify database connection with retries on startup
    init_db_connection()
    # Auto-create all tables based on loaded models
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="CartFlow API",
    description="Product, Customer, and Order Management System Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [origin.strip() for origin in settings.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect shared rate limiter to application state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Global handler for ValueErrors raised from the service layer
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    err_str = str(exc)
    status_code = status.HTTP_400_BAD_REQUEST
    if "not found" in err_str.lower():
        status_code = status.HTTP_404_NOT_FOUND
    return JSONResponse(
        status_code=status_code,
        content={"detail": err_str}
    )

# Register API routes
app.include_router(auth_controller.router)
app.include_router(product_controller.router)
app.include_router(customer_controller.router)
app.include_router(order_controller.router)

@app.get("/")
async def home():
    return {
        "message": "Hello FastAPI"
    }

@app.get("/home")
async def home():
    return {
        "message": "This is my first home page with fast api"
    }