from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type = Column(String, nullable=False)  # Allowed: 'Paid', 'Sick', 'Unpaid'
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    remarks = Column(Text, nullable=True)
    status = Column(String, default="Pending", nullable=False, index=True)  # Allowed: 'Pending', 'Approved', 'Rejected'
    hr_comments = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="leaves")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    def __repr__(self):
        return f"<LeaveRequest id={self.id} emp_id={self.employee_id} type='{self.leave_type}' status='{self.status}'>"
