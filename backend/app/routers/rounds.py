import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, security

router = APIRouter(prefix="/api/rounds", tags=["Rounds"])

@router.get("", response_model=list[schemas.RoundSummary])
def list_rounds(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    rounds = db.query(models.Round).filter(models.Round.is_active == True).order_by(models.Round.round_number).all()
    
    # Check today's date in UTC
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + datetime.timedelta(days=1)

    result = []
    for r in rounds:
        # Check attempts by this user for this round
        latest_attempt = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.user_id == current_user.id,
            models.QuizAttempt.round_id == r.id,
            models.QuizAttempt.status == "completed"
        ).order_by(models.QuizAttempt.completed_at.desc()).first()

        # Check if attempted today
        attempt_today = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.user_id == current_user.id,
            models.QuizAttempt.round_id == r.id,
            models.QuizAttempt.status == "completed",
            models.QuizAttempt.completed_at >= today_start,
            models.QuizAttempt.completed_at < today_end
        ).first() is not None

        result.append(schemas.RoundSummary(
            id=r.id,
            round_number=r.round_number,
            title=r.title,
            description=r.description,
            total_questions=r.total_questions,
            is_active=r.is_active,
            user_attempted_today=attempt_today,
            latest_score=latest_attempt.total_score if latest_attempt else None,
            latest_accuracy=latest_attempt.accuracy_percentage if latest_attempt else None,
            latest_attempt_id=latest_attempt.id if latest_attempt else None
        ))
    return result

@router.get("/daily", response_model=schemas.RoundSummary)
def get_daily_round(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    # Today's round is determined by round_number matching day of year or active round
    rounds = db.query(models.Round).filter(models.Round.is_active == True).order_by(models.Round.round_number).all()
    if not rounds:
        raise HTTPException(status_code=404, detail="No active competition rounds available")

    # Select round based on current date
    day_of_year = datetime.datetime.utcnow().timetuple().tm_yday
    round_index = (day_of_year - 1) % len(rounds)
    daily_round = rounds[round_index]

    # Check today's attempt
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + datetime.timedelta(days=1)

    latest_attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id,
        models.QuizAttempt.round_id == daily_round.id,
        models.QuizAttempt.status == "completed"
    ).order_by(models.QuizAttempt.completed_at.desc()).first()

    attempt_today = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id,
        models.QuizAttempt.round_id == daily_round.id,
        models.QuizAttempt.status == "completed",
        models.QuizAttempt.completed_at >= today_start,
        models.QuizAttempt.completed_at < today_end
    ).first() is not None

    return schemas.RoundSummary(
        id=daily_round.id,
        round_number=daily_round.round_number,
        title=daily_round.title,
        description=daily_round.description,
        total_questions=daily_round.total_questions,
        is_active=daily_round.is_active,
        user_attempted_today=attempt_today,
        latest_score=latest_attempt.total_score if latest_attempt else None,
        latest_accuracy=latest_attempt.accuracy_percentage if latest_attempt else None,
        latest_attempt_id=latest_attempt.id if latest_attempt else None
    )

@router.get("/{round_id}", response_model=schemas.RoundDetail)
def get_round_detail(
    round_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    r = db.query(models.Round).filter(models.Round.id == round_id, models.Round.is_active == True).first()
    if not r:
        raise HTTPException(status_code=404, detail="Round not found")

    # Return sanitized questions (NO answers or explanations exposed!)
    questions_sanitized = [
        schemas.QuestionSanitized(
            id=q.id,
            question_order=q.question_order,
            category=q.category,
            difficulty=q.difficulty,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            bible_reference=q.bible_reference
        )
        for q in r.questions
    ]

    return schemas.RoundDetail(
        id=r.id,
        round_number=r.round_number,
        title=r.title,
        description=r.description,
        total_questions=r.total_questions,
        questions=questions_sanitized
    )
