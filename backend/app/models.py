import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")


class Round(Base):
    __tablename__ = "rounds"

    id = Column(Integer, primary_key=True, index=True)
    round_number = Column(Integer, unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    total_questions = Column(Integer, default=50, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    questions = relationship("Question", back_populates="round", order_by="Question.question_order", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="round", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("rounds.id", ondelete="CASCADE"), nullable=False, index=True)
    question_order = Column(Integer, nullable=False)
    category = Column(String(80), nullable=False)  # "Bible Knowledge" or "General Knowledge"
    difficulty = Column(String(50), default="Advanced", nullable=False)
    question_text = Column(Text, nullable=False)
    
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    
    correct_answer = Column(String(5), nullable=False)  # "A", "B", "C", "D"
    explanation = Column(Text, nullable=False)
    bible_reference = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    round = relationship("Round", back_populates="questions")
    responses = relationship("QuestionResponse", back_populates="question", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('round_id', 'question_order', name='uq_round_question_order'),
    )


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    round_id = Column(Integer, ForeignKey("rounds.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status = Column(String(20), default="in_progress", nullable=False)  # "in_progress", "completed", "abandoned"
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    total_score = Column(Integer, default=0, nullable=False)
    correct_count = Column(Integer, default=0, nullable=False)
    incorrect_count = Column(Integer, default=0, nullable=False)
    unanswered_count = Column(Integer, default=0, nullable=False)
    accuracy_percentage = Column(Float, default=0.0, nullable=False)
    
    bible_correct = Column(Integer, default=0, nullable=False)
    bible_total = Column(Integer, default=25, nullable=False)
    gk_correct = Column(Integer, default=0, nullable=False)
    gk_total = Column(Integer, default=25, nullable=False)
    
    total_time_seconds = Column(Float, default=0.0, nullable=False)

    user = relationship("User", back_populates="attempts")
    round = relationship("Round", back_populates="attempts")
    responses = relationship("QuestionResponse", back_populates="attempt", cascade="all, delete-orphan")


class QuestionResponse(Base):
    __tablename__ = "question_responses"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    selected_option = Column(String(5), nullable=True)  # "A", "B", "C", "D", or None for unanswered
    is_correct = Column(Boolean, default=False, nullable=False)
    time_taken_seconds = Column(Float, default=0.0, nullable=False)
    answered_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempt = relationship("QuizAttempt", back_populates="responses")
    question = relationship("Question", back_populates="responses")

    __table_args__ = (
        UniqueConstraint('attempt_id', 'question_id', name='uq_attempt_question'),
    )
