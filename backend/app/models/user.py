from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Allowed: 'employee', 'hr'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Establish one-to-one relationship to Employee.
    # cascade="all, delete-orphan" ensures when User is deleted, the corresponding Employee is too.
    employee = relationship("Employee", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email} (Role: {self.role})>"
