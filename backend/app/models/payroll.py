from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import date

class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    
    # Link to Employee.employee_id string
    employee_id = Column(String, ForeignKey("employees.employee_id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    
    basic_salary = Column(Float, default=0.0, nullable=False)
    allowances = Column(Float, default=0.0, nullable=False)
    deductions = Column(Float, default=0.0, nullable=False)
    net_salary = Column(Float, default=0.0, nullable=False)
    effective_date = Column(Date, default=date.today, nullable=False)

    # Relationship back to Employee
    employee = relationship("Employee", back_populates="payroll")

    def __repr__(self):
        return f"<Payroll {self.employee_id}: Net={self.net_salary}>"
