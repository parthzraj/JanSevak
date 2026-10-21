import math

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.quiz import QuizAttempt
from app.models.reward import RewardTransaction
from app.models.user import User
from app.schemas.quiz import (
    QuestionReview,
    QuizDetail,
    QuizQuestionPublic,
    QuizResult,
    QuizSubmit,
    QuizSummary,
)
from app.services.points_engine import award_points
from app.services.quiz_bank import QUIZ_BY_ID, QUIZZES

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


def _pass_mark(quiz: dict) -> int:
    """At least half the questions right."""
    return math.ceil(len(quiz["questions"]) / 2)


def _get_quiz(quiz_id: str) -> dict:
    quiz = QUIZ_BY_ID.get(quiz_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.get("", response_model=list[QuizSummary])
def list_quizzes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempts = db.scalars(select(QuizAttempt).where(QuizAttempt.user_id == user.id)).all()
    by_quiz: dict[str, list[QuizAttempt]] = {}
    for a in attempts:
        by_quiz.setdefault(a.quiz_id, []).append(a)
    out = []
    for q in QUIZZES:
        mine = by_quiz.get(q["id"], [])
        out.append(
            QuizSummary(
                id=q["id"],
                title=q["title"],
                category=q["category"],
                description=q["description"],
                points_reward=q["points_reward"],
                questions_count=len(q["questions"]),
                estimated_minutes=q["estimated_minutes"],
                pass_mark=_pass_mark(q),
                attempts=len(mine),
                best_score=max((a.score for a in mine), default=None),
                passed=any(a.passed for a in mine),
                points_awarded=sum(a.points_awarded for a in mine),
            )
        )
    return out


@router.get("/{quiz_id}", response_model=QuizDetail)
def get_quiz(quiz_id: str, user: User = Depends(get_current_user)):
    """Questions only - correct answers are revealed after submitting."""
    q = _get_quiz(quiz_id)
    return QuizDetail(
        id=q["id"],
        title=q["title"],
        category=q["category"],
        points_reward=q["points_reward"],
        pass_mark=_pass_mark(q),
        questions=[
            QuizQuestionPublic(id=i + 1, question=x["question"], options=x["options"])
            for i, x in enumerate(q["questions"])
        ],
    )


@router.post("/{quiz_id}/submit", response_model=QuizResult)
def submit_quiz(
    quiz_id: str,
    body: QuizSubmit,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Grade on the server. Points are paid once, on the first attempt that reaches the pass mark,
    in proportion to the score, and still count toward the daily cap."""
    quiz = _get_quiz(quiz_id)
    questions = quiz["questions"]
    if len(body.answers) != len(questions):
        raise HTTPException(status_code=422, detail=f"Expected {len(questions)} answers")
    for ans, q in zip(body.answers, questions):
        if not 0 <= ans < len(q["options"]):
            raise HTTPException(status_code=422, detail="Answer out of range")

    review = [
        QuestionReview(
            question=q["question"],
            options=q["options"],
            your_answer=ans,
            correct_index=q["answer_index"],
            correct=ans == q["answer_index"],
            explanation=q["explanation"],
        )
        for ans, q in zip(body.answers, questions)
    ]
    score = sum(1 for r in review if r.correct)
    total = len(questions)
    passed = score >= _pass_mark(quiz)

    paid_before = db.scalar(
        select(RewardTransaction.id).where(
            RewardTransaction.user_id == user.id,
            RewardTransaction.action_type == "quiz",
            RewardTransaction.action_id == quiz_id,
        )
    )
    awarded, capped = 0, False
    if passed and paid_before is None:
        result = award_points(
            db, user, "quiz", quiz_id,
            points=round(score / total * quiz["points_reward"]),
            description=f"Quiz: {quiz['title']}",
        )
        awarded, capped = result.awarded, result.capped

    db.add(QuizAttempt(user_id=user.id, quiz_id=quiz_id, score=score, total=total, passed=passed, points_awarded=awarded))
    db.commit()
    db.refresh(user)

    if not passed:
        note = f"You need {_pass_mark(quiz)} of {total} correct to earn points. Try again!"
    elif paid_before is not None:
        note = "Points for this quiz were already earned - replays are just for practice."
    elif capped and awarded == 0:
        note = "Daily point cap reached - no points this time."
    elif capped:
        note = "Points were clipped by the daily cap."
    else:
        note = "Nice work!"

    return QuizResult(
        quiz_id=quiz_id,
        score=score,
        total=total,
        passed=passed,
        pass_mark=_pass_mark(quiz),
        points_awarded=awarded,
        already_rewarded=paid_before is not None,
        capped=capped,
        note=note,
        review=review,
        user_points=user.points,
        user_tier=user.tier,
    )
