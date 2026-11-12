import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, security

router = APIRouter(prefix="/api/quiz", tags=["Quiz Engine"])

@router.post("/rounds/{round_id}/start", response_model=schemas.StartAttemptResponse)
def start_quiz_attempt(
    round_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    round_obj = db.query(models.Round).filter(models.Round.id == round_id, models.Round.is_active == True).first()
    if not round_obj:
        raise HTTPException(status_code=404, detail="Round not found or inactive")

    # Check rule: Prevent repeating the same daily round
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + datetime.timedelta(days=1)
    
    completed_today = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id,
        models.QuizAttempt.round_id == round_id,
        models.QuizAttempt.status == "completed",
        models.QuizAttempt.completed_at >= today_start,
        models.QuizAttempt.completed_at < today_end
    ).first()

    if completed_today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already completed this daily round today. You can review your scorecard! (Attempt #{completed_today.id})"
        )

    # Check if there is an in-progress attempt created recently (within 2 hours)
    in_progress_attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id,
        models.QuizAttempt.round_id == round_id,
        models.QuizAttempt.status == "in_progress"
    ).order_by(models.QuizAttempt.started_at.desc()).first()

    if not in_progress_attempt:
        in_progress_attempt = models.QuizAttempt(
            user_id=current_user.id,
            round_id=round_id,
            status="in_progress",
            started_at=datetime.datetime.utcnow(),
            bible_total=sum(1 for q in round_obj.questions if "bible" in q.category.lower()),
            gk_total=sum(1 for q in round_obj.questions if "bible" not in q.category.lower())
        )
        db.add(in_progress_attempt)
        db.commit()
        db.refresh(in_progress_attempt)

    # Sanitize questions (never leak correct_answer or explanation)
    sanitized_questions = [
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
        for q in round_obj.questions
    ]

    return schemas.StartAttemptResponse(
        attempt_id=in_progress_attempt.id,
        round_id=round_obj.id,
        round_number=round_obj.round_number,
        round_title=round_obj.title,
        total_questions=len(sanitized_questions),
        started_at=in_progress_attempt.started_at,
        questions=sanitized_questions
    )


@router.post("/attempts/{attempt_id}/answer", response_model=schemas.SubmitAnswerResponse)
def submit_question_answer(
    attempt_id: int,
    answer_in: schemas.SubmitAnswerRequest,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.id == attempt_id,
        models.QuizAttempt.user_id == current_user.id
    ).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
    if attempt.status != "in_progress":
        raise HTTPException(status_code=400, detail="Quiz attempt is already closed")

    question = db.query(models.Question).filter(
        models.Question.id == answer_in.question_id,
        models.Question.round_id == attempt.round_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found in this round")

    # Prevent submitting multiple answers to the same question
    existing_response = db.query(models.QuestionResponse).filter(
        models.QuestionResponse.attempt_id == attempt_id,
        models.QuestionResponse.question_id == answer_in.question_id
    ).first()

    if existing_response:
        raise HTTPException(status_code=400, detail="Answer has already been submitted for this question")

    # Server-side validation and grading
    selected = answer_in.selected_option.upper().strip() if answer_in.selected_option else None
    if selected and selected not in ["A", "B", "C", "D"]:
        selected = None

    is_correct = bool(selected and selected == question.correct_answer.upper().strip())

    resp = models.QuestionResponse(
        attempt_id=attempt_id,
        question_id=question.id,
        selected_option=selected,
        is_correct=is_correct,
        time_taken_seconds=max(0.0, min(answer_in.time_taken_seconds, 30.0)),
        answered_at=datetime.datetime.utcnow()
    )
    db.add(resp)
    db.commit()

    # Check if this was the last question in the round
    total_questions = db.query(models.Question).filter(models.Question.round_id == attempt.round_id).count()
    answered_count = db.query(models.QuestionResponse).filter(models.QuestionResponse.attempt_id == attempt_id).count()

    return schemas.SubmitAnswerResponse(
        success=True,
        question_id=question.id,
        saved=True,
        is_last_question=(answered_count >= total_questions),
        correct_answer=question.correct_answer,
        is_correct=is_correct,
        explanation=question.explanation,
        bible_reference=question.bible_reference
    )


@router.post("/attempts/{attempt_id}/finish", response_model=schemas.ScorecardResponse)
def finish_quiz_attempt(
    attempt_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.id == attempt_id,
        models.QuizAttempt.user_id == current_user.id
    ).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")

    round_obj = attempt.round
    questions = db.query(models.Question).filter(models.Question.round_id == round_obj.id).order_by(models.Question.question_order).all()
    responses = db.query(models.QuestionResponse).filter(models.QuestionResponse.attempt_id == attempt_id).all()
    response_map = {r.question_id: r for r in responses}

    # For any question not answered (e.g. user quit or navigated away), automatically create unanswered response
    for q in questions:
        if q.id not in response_map:
            unanswered_resp = models.QuestionResponse(
                attempt_id=attempt_id,
                question_id=q.id,
                selected_option=None,
                is_correct=False,
                time_taken_seconds=20.0,
                answered_at=datetime.datetime.utcnow()
            )
            db.add(unanswered_resp)
            response_map[q.id] = unanswered_resp

    db.commit()

    # Re-fetch all responses for score computation
    all_responses = db.query(models.QuestionResponse).filter(models.QuestionResponse.attempt_id == attempt_id).all()
    resp_lookup = {r.question_id: r for r in all_responses}

    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0
    bible_correct = 0
    bible_total = 0
    gk_correct = 0
    gk_total = 0
    total_time = 0.0

    questions_review = []

    for q in questions:
        resp = resp_lookup.get(q.id)
        is_bible = "bible" in q.category.lower()
        if is_bible:
            bible_total += 1
        else:
            gk_total += 1

        selected = resp.selected_option if resp else None
        time_spent = resp.time_taken_seconds if resp else 20.0
        total_time += time_spent

        if selected is None:
            unanswered_count += 1
            is_correct = False
        elif selected == q.correct_answer:
            correct_count += 1
            is_correct = True
            if is_bible:
                bible_correct += 1
            else:
                gk_correct += 1
        else:
            incorrect_count += 1
            is_correct = False

        questions_review.append(schemas.QuestionReviewItem(
            question_id=q.id,
            question_order=q.question_order,
            category=q.category,
            difficulty=q.difficulty,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            selected_option=selected,
            correct_answer=q.correct_answer,
            is_correct=is_correct,
            explanation=q.explanation,
            bible_reference=q.bible_reference,
            time_taken_seconds=round(time_spent, 1)
        ))

    total_q = len(questions)
    accuracy = round((correct_count / total_q * 100), 1) if total_q > 0 else 0.0

    attempt.status = "completed"
    attempt.completed_at = datetime.datetime.utcnow()
    attempt.total_score = correct_count * 10  # 10 pts per correct answer
    attempt.correct_count = correct_count
    attempt.incorrect_count = incorrect_count
    attempt.unanswered_count = unanswered_count
    attempt.accuracy_percentage = accuracy
    attempt.bible_correct = bible_correct
    attempt.bible_total = bible_total
    attempt.gk_correct = gk_correct
    attempt.gk_total = gk_total
    attempt.total_time_seconds = round(total_time, 1)

    db.commit()
    db.refresh(attempt)

    return schemas.ScorecardResponse(
        attempt_id=attempt.id,
        round_id=round_obj.id,
        round_number=round_obj.round_number,
        round_title=round_obj.title,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        total_score=attempt.total_score,
        total_questions=total_q,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        unanswered_count=unanswered_count,
        accuracy_percentage=accuracy,
        total_time_seconds=attempt.total_time_seconds,
        bible_correct=bible_correct,
        bible_total=bible_total,
        gk_correct=gk_correct,
        gk_total=gk_total,
        user_full_name=current_user.full_name,
        questions_review=questions_review
    )


@router.get("/attempts/{attempt_id}/scorecard", response_model=schemas.ScorecardResponse)
def get_scorecard(
    attempt_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.id == attempt_id,
        (models.QuizAttempt.user_id == current_user.id) | (current_user.is_admin == True)
    ).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Scorecard not found")

    round_obj = attempt.round
    questions = db.query(models.Question).filter(models.Question.round_id == round_obj.id).order_by(models.Question.question_order).all()
    responses = db.query(models.QuestionResponse).filter(models.QuestionResponse.attempt_id == attempt_id).all()
    resp_map = {r.question_id: r for r in responses}

    questions_review = []
    for q in questions:
        resp = resp_map.get(q.id)
        selected = resp.selected_option if resp else None
        time_spent = resp.time_taken_seconds if resp else 0.0
        is_corr = (selected == q.correct_answer) if selected else False

        questions_review.append(schemas.QuestionReviewItem(
            question_id=q.id,
            question_order=q.question_order,
            category=q.category,
            difficulty=q.difficulty,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            selected_option=selected,
            correct_answer=q.correct_answer,
            is_correct=is_corr,
            explanation=q.explanation,
            bible_reference=q.bible_reference,
            time_taken_seconds=round(time_spent, 1)
        ))

    return schemas.ScorecardResponse(
        attempt_id=attempt.id,
        round_id=round_obj.id,
        round_number=round_obj.round_number,
        round_title=round_obj.title,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        total_score=attempt.total_score,
        total_questions=len(questions),
        correct_count=attempt.correct_count,
        incorrect_count=attempt.incorrect_count,
        unanswered_count=attempt.unanswered_count,
        accuracy_percentage=attempt.accuracy_percentage,
        total_time_seconds=attempt.total_time_seconds,
        bible_correct=attempt.bible_correct,
        bible_total=attempt.bible_total,
        gk_correct=attempt.gk_correct,
        gk_total=attempt.gk_total,
        user_full_name=attempt.user.full_name,
        questions_review=questions_review
    )
