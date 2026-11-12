import sys
import json
import datetime
from backend.app.database import engine, Base, SessionLocal
from backend.app.seed import seed_database_if_empty
from backend.app import models, schemas, security
from backend.app.routers import auth, rounds, quiz, admin

print("=" * 70)
print("  AETHELGARD MASTER QUIZ PLATFORM - DIRECT VERIFICATION SUITE")
print("=" * 70)

# Initialize database & seed
Base.metadata.create_all(bind=engine)
db = SessionLocal()
seed_database_if_empty(db)

# 1. Test Authentication
print("\n[TEST 1] Verifying User Authentication & Security...")
scholar = db.query(models.User).filter(models.User.username == "scholar").first()
assert scholar is not None, "Scholar user missing from seed"
assert security.verify_password("ScholarPass2026!", scholar.hashed_password) is True, "Password verification failed"

admin_user = db.query(models.User).filter(models.User.username == "admin").first()
assert admin_user is not None, "Admin user missing from seed"
assert admin_user.is_admin is True, "Admin user is not flagged as admin"

# Test token generation and decoding
token = security.create_access_token(data={"sub": str(scholar.id)})
decoded_user = security.get_current_user(token=token, db=db)
assert decoded_user.id == scholar.id
print("  [PASS] Bcrypt password hashing & JWT encoding/decoding verified!")

# Test registration endpoint
new_user_in = schemas.UserRegister(
    username="test_inquisitor",
    email="test@aethelgard.com",
    password="TestPassword123!",
    full_name="Grand Test Inquisitor"
)
reg_res = auth.register_user(new_user_in, db=db)
assert reg_res.user.username == "test_inquisitor"
assert reg_res.access_token is not None
print(f"  [PASS] User registration verified: {reg_res.user.full_name}")

# 2. Test Round Retrieval & Anti-Cheat Sanitization
print("\n[TEST 2] Verifying Daily Round & Anti-Cheat Sanitization...")
daily_summary = rounds.get_daily_round(current_user=scholar, db=db)
assert daily_summary.round_number == 1
assert daily_summary.total_questions == 50
print(f"  [PASS] Active Daily Round: #{daily_summary.round_number} - '{daily_summary.title}'")

round_detail = rounds.get_round_detail(round_id=daily_summary.id, current_user=scholar, db=db)
assert len(round_detail.questions) == 50
first_q = round_detail.questions[0]

# Critical Anti-Cheat Check: Ensure correct_answer and explanation are NOT in the model schema
question_dict = first_q.model_dump()
assert "correct_answer" not in question_dict, "SECURITY LEAK: correct_answer exposed in sanitized questions!"
assert "explanation" not in question_dict, "SECURITY LEAK: explanation exposed in sanitized questions!"
print("  [PASS] ANTI-CHEAT VERIFIED: Participants receive questions WITHOUT correct answers or explanations.")

# 3. Test Quiz Execution & Backend Scoring
print("\n[TEST 3] Simulating 50-Question Quiz Attempt & Anti-Cheat Backend Grading...")
# Start attempt
attempt_resp = quiz.start_quiz_attempt(round_id=daily_summary.id, current_user=scholar, db=db)
attempt_id = attempt_resp.attempt_id
print(f"  [PASS] Started quiz attempt ID: {attempt_id} with {len(attempt_resp.questions)} questions.")

# Retrieve true answers directly from DB
raw_questions = db.query(models.Question).filter(models.Question.round_id == daily_summary.id).order_by(models.Question.question_order).all()

# Simulate answers: 42 correct, 6 incorrect, 2 unanswered timeouts
correct_expected = 0
for idx, q in enumerate(raw_questions):
    if idx < 42:
        choice = q.correct_answer
        correct_expected += 1
        time_spent = 8.4
    elif idx < 48:
        wrong = [o for o in ["A", "B", "C", "D"] if o != q.correct_answer][0]
        choice = wrong
        time_spent = 14.2
    else:
        choice = None # Unanswered timeout
        time_spent = 20.0

    ans_in = schemas.SubmitAnswerRequest(
        question_id=q.id,
        selected_option=choice,
        time_taken_seconds=time_spent
    )
    res = quiz.submit_question_answer(attempt_id=attempt_id, answer_in=ans_in, current_user=scholar, db=db)
    assert res.success is True

    # Test duplicate submission prevention rule
    if idx == 0:
        try:
            quiz.submit_question_answer(attempt_id=attempt_id, answer_in=ans_in, current_user=scholar, db=db)
            assert False, "Should have thrown duplicate answer exception"
        except Exception as e:
            assert "already been submitted" in str(e).lower()
            print("  [PASS] RULE VERIFIED: Duplicate answer submission blocked by backend!")

# 4. Test Finalizing Attempt & Scorecard Audit
print("\n[TEST 4] Finalizing Attempt & Checking Scorecard Generation...")
scorecard = quiz.finish_quiz_attempt(attempt_id=attempt_id, current_user=scholar, db=db)

assert scorecard.total_score == correct_expected * 10
assert scorecard.correct_count == 42
assert scorecard.incorrect_count == 6
assert scorecard.unanswered_count == 2
assert scorecard.accuracy_percentage == 84.0

print(f"  [PASS] Scorecard Score: {scorecard.total_score} Pts ({scorecard.accuracy_percentage}% Accuracy)")
print(f"  [PASS] Performance: {scorecard.correct_count} Correct / {scorecard.incorrect_count} Incorrect / {scorecard.unanswered_count} Unanswered Timeouts")
print(f"  [PASS] Category Breakdown: Bible ({scorecard.bible_correct}/{scorecard.bible_total}), General Knowledge ({scorecard.gk_correct}/{scorecard.gk_total})")

# Verify answers and explanations are now revealed on scorecard
first_review = scorecard.questions_review[0]
assert first_review.correct_answer in ["A", "B", "C", "D"]
assert len(first_review.explanation) > 10
print(f"  [PASS] Scorecard Question #1 Review: Correct Answer '{first_review.correct_answer}', Explanation: '{first_review.explanation[:50]}...'")

# 5. Test Prevention of Repeating Same Daily Round
print("\n[TEST 5] Verifying Daily Round Repeat Lockout...")
try:
    quiz.start_quiz_attempt(round_id=daily_summary.id, current_user=scholar, db=db)
    assert False, "Should have blocked repeating the daily round!"
except Exception as e:
    assert "already completed this daily round today" in str(e).lower()
    print("  [PASS] RULE VERIFIED: Participant cannot repeat the same daily round on the same day.")

# 6. Test Admin ChatGPT JSON Question Bank Bulk Importer
print("\n[TEST 6] Testing Admin ChatGPT JSON Question Bank Bulk Importer...")
with open("sample_rounds/round_2_masters.json", "r") as f:
    round_2_payload = json.load(f)

import_res = admin.import_questions_json(payload=round_2_payload, current_user=admin_user, db=db)
assert import_res.success is True
assert import_res.round_number == 2
assert import_res.total_imported == 50
assert import_res.bible_questions_count == 25
assert import_res.gk_questions_count == 25
print(f"  [PASS] ChatGPT Round 2 JSON imported successfully ({import_res.total_imported} questions: {import_res.bible_questions_count} Bible + {import_res.gk_questions_count} GK)!")

# Verify rounds list for admin
all_rounds = admin.get_all_rounds_admin(current_user=admin_user, db=db)
assert len(all_rounds) == 2
print(f"  [PASS] Total competition rounds in database: {len(all_rounds)}")

# Check User Stats
stats = auth.get_user_dashboard_stats(current_user=scholar, db=db)
assert stats.total_rounds_completed == 1
assert stats.best_score == 420
print(f"  [PASS] Dashboard Career Stats: Rounds Completed={stats.total_rounds_completed}, Best Score={stats.best_score}, Accuracy={stats.overall_accuracy}%")

db.close()

print("\n" + "=" * 70)
print("  ALL 6 CORE BACKEND & INTEGRITY SUITES PASSED WITH 100% SUCCESS!")
print("=" * 70 + "\n")
