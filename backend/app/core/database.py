import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

def get_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql"):
        try:
            # Test if postgres is reachable with a short timeout
            test_engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return test_engine
        except Exception as e:
            logger.warning(
                f"PostgreSQL connection to {db_url} failed ({e}). "
                "Falling back to local SQLite database: sqlite:///./dayflow.db"
            )
            return create_engine("sqlite:///./dayflow.db", connect_args={"check_same_thread": False})
    elif db_url.startswith("sqlite"):
        return create_engine(db_url, connect_args={"check_same_thread": False})
    else:
        return create_engine(db_url, pool_pre_ping=True)

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    FastAPI dependency that provides a local database session.
    Ensures that the connection is closed after a request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
            
