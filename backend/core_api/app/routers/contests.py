"""NGO quiz contests: NGOs publish, citizens play once, the top three win on closing.

Ranking: highest score first, then the faster finish, then whoever submitted earlier.
Prizes (points, outside the daily cap): 1st 100, 2nd 60, 3rd 40, and +10 for everyone who
finishes with at least one right answer. NGOs may add their own prize text on top.
"""
import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db, utcnow
from app.core.security import get_current_user, require_ngo
from app.models.contest import Contest, ContestEntry
from app.models.user import User
from app.schemas.contest import (
    ContestCreate,
    ContestOut,
    LeaderboardResponse,
    LeaderRow,
    MyEntry,
    PlayQuestion,
    ReviewItem,
    StartResponse,
    SubmitBody,
    SubmitResponse,
)
from app.services.notifications import notify
from app.services.points_engine import award_points

router = APIRouter(prefix="/contests", tags=["contests"])

RANK_PRIZES = {1: 100, 2: 60, 3: 40}
PARTICIPATION_POINTS = 10
GRACE_SECONDS = 15  # network slack on the time limit


# ---------------------------------------------------------------- helpers
def _questions(c: Contest) -> list[dict]:
    return json.loads(c.questions)


def _status(c: Contest, now: datetime) -> str:
    if now < c.starts_at:
        return "upcoming"
    return "live" if now < c.ends_at else "ended"


def _sort_key(e: ContestEntry):
    return (-(e.score or 0), e.duration_seconds if e.duration_seconds is not None else 1e9, e.submitted_at, e.id)


def _submitted(db: Session, contest_id: int) -> list[ContestEntry]:
    rows = db.scalars(
        select(ContestEntry).where(ContestEntry.contest_id == contest_id, ContestEntry.submitted_at.is_not(None))
    ).all()
    return sorted(rows, key=_sort_key)


def finalize_if_due(db: Session, c: Contest) -> None:
    """Close a finished contest exactly once: fix ranks and pay the prizes. Safe to call often."""
    now = utcnow()
    if c.finalized_at is not None or now < c.ends_at:
        return
    for idx, entry in enumerate(_submitted(db, c.id), start=1):
        entry.rank = idx
        if (entry.score or 0) < 1:
            continue
        user = db.get(User, entry.user_id)
        paid = 0
        base = award_points(
            db, user, "contest_play", c.id, points=PARTICIPATION_POINTS,
            description=f"Finished contest: {c.title}", respect_cap=False,
        )
        paid += base.awarded
        prize = RANK_PRIZES.get(idx)
        if prize:
            win = award_points(
                db, user, "contest_win", c.id, points=prize,
                description=f"Contest #{idx}: {c.title}", respect_cap=False,
            )
            paid += win.awarded
        entry.bonus_points = paid
        msg = f"You finished #{idx} in \"{c.title}\" and earned {paid} points."
        if prize and c.prize:
            msg += f" Prize from the NGO: {c.prize}."
        notify(db, user.id, "Contest results are in" if not prize else f"You placed #{idx}!", msg, "reward")
    c.finalized_at = now
    db.commit()


def _my_entry(db: Session, c: Contest, user: User) -> MyEntry | None:
    e = db.scalar(select(ContestEntry).where(ContestEntry.contest_id == c.id, ContestEntry.user_id == user.id))
    if e is None:
        return MyEntry(state="not_started", total=len(_questions(c)))
    if e.submitted_at is None:
        return MyEntry(state="in_progress", total=e.total)
    rank = e.rank
    if rank is None:  # provisional rank while the contest is still running
        ranked = _submitted(db, c.id)
        rank = next((i for i, x in enumerate(ranked, start=1) if x.id == e.id), None)
    return MyEntry(
        state="submitted", score=e.score, total=e.total, rank=rank,
        bonus_points=e.bonus_points, duration_seconds=e.duration_seconds,
    )


def _out(db: Session, c: Contest, user: User) -> ContestOut:
    ngo = db.get(User, c.ngo_id)
    participants = db.scalar(
        select(func.count()).select_from(ContestEntry).where(
            ContestEntry.contest_id == c.id, ContestEntry.submitted_at.is_not(None)
        )
    ) or 0
    return ContestOut(
        id=c.id, title=c.title, topic=c.topic, description=c.description, prize=c.prize,
        ngo_id=c.ngo_id, ngo_name=ngo.name if ngo else "NGO", status=_status(c, utcnow()),
        starts_at=c.starts_at, ends_at=c.ends_at, time_limit_seconds=c.time_limit_seconds,
        question_count=len(_questions(c)), participants=participants, finalized=c.finalized_at is not None,
        my_entry=_my_entry(db, c, user) if user.role == "citizen" else None,
    )


def _get(db: Session, contest_id: int) -> Contest:
    c = db.get(Contest, contest_id)
    if c is None:
        raise HTTPException(status_code=404, detail="Contest not found")
    finalize_if_due(db, c)
    return c


# ---------------------------------------------------------------- NGO side
@router.post("", response_model=ContestOut, status_code=status.HTTP_201_CREATED)
def create_contest(body: ContestCreate, ngo: User = Depends(require_ngo), db: Session = Depends(get_db)):
    c = Contest(
        ngo_id=ngo.id,
        title=body.title.strip(),
        topic=body.topic.strip(),
        description=body.description.strip(),
        prize=(body.prize or "").strip() or None,
        questions=json.dumps([q.model_dump() for q in body.questions]),
        time_limit_seconds=body.time_limit_seconds,
        starts_at=body.starts_at or utcnow(),
        ends_at=body.ends_at,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _out(db, c, ngo)


@router.get("", response_model=list[ContestOut])
def list_contests(
    mine: bool = Query(default=False, description="NGOs: only the contests I published"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Contest).order_by(Contest.ends_at.desc())
    if mine:
        stmt = stmt.where(Contest.ngo_id == user.id)
    contests = db.scalars(stmt).all()
    for c in contests:
        finalize_if_due(db, c)
    order = {"live": 0, "upcoming": 1, "ended": 2}
    outs = [_out(db, c, user) for c in contests]
    return sorted(outs, key=lambda o: order[o.status])


@router.get("/{contest_id}", response_model=ContestOut)
def get_contest(contest_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _out(db, _get(db, contest_id), user)


# ---------------------------------------------------------------- citizen side
@router.post("/{contest_id}/start", response_model=StartResponse)
def start_contest(contest_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Begin the single attempt (or resume it). The clock starts now and cannot be restarted."""
    if user.role != "citizen":
        raise HTTPException(status_code=403, detail="Only citizens can play contests")
    c = _get(db, contest_id)
    now = utcnow()
    state = _status(c, now)
    if state == "upcoming":
        raise HTTPException(status_code=409, detail="This contest has not started yet")
    if state == "ended":
        raise HTTPException(status_code=409, detail="This contest has ended")

    entry = db.scalar(select(ContestEntry).where(ContestEntry.contest_id == c.id, ContestEntry.user_id == user.id))
    if entry is not None and entry.submitted_at is not None:
        raise HTTPException(status_code=409, detail="You have already played this contest")
    if entry is None:
        entry = ContestEntry(contest_id=c.id, user_id=user.id, started_at=now, total=len(_questions(c)))
        db.add(entry)
        db.commit()
        db.refresh(entry)

    deadline = min(entry.started_at + timedelta(seconds=c.time_limit_seconds), c.ends_at)
    return StartResponse(
        contest=_out(db, c, user),
        started_at=entry.started_at,
        deadline=deadline,
        questions=[PlayQuestion(id=i + 1, question=q["question"], options=q["options"]) for i, q in enumerate(_questions(c))],
    )


@router.post("/{contest_id}/submit", response_model=SubmitResponse)
def submit_contest(contest_id: int, body: SubmitBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = _get(db, contest_id)
    entry = db.scalar(select(ContestEntry).where(ContestEntry.contest_id == c.id, ContestEntry.user_id == user.id))
    if entry is None:
        raise HTTPException(status_code=409, detail="Start the contest first")
    if entry.submitted_at is not None:
        raise HTTPException(status_code=409, detail="You have already submitted this contest")
    if c.finalized_at is not None:
        raise HTTPException(status_code=409, detail="This contest has closed")
    questions = _questions(c)
    if len(body.answers) != len(questions):
        raise HTTPException(status_code=422, detail=f"Expected {len(questions)} answers")
    for ans, q in zip(body.answers, questions):
        if not -1 <= ans < len(q["options"]):  # -1 = left unanswered
            raise HTTPException(status_code=422, detail="Answer out of range")

    now = utcnow()
    duration = (now - entry.started_at).total_seconds()
    limit = min(c.time_limit_seconds, (c.ends_at - entry.started_at).total_seconds()) + GRACE_SECONDS
    timed_out = duration > limit
    score = 0 if timed_out else sum(1 for a, q in zip(body.answers, questions) if a == q["answer_index"])

    entry.submitted_at = now
    entry.duration_seconds = round(min(duration, c.time_limit_seconds), 2)
    entry.score = score
    entry.total = len(questions)
    entry.answers = json.dumps(body.answers)
    db.commit()

    note = "Time was up, so this attempt scored 0." if timed_out else "Answers locked in. Winners are announced when the contest closes."
    return SubmitResponse(score=score, total=len(questions), duration_seconds=entry.duration_seconds, timed_out=timed_out, note=note)


@router.get("/{contest_id}/leaderboard", response_model=LeaderboardResponse)
def leaderboard(contest_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = _get(db, contest_id)
    ranked = _submitted(db, c.id)
    rows = []
    for i, e in enumerate(ranked[:50], start=1):
        u = db.get(User, e.user_id)
        rows.append(
            LeaderRow(
                rank=e.rank or i, user_id=u.id, name=u.name, avatar_url=u.avatar_url, score=e.score or 0,
                total=e.total, duration_seconds=e.duration_seconds or 0, bonus_points=e.bonus_points, is_me=u.id == user.id,
            )
        )
    return LeaderboardResponse(contest=_out(db, c, user), rows=rows, prizes=RANK_PRIZES, participation_points=PARTICIPATION_POINTS)


@router.get("/{contest_id}/review", response_model=list[ReviewItem])
def review(contest_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Correct answers, only after the contest has ended (so nobody can pass them to players still in it)."""
    c = _get(db, contest_id)
    if _status(c, utcnow()) != "ended":
        raise HTTPException(status_code=409, detail="Answers are shown once the contest has ended")
    entry = db.scalar(select(ContestEntry).where(ContestEntry.contest_id == c.id, ContestEntry.user_id == user.id))
    if entry is None or entry.submitted_at is None:
        raise HTTPException(status_code=404, detail="You did not play this contest")
    given = json.loads(entry.answers or "[]")
    out = []
    for i, q in enumerate(_questions(c)):
        a = given[i] if i < len(given) else -1
        out.append(
            ReviewItem(
                question=q["question"], options=q["options"], your_answer=None if a < 0 else a,
                correct_index=q["answer_index"], correct=a == q["answer_index"], explanation=q.get("explanation", ""),
            )
        )
    return out
