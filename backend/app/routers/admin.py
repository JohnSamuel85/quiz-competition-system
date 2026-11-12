import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, security

router = APIRouter(prefix="/api/admin", tags=["Admin Question Management"])

EXPECTED_SCHEMA_DOC = {
    "round_number": 1,
    "title": "Championship Round 1 - Advanced Knowledge",
    "description": "50 high-difficulty questions: 25 Bible Knowledge + 25 General Knowledge.",
    "questions": [
        {
            "question_order": 1,
            "category": "Bible Knowledge",
            "difficulty": "Advanced",
            "question_text": "Which prophet was instructed to marry an unfaithful woman named Gomer as a living symbol of Israel's infidelity?",
            "options": {
                "A": "Amos",
                "B": "Hosea",
                "C": "Micah",
                "D": "Habakkuk"
            },
            "correct_answer": "B",
            "explanation": "God commanded Hosea (Hosea 1:2-3) to marry Gomer to symbolize the covenant unfaithfulness of Israel.",
            "bible_reference": "Hosea 1:2-3"
        },
        {
            "question_order": 26,
            "category": "General Knowledge",
            "difficulty": "Advanced",
            "question_text": "Which ancient Anatolian empire pioneered the widespread military and tool use of smelted iron around 1200 BCE?",
            "options": {
                "A": "Hittites",
                "B": "Phoenicians",
                "C": "Minoans",
                "D": "Sumerians"
            },
            "correct_answer": "A",
            "explanation": "The Hittite Empire of Anatolia was renowned for pioneering iron smelting metallurgy, ushering in the Near Eastern Iron Age.",
            "bible_reference": None
        }
    ]
}

@router.get("/schema")
def get_import_schema(current_user: models.User = Depends(security.get_current_admin)):
    """Provides documentation and a sample JSON template for ChatGPT prompt generation."""
    return {
        "required_structure": "JSON object with round_number, title, optional description, and questions array.",
        "rules": [
            "Exactly 50 questions per round (25 Bible Knowledge + 25 General Knowledge).",
            "Every question must have four non-empty options keyed as 'A', 'B', 'C', 'D'.",
            "correct_answer must be strictly 'A', 'B', 'C', or 'D'.",
            "Category must contain either 'Bible' or 'General'.",
            "No duplicate question texts allowed."
        ],
        "example_template": EXPECTED_SCHEMA_DOC
    }


def validate_and_parse_round_data(data: dict) -> tuple[dict, list[str]]:
    """Strictly validates imported round payload against competition rules."""
    errors = []

    if "round_number" not in data or not isinstance(data["round_number"], int):
        errors.append("Field 'round_number' is required and must be an integer.")

    if "title" not in data or not isinstance(data["title"], str) or len(data["title"].strip()) == 0:
        errors.append("Field 'title' is required and must be non-empty.")

    raw_questions = data.get("questions")
    if not isinstance(raw_questions, list):
        errors.append("Field 'questions' must be a list.")
        return data, errors

    if len(raw_questions) != 50:
        errors.append(f"Round must contain exactly 50 questions. Found {len(raw_questions)} questions.")

    bible_count = 0
    gk_count = 0
    seen_texts = set()

    for idx, q in enumerate(raw_questions, start=1):
        prefix = f"Question #{idx}"
        q_text = q.get("question_text", "").strip()
        if not q_text:
            errors.append(f"{prefix}: 'question_text' is required.")
        elif q_text.lower() in seen_texts:
            errors.append(f"{prefix}: Duplicate question text detected: '{q_text[:40]}...'")
        else:
            seen_texts.add(q_text.lower())

        cat = q.get("category", "").strip()
        if "bible" in cat.lower():
            bible_count += 1
        elif "general" in cat.lower() or "gk" in cat.lower():
            gk_count += 1
        else:
            errors.append(f"{prefix}: Category must be 'Bible Knowledge' or 'General Knowledge' (got '{cat}').")

        options = q.get("options")
        if not isinstance(options, dict):
            errors.append(f"{prefix}: 'options' must be an object with keys A, B, C, D.")
        else:
            for opt_key in ["A", "B", "C", "D"]:
                if opt_key not in options or not str(options[opt_key]).strip():
                    errors.append(f"{prefix}: Missing or empty option '{opt_key}'.")

        correct = str(q.get("correct_answer", "")).strip().upper()
        if correct not in ["A", "B", "C", "D"]:
            errors.append(f"{prefix}: 'correct_answer' must be one of 'A', 'B', 'C', 'D' (got '{correct}').")

        expl = q.get("explanation", "").strip()
        if not expl:
            errors.append(f"{prefix}: 'explanation' is required.")

    if bible_count != 25:
        errors.append(f"Distribution error: exactly 25 Bible Knowledge questions required (found {bible_count}).")
    if gk_count != 25:
        errors.append(f"Distribution error: exactly 25 General Knowledge questions required (found {gk_count}).")

    return data, errors


@router.post("/import", response_model=schemas.BulkImportResponse)
def import_questions_json(
    payload: dict,
    current_user: models.User = Depends(security.get_current_admin),
    db: Session = Depends(get_db)
):
    validated_data, errors = validate_and_parse_round_data(payload)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Question validation failed", "errors": errors}
        )

    round_num = validated_data["round_number"]
    title = validated_data["title"]
    description = validated_data.get("description", "")

    # Check if round already exists
    existing_round = db.query(models.Round).filter(models.Round.round_number == round_num).first()
    if existing_round:
        # Clear existing questions for clean overwrite
        db.query(models.Question).filter(models.Question.round_id == existing_round.id).delete()
        existing_round.title = title
        existing_round.description = description
        existing_round.total_questions = len(validated_data["questions"])
        target_round = existing_round
    else:
        target_round = models.Round(
            round_number=round_num,
            title=title,
            description=description,
            total_questions=len(validated_data["questions"]),
            is_active=True
        )
        db.add(target_round)
        db.flush()

    bible_count = 0
    gk_count = 0

    for idx, q_dict in enumerate(validated_data["questions"], start=1):
        cat = q_dict.get("category", "General Knowledge").strip()
        is_bible = "bible" in cat.lower()
        if is_bible:
            bible_count += 1
            cat_normalized = "Bible Knowledge"
        else:
            gk_count += 1
            cat_normalized = "General Knowledge"

        options = q_dict["options"]
        new_q = models.Question(
            round_id=target_round.id,
            question_order=idx,
            category=cat_normalized,
            difficulty=q_dict.get("difficulty", "Advanced"),
            question_text=q_dict["question_text"].strip(),
            option_a=str(options["A"]).strip(),
            option_b=str(options["B"]).strip(),
            option_c=str(options["C"]).strip(),
            option_d=str(options["D"]).strip(),
            correct_answer=q_dict["correct_answer"].strip().upper(),
            explanation=q_dict["explanation"].strip(),
            bible_reference=q_dict.get("bible_reference")
        )
        db.add(new_q)

    db.commit()
    db.refresh(target_round)

    return schemas.BulkImportResponse(
        success=True,
        message=f"Round {round_num} successfully imported with {len(validated_data['questions'])} questions.",
        round_id=target_round.id,
        round_number=round_num,
        total_imported=len(validated_data["questions"]),
        bible_questions_count=bible_count,
        gk_questions_count=gk_count
    )


@router.get("/rounds")
def get_all_rounds_admin(
    current_user: models.User = Depends(security.get_current_admin),
    db: Session = Depends(get_db)
):
    rounds = db.query(models.Round).order_by(models.Round.round_number).all()
    results = []
    for r in rounds:
        bible_count = db.query(models.Question).filter(models.Question.round_id == r.id, models.Question.category.ilike("%bible%")).count()
        gk_count = db.query(models.Question).filter(models.Question.round_id == r.id, ~models.Question.category.ilike("%bible%")).count()
        attempts_count = db.query(models.QuizAttempt).filter(models.QuizAttempt.round_id == r.id).count()
        results.append({
            "id": r.id,
            "round_number": r.round_number,
            "title": r.title,
            "description": r.description,
            "total_questions": len(r.questions),
            "bible_questions": bible_count,
            "gk_questions": gk_count,
            "attempts_count": attempts_count,
            "created_at": r.created_at.isoformat()
        })
    return results


@router.delete("/rounds/{round_id}")
def delete_round_admin(
    round_id: int,
    current_user: models.User = Depends(security.get_current_admin),
    db: Session = Depends(get_db)
):
    target = db.query(models.Round).filter(models.Round.id == round_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Round not found")
    db.delete(target)
    db.commit()
    return {"success": True, "message": f"Round #{target.round_number} has been deleted."}
