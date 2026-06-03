import logging
import time
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError

from app.config.settings import settings

# Set up logging
logger = logging.getLogger("database")
logging.basicConfig(level=logging.INFO)

# Create SQLAlchemy engine
# pool_pre_ping=True checks connection validity before checkout from pool
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    FastAPI dependency generator to provide a database session per request.
    Ensures that the database session is closed after the request is complete.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db_connection() -> None:
    """
    Attempts to establish a connection to the PostgreSQL database with retry logic.
    Retries connection with a configurable interval and limit.
    Raises OperationalError if it cannot connect after all retries.
    """
    retry_limit = settings.DB_RETRY_LIMIT
    retry_interval = settings.DB_RETRY_INTERVAL_SECONDS
    
    logger.info("Verifying PostgreSQL database connection...")
    
    for attempt in range(1, retry_limit + 1):
        try:
            # Try to establish connection and run a test query
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            logger.info("PostgreSQL database connection established successfully.")
            return
        except OperationalError as e:
            logger.warning(
                f"Database connection attempt {attempt}/{retry_limit} failed. "
                f"Retrying in {retry_interval} seconds... Error detail: {e}"
            )
            if attempt == retry_limit:
                logger.critical("Failed to connect to the database after maximum retries.")
                raise e
            time.sleep(retry_interval)
