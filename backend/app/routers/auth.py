import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .. import models, schemas, security

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.TokenResponse)
def register_user(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check if username or email already exists
    existing_user = db.query(models.User).filter(
        (models.User.username == user_in.username) | (models.User.email == user_in.email)
    ).first()
    if existing_user:
        if existing_user.username == user_in.username:
            raise HTTPException(status_code=400, detail="Username is already taken")
        else:
            raise HTTPException(status_code=400, detail="Email is already registered")

    # If first user, make them admin automatically
    user_count = db.query(models.User).count()
    is_admin = (user_count == 0)

    hashed_pw = security.get_password_hash(user_in.password)
    user = models.User(
        username=user_in.username,
        email=user_in.email.lower(),
        hashed_password=hashed_pw,
        full_name=user_in.full_name,
        is_admin=is_admin
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = security.create_access_token(data={"sub": str(user.id)})
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserOut.model_validate(user)
    )

@router.post("/login", response_model=schemas.TokenResponse)
def login_user(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    login_id = login_data.username_or_email.strip()
    user = db.query(models.User).filter(
        (models.User.username == login_id) | (models.User.email == login_id.lower())
    ).first()

    if not user or not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = security.create_access_token(data={"sub": str(user.id)})
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserOut.model_validate(user)
    )

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_profile(current_user: models.User = Depends(security.get_current_user)):
    return schemas.UserOut.model_validate(current_user)

@router.get("/stats", response_model=schemas.UserStatsResponse)
def get_user_dashboard_stats(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    attempts = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id,
        models.QuizAttempt.status == "completed"
    ).order_by(models.QuizAttempt.completed_at.desc()).all()

    total_attempts = len(attempts)
    if total_attempts == 0:
        return schemas.UserStatsResponse(
            total_attempts=0,
            total_rounds_completed=0,
            overall_accuracy=0.0,
            total_correct=0,
            total_questions_answered=0,
            best_score=0,
            bible_accuracy=0.0,
            gk_accuracy=0.0,
            recent_attempts=[]
        )

    total_correct = sum(a.correct_count for a in attempts)
    total_questions = sum(a.total_score for a in attempts)  # or 50 * total_attempts
    best_score = max(a.total_score for a in attempts)

    total_bible_correct = sum(a.bible_correct for a in attempts)
    total_bible_q = sum(a.bible_total for a in attempts)
    bible_accuracy = round((total_bible_correct / total_bible_q * 100), 1) if total_bible_q > 0 else 0.0

    total_gk_correct = sum(a.gk_correct for a in attempts)
    total_gk_q = sum(a.gk_total for a in attempts)
    gk_accuracy = round((total_gk_correct / total_gk_q * 100), 1) if total_gk_q > 0 else 0.0

    all_questions_attempted = (total_attempts * 50)
    overall_accuracy = round((total_correct / all_questions_attempted * 100), 1) if all_questions_attempted > 0 else 0.0

    recent_attempts_data = []
    for a in attempts[:10]:
        recent_attempts_data.append({
            "attempt_id": a.id,
            "round_id": a.round_id,
            "round_number": a.round.round_number if a.round else 0,
            "round_title": a.round.title if a.round else f"Round {a.round_id}",
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            "total_score": a.total_score,
            "correct_count": a.correct_count,
            "incorrect_count": a.incorrect_count,
            "unanswered_count": a.unanswered_count,
            "accuracy_percentage": a.accuracy_percentage,
            "total_time_seconds": a.total_time_seconds
        })

    return schemas.UserStatsResponse(
        total_attempts=total_attempts,
        total_rounds_completed=total_attempts,
        overall_accuracy=overall_accuracy,
        total_correct=total_correct,
        total_questions_answered=all_questions_attempted,
        best_score=best_score,
        bible_accuracy=bible_accuracy,
        gk_accuracy=gk_accuracy,
        recent_attempts=recent_attempts_data
    )
