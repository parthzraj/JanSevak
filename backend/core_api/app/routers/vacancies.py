"""NGO volunteering: NGOs post roles, citizens apply, NGOs accept / reject and finally mark the work completed.

Completing an accepted application pays +40 points (outside the daily cap, but limited to
MAX_VOLUNTEER_REWARDS_PER_WEEK paid volunteering rewards per person per 7 days).
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db, utcnow
from app.core.security import get_current_user, get_optional_user, require_ngo
from app.models.user import User
from app.models.volunteer import Vacancy, VacancyApplication
from app.routers.campaigns import person
from app.schemas.volunteer import (
    ApplicationDecision,
    ApplicationOut,
    ApplyBody,
    MyApplicationOut,
    VacancyCreate,
    VacancyList,
    VacancyOut,
)
from app.services.notifications import notify
from app.services.points_engine import MAX_VOLUNTEER_REWARDS_PER_WEEK, award_points, volunteer_rewards_this_week

router = APIRouter(prefix="/vacancies", tags=["NGO volunteering"])

MAX_OPEN_PER_NGO = 20
ACTIVE = ("Applied", "Accepted", "Completed")


def _is_open(v: Vacancy) -> bool:
    return v.closed_at is None and (v.deadline is None or v.deadline > utcnow())


def _get_or_404(db: Session, vid: int) -> Vacancy:
    v = db.get(Vacancy, vid)
    if v is None:
        raise HTTPException(404, "Vacancy not found")
    return v


def _out(db: Session, rows: list[Vacancy], viewer: User | None) -> list[VacancyOut]:
    ids = [v.id for v in rows]
    applicants: dict[int, int] = {}
    accepted: dict[int, int] = {}
    mine: dict[int, str] = {}
    if ids:
        for vid, st, n in db.execute(
            select(VacancyApplication.vacancy_id, VacancyApplication.status, func.count(VacancyApplication.id))
            .where(VacancyApplication.vacancy_id.in_(ids), VacancyApplication.status != "Withdrawn")
            .group_by(VacancyApplication.vacancy_id, VacancyApplication.status)
        ).all():
            applicants[vid] = applicants.get(vid, 0) + n
            if st in ("Accepted", "Completed"):
                accepted[vid] = accepted.get(vid, 0) + n
        if viewer is not None:
            mine = dict(
                db.execute(
                    select(VacancyApplication.vacancy_id, VacancyApplication.status).where(
                        VacancyApplication.user_id == viewer.id, VacancyApplication.vacancy_id.in_(ids)
                    )
                ).all()
            )
    return [
        VacancyOut(
            id=v.id,
            title=v.title,
            role_type=v.role_type,
            description=v.description,
            location=v.location,
            commitment=v.commitment,
            skills=v.skills,
            slots=v.slots,
            accepted_count=accepted.get(v.id, 0),
            applicants_count=applicants.get(v.id, 0),
            deadline=v.deadline,
            is_open=_is_open(v),
            ngo=person(v.ngo),
            is_owner=viewer is not None and viewer.id == v.ngo_id,
            my_application=mine.get(v.id),
            created_at=v.created_at,
        )
        for v in rows
    ]


@router.get("", response_model=VacancyList)
def list_vacancies(
    mine: bool = Query(False, description="NGO: only the vacancies I posted"),
    include_closed: bool = False,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    q = select(Vacancy)
    if mine:
        if viewer is None:
            raise HTTPException(401, "Sign in first")
        q = q.where(Vacancy.ngo_id == viewer.id)
    rows = db.scalars(q.order_by(Vacancy.created_at.desc(), Vacancy.id.desc())).unique().all()
    if not include_closed:
        rows = [v for v in rows if _is_open(v)]
    return VacancyList(items=_out(db, rows, viewer), total=len(rows))


@router.get("/applications/mine", response_model=list[MyApplicationOut])
def my_applications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    apps = db.scalars(
        select(VacancyApplication)
        .where(VacancyApplication.user_id == user.id)
        .order_by(VacancyApplication.created_at.desc())
    ).unique().all()
    vacancies = {v.id: v for v in db.scalars(select(Vacancy).where(Vacancy.id.in_([a.vacancy_id for a in apps] or [0]))).unique()}
    outs = {o.id: o for o in _out(db, list(vacancies.values()), user)}
    return [
        MyApplicationOut(id=a.id, status=a.status, points_awarded=a.points_awarded, vacancy=outs[a.vacancy_id])
        for a in apps
        if a.vacancy_id in outs
    ]


@router.post("", response_model=VacancyOut, status_code=201)
def create_vacancy(body: VacancyCreate, ngo: User = Depends(require_ngo), db: Session = Depends(get_db)):
    if body.deadline is not None and body.deadline <= utcnow():
        raise HTTPException(422, "The deadline must be in the future")
    open_now = [v for v in db.scalars(select(Vacancy).where(Vacancy.ngo_id == ngo.id)).unique() if _is_open(v)]
    if len(open_now) >= MAX_OPEN_PER_NGO:
        raise HTTPException(409, f"You already have {MAX_OPEN_PER_NGO} open vacancies. Close some first.")
    v = Vacancy(ngo_id=ngo.id, **body.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return _out(db, [v], ngo)[0]


@router.post("/{vacancy_id}/close", response_model=VacancyOut)
def close_vacancy(vacancy_id: int, ngo: User = Depends(require_ngo), db: Session = Depends(get_db)):
    v = _get_or_404(db, vacancy_id)
    if v.ngo_id != ngo.id and ngo.role != "admin":
        raise HTTPException(403, "This is not your vacancy")
    if v.closed_at is None:
        v.closed_at = utcnow()
        db.commit()
        db.refresh(v)
    return _out(db, [v], ngo)[0]


@router.post("/{vacancy_id}/apply", response_model=VacancyOut)
def apply(vacancy_id: int, body: ApplyBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    v = _get_or_404(db, vacancy_id)
    if user.role == "ngo":
        raise HTTPException(403, "NGO accounts post vacancies; use a citizen account to apply")
    if not _is_open(v):
        raise HTTPException(409, "This vacancy is closed")
    existing = db.scalar(
        select(VacancyApplication).where(VacancyApplication.vacancy_id == v.id, VacancyApplication.user_id == user.id)
    )
    if existing is not None and existing.status != "Withdrawn":
        raise HTTPException(409, f"You already applied ({existing.status.lower()})")
    if existing is not None:  # re-applying after withdrawing
        existing.status, existing.note = "Applied", body.note
    else:
        db.add(VacancyApplication(vacancy_id=v.id, user_id=user.id, note=body.note))
    notify(db, v.ngo_id, "New applicant", f"{user.name} applied for '{v.title}'.", "vacancy")
    db.commit()
    return _out(db, [v], user)[0]


@router.delete("/{vacancy_id}/apply", response_model=VacancyOut)
def withdraw(vacancy_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    v = _get_or_404(db, vacancy_id)
    a = db.scalar(
        select(VacancyApplication).where(VacancyApplication.vacancy_id == v.id, VacancyApplication.user_id == user.id)
    )
    if a is None or a.status == "Withdrawn":
        raise HTTPException(404, "You have no application for this vacancy")
    if a.status != "Applied":
        raise HTTPException(409, f"Your application is already {a.status.lower()}; contact the NGO to change it")
    a.status = "Withdrawn"
    db.commit()
    return _out(db, [v], user)[0]


@router.get("/{vacancy_id}/applications", response_model=list[ApplicationOut])
def applications(vacancy_id: int, ngo: User = Depends(require_ngo), db: Session = Depends(get_db)):
    v = _get_or_404(db, vacancy_id)
    if v.ngo_id != ngo.id and ngo.role != "admin":
        raise HTTPException(403, "This is not your vacancy")
    rows = db.scalars(
        select(VacancyApplication)
        .where(VacancyApplication.vacancy_id == v.id, VacancyApplication.status != "Withdrawn")
        .order_by(VacancyApplication.created_at)
    ).unique().all()
    return [
        ApplicationOut(
            id=a.id, vacancy_id=a.vacancy_id, applicant=person(a.user), note=a.note,
            status=a.status, points_awarded=a.points_awarded, created_at=a.created_at,
        )
        for a in rows
    ]


@router.patch("/{vacancy_id}/applications/{application_id}", response_model=ApplicationOut)
def decide(
    vacancy_id: int,
    application_id: int,
    body: ApplicationDecision,
    ngo: User = Depends(require_ngo),
    db: Session = Depends(get_db),
):
    v = _get_or_404(db, vacancy_id)
    if v.ngo_id != ngo.id and ngo.role != "admin":
        raise HTTPException(403, "This is not your vacancy")
    a = db.get(VacancyApplication, application_id)
    if a is None or a.vacancy_id != v.id or a.status == "Withdrawn":
        raise HTTPException(404, "Application not found")

    allowed = {"Applied": ("Accepted", "Rejected"), "Accepted": ("Completed", "Rejected")}
    if body.status not in allowed.get(a.status, ()):
        raise HTTPException(409, f"An application that is {a.status.lower()} cannot be marked {body.status.lower()}")
    if body.status == "Accepted":
        taken = db.scalar(
            select(func.count()).select_from(VacancyApplication).where(
                VacancyApplication.vacancy_id == v.id, VacancyApplication.status.in_(("Accepted", "Completed"))
            )
        ) or 0
        if taken >= v.slots:
            raise HTTPException(409, "All slots are already filled")

    a.status = body.status
    applicant = a.user
    if body.status == "Accepted":
        notify(db, applicant.id, "Application accepted", f"{v.ngo.name} accepted you for '{v.title}'.", "vacancy")
    elif body.status == "Rejected":
        notify(db, applicant.id, "Application update", f"{v.ngo.name} could not take your application for '{v.title}' this time.", "vacancy")
    else:
        if volunteer_rewards_this_week(db, applicant.id) >= MAX_VOLUNTEER_REWARDS_PER_WEEK:
            notify(db, applicant.id, "Volunteering completed", f"'{v.title}' was marked completed. Weekly point limit reached.", "vacancy")
        else:
            res = award_points(db, applicant, "vacancy_complete", a.id, description=f"NGO volunteering: {v.title[:60]}", respect_cap=False)
            a.points_awarded = res.awarded
            if res.awarded:
                notify(db, applicant.id, "Points earned", f"You earned {res.awarded} points for completing '{v.title}'.", "reward")
    db.commit()
    db.refresh(a)
    return ApplicationOut(
        id=a.id, vacancy_id=a.vacancy_id, applicant=person(a.user), note=a.note,
        status=a.status, points_awarded=a.points_awarded, created_at=a.created_at,
    )
