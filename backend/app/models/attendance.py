from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(DateTime(timezone=True), nullable=True)
    check_out = Column(DateTime(timezone=True), nullable=True)
    work_hours = Column(Float, nullable=True, default=0.0)
    status = Column(String, nullable=False, default="Present")  # 'Present', 'Absent', 'Half-day', 'Leave'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Establish reverse relationship to Employee
    employee = relationship("Employee", back_populates="attendances")

    def __repr__(self):
        return f"<Attendance emp={self.employee_id} date={self.date} status={self.status}>"
