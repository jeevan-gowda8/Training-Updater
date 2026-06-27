import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student", nullable=False) # "admin" or "student"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    updates = relationship("DailyUpdate", back_populates="user", cascade="all, delete-orphan")

class TrainingDomain(Base):
    __tablename__ = "training_domains"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    updates = relationship("DailyUpdate", back_populates="domain")

class DailyUpdate(Base):
    __tablename__ = "daily_updates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    domain_id = Column(Integer, ForeignKey("training_domains.id"), nullable=False)
    date = Column(Date, nullable=False) # The training day this update belongs to
    task_title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    media_url = Column(String, nullable=True) # Relative URL to the file
    media_type = Column(String, nullable=True) # "image", "video" or None
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="updates")
    domain = relationship("TrainingDomain", back_populates="updates")
