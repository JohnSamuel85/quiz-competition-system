from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=100)

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_admin: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- Question & Round Schemas for Quiz Taking (Sanitized) ---
class QuestionSanitized(BaseModel):
    id: int
    question_order: int
    category: str
    difficulty: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    bible_reference: Optional[str] = None

    class Config:
        from_attributes = True


class RoundSummary(BaseModel):
    id: int
    round_number: int
    title: str
    description: Optional[str]
    total_questions: int
    is_active: bool
    user_attempted_today: bool = False
    latest_score: Optional[int] = None
    latest_accuracy: Optional[float] = None
    latest_attempt_id: Optional[int] = None

    class Config:
        from_attributes = True


class RoundDetail(BaseModel):
    id: int
    round_number: int
    title: str
    description: Optional[str]
    total_questions: int
    questions: List[QuestionSanitized]

    class Config:
        from_attributes = True


# --- Quiz Attempt & Submission Schemas ---
class StartAttemptResponse(BaseModel):
    attempt_id: int
    round_id: int
    round_number: int
    round_title: str
    total_questions: int
    started_at: datetime.datetime
    questions: List[QuestionSanitized]


class SubmitAnswerRequest(BaseModel):
    question_id: int
    selected_option: Optional[str] = None  # "A", "B", "C", "D" or None for timeout/unanswered
    time_taken_seconds: float = Field(0.0, ge=0.0, le=45.0)


class SubmitAnswerResponse(BaseModel):
    success: bool
    question_id: int
    saved: bool
    is_last_question: bool


class FinishAttemptRequest(BaseModel):
    pass


class QuestionReviewItem(BaseModel):
    question_id: int
    question_order: int
    category: str
    difficulty: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    selected_option: Optional[str]  # What user picked (or None)
    correct_answer: str            # A, B, C, or D
    is_correct: bool
    explanation: str
    bible_reference: Optional[str]
    time_taken_seconds: float


class ScorecardResponse(BaseModel):
    attempt_id: int
    round_id: int
    round_number: int
    round_title: str
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime]
    total_score: int
    total_questions: int
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    accuracy_percentage: float
    total_time_seconds: float
    bible_correct: int
    bible_total: int
    gk_correct: int
    gk_total: int
    user_full_name: str
    questions_review: List[QuestionReviewItem]


class UserStatsResponse(BaseModel):
    total_attempts: int
    total_rounds_completed: int
    overall_accuracy: float
    total_correct: int
    total_questions_answered: int
    best_score: int
    bible_accuracy: float
    gk_accuracy: float
    recent_attempts: List[dict]


# --- Bulk Question Bank Import Schemas (ChatGPT JSON Source) ---
class ImportedQuestionSchema(BaseModel):
    question_order: Optional[int] = None
    category: str = Field(..., description="Bible Knowledge or General Knowledge")
    difficulty: Optional[str] = "Advanced"
    question_text: str = Field(..., min_length=5)
    options: dict[str, str] = Field(..., description="Dict with keys 'A', 'B', 'C', 'D'")
    correct_answer: str = Field(..., pattern=r"^(A|B|C|D)$")
    explanation: str = Field(..., min_length=5)
    bible_reference: Optional[str] = None


class ImportedRoundSchema(BaseModel):
    round_number: int
    title: str
    description: Optional[str] = ""
    questions: List[ImportedQuestionSchema]


class BulkImportResponse(BaseModel):
    success: bool
    message: str
    round_id: int
    round_number: int
    total_imported: int
    bible_questions_count: int
    gk_questions_count: int
