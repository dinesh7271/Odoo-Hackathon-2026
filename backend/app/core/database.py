from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Configure engine with pre-ping enabled to check connection health before executing operations
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

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
            
