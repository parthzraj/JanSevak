"""Civic Academy: NGOs publish courses, citizens learn, the server verifies, certificates are issued.

How a course is verified (nothing here trusts the browser):
  * video     the player reports its position every few seconds; the server credits only ground that was really
              covered at normal speed (no seeking ahead, no spamming) and needs 90% of the video before it lets
              the lesson be completed
  * reading   needs a minimum time on the page (~60% of normal reading time)
  * task      physical or online, the learner uploads a photo / link / text as proof and the NGO approves or
              sends it back with feedback
Lessons are strictly sequential. Only when every lesson is done is the certificate issued and the points paid
(+60, outside the daily cap, at most MAX_COURSE_REWARDS_PER_WEEK paid courses per person per week).
"""
import math
import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db, utcnow
from app.core.security import get_current_user, get_optional_user, require_ngo
from app.models.academy import Course, Enrollment, Lesson, LessonProgress
from app.models.user import User
from app.routers.campaigns import person
from app.schemas.academy import (
    CertificateOut,
    CourseCreate,
    CourseDetail,
    CourseList,
    CourseOut,
    CourseUpdate,
    EnrollmentOut,
    HeartbeatBody,
    LessonIn,
    LessonOut,
    ProgressOut,
    ReviewDecision,
    ReviewItem,
    ReviewResult,
    SubmitBody,
)
from app.services.notifications import notify
from app.services.points_engine import (
    MAX_COURSE_REWARDS_PER_WEEK,
    POINTS,
    award_points,
    course_rewards_this_week,
)
from app.services.video import parse_video_url

router = APIRouter(prefix="/academy", tags=["Civic Academy"])

WATCH_FRACTION = 0.9
MAX_COURSES_PER_NGO = 30
MIN_LESSONS_TO_PUBLISH = 2
MIN_MINUTES_TO_PUBLISH = 5
TASK_ESTIMATE_SECONDS = 600
POINTS_PER_COURSE = POINTS["course_complete"]


# ------------------------------------------------------------------ lesson maths
def _words(text: str | None) -> int:
    return len((text or "").split())


def read_seconds(lesson: Lesson) -> int:
    """Minimum time that must be spent on a reading lesson (about 60% of a normal reading pace)."""
    return max(10, min(300, round(_words(lesson.body) * 0.144)))


def required_seconds(lesson: Lesson) -> int:
    if lesson.kind == "video":
        return math.ceil((lesson.duration_seconds or 0) * WATCH_FRACTION)
    if lesson.kind == "reading":
        return read_seconds(lesson)
    return 0


def estimate_seconds(lesson: Lesson) -> int:
    if lesson.kind == "video":
        return lesson.duration_seconds or 0
    if lesson.kind == "reading":
        return round(_words(lesson.body) / 200 * 60)
    return TASK_ESTIMATE_SECONDS


def estimated_minutes(course: Course) -> int:
    return max(1, math.ceil(sum(estimate_seconds(l) for l in course.lessons) / 60))


def course_status(c: Course) -> str:
    if c.archived_at:
        return "Archived"
    return "Published" if c.published_at else "Draft"


# ------------------------------------------------------------------ progress maths
def _states(course: Course, progress: dict[int, LessonProgress]) -> dict[int, str]:
    out: dict[int, str] = {}
    prev_done = True
    for l in course.lessons:
        p = progress.get(l.id)
        if p is not None:
            state = p.status
        else:
            state = "available" if prev_done else "locked"
        out[l.id] = state
        prev_done = state == "done"
    return out


def _fraction(l: Lesson, p: LessonProgress | None) -> float:
    if p is None:
        return 0.0
    if p.status == "done":
        return 1.0
    if l.kind == "video":
        req = required_seconds(l)
        return min(0.95, p.watched_seconds / req) if req else 0.0
    if l.kind == "task" and p.status == "submitted":
        return 0.5
    return 0.0


def _lesson_percent(l: Lesson, p: LessonProgress | None) -> int:
    return int(round(_fraction(l, p) * 100))


def _enrollment_out(course: Course, enr: Enrollment, progress: dict[int, LessonProgress]) -> EnrollmentOut:
    n = len(course.lessons) or 1
    total = sum(_fraction(l, progress.get(l.id)) for l in course.lessons)
    percent = 100 if enr.completed_at else min(99, int(total * 100 / n))
    states = _states(course, progress)
    next_id = next((l.id for l in course.lessons if states[l.id] != "done"), None)
    return EnrollmentOut(
        percent=percent,
        completed=enr.completed_at is not None,
        completed_at=enr.completed_at,
        certificate_code=enr.certificate_code,
        points_awarded=enr.points_awarded,
        next_lesson_id=None if enr.completed_at else next_id,
        enrolled_at=enr.enrolled_at,
    )


def _progress_of(db: Session, enrollment_id: int) -> dict[int, LessonProgress]:
    rows = db.scalars(select(LessonProgress).where(LessonProgress.enrollment_id == enrollment_id)).unique().all()
    return {p.lesson_id: p for p in rows}


# ------------------------------------------------------------------ builders
def _can_manage(user: User | None, c: Course) -> bool:
    return user is not None and (user.id == c.ngo_id or user.role == "admin")


def _get_course(db: Session, cid: int) -> Course:
    c = db.get(Course, cid)
    if c is None:
        raise HTTPException(404, "Course not found")
    return c


def _enrollment_for(db: Session, cid: int, uid: int) -> Enrollment | None:
    return db.scalar(select(Enrollment).where(Enrollment.course_id == cid, Enrollment.user_id == uid))


def _lesson_out(l: Lesson, *, content: bool, state: str | None, p: LessonProgress | None) -> LessonOut:
    kind_ref = (None, None)
    if content and l.kind == "video" and l.video_url:
        kind_ref = parse_video_url(l.video_url)
    return LessonOut(
        id=l.id,
        position=l.position,
        kind=l.kind,
        title=l.title,
        summary=l.summary,
        duration_seconds=l.duration_seconds,
        task_mode=l.task_mode,
        instructions=l.instructions,
        proof_type=l.proof_type,
        required_seconds=required_seconds(l),
        video_kind=kind_ref[0],
        video_ref=kind_ref[1],
        body=l.body if content and l.kind == "reading" else None,
        state=state,
        percent=_lesson_percent(l, p),
        watched_seconds=int(p.watched_seconds) if p else 0,
        resume_seconds=int(p.max_position) if p and l.kind == "video" and p.status != "done" else 0,
        proof_text=p.proof_text if p else None,
        proof_url=p.proof_url if p else None,
        feedback=p.feedback if p else None,
        attempts=p.attempts if p else 0,
    )


def _course_outs(db: Session, courses: list[Course], viewer: User | None) -> list[CourseOut]:
    ids = [c.id for c in courses]
    enrolled: dict[int, int] = {}
    completed: dict[int, int] = {}
    mine: dict[int, Enrollment] = {}
    progress_by_enr: dict[int, dict[int, LessonProgress]] = {}
    pending: dict[int, int] = {}
    if ids:
        for cid, n, done in db.execute(
            select(Enrollment.course_id, func.count(Enrollment.id), func.count(Enrollment.completed_at))
            .where(Enrollment.course_id.in_(ids))
            .group_by(Enrollment.course_id)
        ).all():
            enrolled[cid], completed[cid] = n, done
        if viewer is not None:
            for e in db.scalars(select(Enrollment).where(Enrollment.user_id == viewer.id, Enrollment.course_id.in_(ids))).unique():
                mine[e.course_id] = e
            if mine:
                for p in db.scalars(select(LessonProgress).where(LessonProgress.enrollment_id.in_([e.id for e in mine.values()]))).unique():
                    progress_by_enr.setdefault(p.enrollment_id, {})[p.lesson_id] = p
            owned = [c.id for c in courses if _can_manage(viewer, c)]
            if owned:
                for cid, n in db.execute(
                    select(Lesson.course_id, func.count(LessonProgress.id))
                    .join(Lesson, Lesson.id == LessonProgress.lesson_id)
                    .where(Lesson.course_id.in_(owned), LessonProgress.status == "submitted")
                    .group_by(Lesson.course_id)
                ).all():
                    pending[cid] = n
    outs = []
    for c in courses:
        enr = mine.get(c.id)
        outs.append(
            CourseOut(
                id=c.id,
                title=c.title,
                summary=c.summary,
                level=c.level,
                category=c.category,
                ngo=person(c.ngo),
                status=course_status(c),
                lessons_count=len(c.lessons),
                video_count=sum(1 for l in c.lessons if l.kind == "video"),
                reading_count=sum(1 for l in c.lessons if l.kind == "reading"),
                task_count=sum(1 for l in c.lessons if l.kind == "task"),
                estimated_minutes=estimated_minutes(c),
                enrolled_count=enrolled.get(c.id, 0),
                completed_count=completed.get(c.id, 0),
                points=POINTS_PER_COURSE,
                is_owner=_can_manage(viewer, c),
                my=_enrollment_out(c, enr, progress_by_enr.get(enr.id, {})) if enr else None,
                pending_reviews=pending.get(c.id, 0),
                created_at=c.created_at,
                published_at=c.published_at,
            )
        )
    return outs


def _detail(db: Session, c: Course, viewer: User | None) -> CourseDetail:
    base = _course_outs(db, [c], viewer)[0]
    owner = _can_manage(viewer, c)
    enr = _enrollment_for(db, c.id, viewer.id) if viewer is not None else None
    progress = _progress_of(db, enr.id) if enr else {}
    states = _states(c, progress) if enr else {}
    lessons = [
        _lesson_out(
            l,
            content=owner or (enr is not None and states.get(l.id) not in (None, "locked")),
            state=states.get(l.id) if enr else None,
            p=progress.get(l.id),
        )
        for l in c.lessons
    ]
    return CourseDetail(**base.model_dump(), description=c.description, lessons=lessons)


def _visible_or_404(db: Session, c: Course, viewer: User | None) -> None:
    if _can_manage(viewer, c):
        return
    if c.published_at is None:
        raise HTTPException(404, "Course not found")
    if c.archived_at is not None:
        if viewer is None or _enrollment_for(db, c.id, viewer.id) is None:
            raise HTTPException(404, "Course not found")


# ------------------------------------------------------------------ authoring
def _check_publishable(lessons: list) -> None:
    if len(lessons) < MIN_LESSONS_TO_PUBLISH:
        raise HTTPException(422, f"A published course needs at least {MIN_LESSONS_TO_PUBLISH} lessons")
    secs = 0
    for l in lessons:
        kind = l["kind"] if isinstance(l, dict) else l.kind
        if kind == "video":
            secs += (l["duration_seconds"] if isinstance(l, dict) else l.duration_seconds) or 0
        elif kind == "reading":
            secs += round(_words(l["body"] if isinstance(l, dict) else l.body) / 200 * 60)
        else:
            secs += TASK_ESTIMATE_SECONDS
    if secs < MIN_MINUTES_TO_PUBLISH * 60:
        raise HTTPException(422, f"A published course should take at least {MIN_MINUTES_TO_PUBLISH} minutes to complete")


def _make_lessons(items: list[LessonIn]) -> list[Lesson]:
    return [
        Lesson(
            position=i,
            kind=x.kind,
            title=x.title.strip(),
            summary=x.summary.strip(),
            video_url=x.video_url.strip() if x.video_url else None,
            duration_seconds=x.duration_seconds,
            body=x.body.strip() if x.body else None,
            task_mode=x.task_mode,
            instructions=x.instructions.strip() if x.instructions else None,
            proof_type=x.proof_type,
        )
        for i, x in enumerate(items, start=1)
    ]


@router.post("/courses", response_model=CourseDetail, status_code=201)
def create_course(body: CourseCreate, user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    owned = db.scalar(select(func.count(Course.id)).where(Course.ngo_id == user.id, Course.archived_at.is_(None))) or 0
    if owned >= MAX_COURSES_PER_NGO:
        raise HTTPException(409, f"You already have {MAX_COURSES_PER_NGO} active courses. Archive one first.")
    if body.publish:
        _check_publishable(body.lessons)
    c = Course(
        ngo_id=user.id,
        title=body.title.strip(),
        summary=body.summary.strip(),
        description=body.description.strip(),
        level=body.level,
        category=body.category,
        published_at=utcnow() if body.publish else None,
    )
    c.lessons = _make_lessons(body.lessons)
    db.add(c)
    db.commit()
    db.refresh(c)
    return _detail(db, c, user)


@router.patch("/courses/{cid}", response_model=CourseDetail)
def update_course(cid: int, body: CourseUpdate, user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    c = _get_course(db, cid)
    if not _can_manage(user, c):
        raise HTTPException(403, "Only the NGO that created this course can change it")
    data = body.model_dump(exclude_unset=True)
    lessons = data.pop("lessons", None)
    if lessons is not None:
        if db.scalar(select(func.count(Enrollment.id)).where(Enrollment.course_id == c.id)):
            raise HTTPException(409, "People have already enrolled, so the lessons are locked. Archive this course and publish a new version.")
        if c.published_at is not None:
            _check_publishable(lessons)
        c.lessons = _make_lessons([LessonIn(**x) for x in lessons])
    for k, v in data.items():
        if v is not None:
            setattr(c, k, v.strip() if isinstance(v, str) else v)
    db.commit()
    db.refresh(c)
    return _detail(db, c, user)


@router.post("/courses/{cid}/publish", response_model=CourseDetail)
def publish_course(cid: int, user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    c = _get_course(db, cid)
    if not _can_manage(user, c):
        raise HTTPException(403, "Only the NGO that created this course can publish it")
    _check_publishable(c.lessons)
    c.published_at = c.published_at or utcnow()
    c.archived_at = None
    db.commit()
    return _detail(db, c, user)


@router.post("/courses/{cid}/archive", response_model=CourseDetail)
def archive_course(cid: int, user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    c = _get_course(db, cid)
    if not _can_manage(user, c):
        raise HTTPException(403, "Only the NGO that created this course can archive it")
    if c.published_at is None:
        raise HTTPException(409, "A draft cannot be archived. Delete it instead.")
    c.archived_at = c.archived_at or utcnow()
    db.commit()
    return _detail(db, c, user)


@router.delete("/courses/{cid}", status_code=204)
def delete_course(cid: int, user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    c = _get_course(db, cid)
    if not _can_manage(user, c):
        raise HTTPException(403, "Only the NGO that created this course can delete it")
    if db.scalar(select(func.count(Enrollment.id)).where(Enrollment.course_id == c.id)):
        raise HTTPException(409, "People are enrolled in this course. Archive it instead.")
    db.delete(c)
    db.commit()


# ------------------------------------------------------------------ browsing
@router.get("/courses", response_model=CourseList)
def list_courses(
    mine: bool = Query(False, description="NGO: every course I authored, drafts included"),
    enrolled: bool = Query(False, description="Only courses I enrolled in"),
    q: str | None = Query(None, max_length=80),
    category: str | None = None,
    level: str | None = None,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    if (mine or enrolled) and viewer is None:
        raise HTTPException(401, "Sign in first")
    stmt = select(Course)
    if mine:
        stmt = stmt.where(Course.ngo_id == viewer.id)
    elif enrolled:
        stmt = stmt.where(Course.id.in_(select(Enrollment.course_id).where(Enrollment.user_id == viewer.id)))
    else:
        stmt = stmt.where(Course.published_at.is_not(None), Course.archived_at.is_(None))
    if category:
        stmt = stmt.where(Course.category == category)
    if level:
        stmt = stmt.where(Course.level == level)
    if q and q.strip():
        like = f"%{q.strip()}%"
        stmt = stmt.where(Course.title.ilike(like) | Course.summary.ilike(like))
    rows = db.scalars(stmt.order_by(Course.created_at.desc(), Course.id.desc())).unique().all()
    return CourseList(items=_course_outs(db, list(rows), viewer), total=len(rows))


@router.get("/courses/{cid}", response_model=CourseDetail)
def course_detail(cid: int, db: Session = Depends(get_db), viewer: User | None = Depends(get_optional_user)):
    c = _get_course(db, cid)
    _visible_or_404(db, c, viewer)
    return _detail(db, c, viewer)


# ------------------------------------------------------------------ learning
@router.post("/courses/{cid}/enroll", response_model=CourseDetail, status_code=201)
def enroll(cid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = _get_course(db, cid)
    if user.role in ("ngo", "admin"):
        raise HTTPException(403, "NGO accounts publish courses; sign in as a citizen to take one")
    if c.published_at is None or c.archived_at is not None:
        raise HTTPException(404, "Course not found")
    if _enrollment_for(db, c.id, user.id) is not None:
        raise HTTPException(409, "You are already enrolled in this course")
    db.add(Enrollment(course_id=c.id, user_id=user.id))
    notify(db, c.ngo_id, "New learner", f"{user.name} enrolled in '{c.title}'.", "event")
    db.commit()
    return _detail(db, c, user)


def _context(db: Session, cid: int, lid: int, user: User):
    c = _get_course(db, cid)
    lesson = next((l for l in c.lessons if l.id == lid), None)
    if lesson is None:
        raise HTTPException(404, "Lesson not found")
    enr = _enrollment_for(db, c.id, user.id)
    if enr is None:
        raise HTTPException(403, "Enroll in this course first")
    progress = _progress_of(db, enr.id)
    if _states(c, progress)[lesson.id] == "locked":
        raise HTTPException(409, "Finish the previous lesson first")
    return c, lesson, enr, progress


def _progress_out(db: Session, c: Course, lesson: Lesson, enr: Enrollment, user: User, notes: list[str] | None = None) -> ProgressOut:
    progress = _progress_of(db, enr.id)
    states = _states(c, progress)
    return ProgressOut(
        lesson=_lesson_out(lesson, content=True, state=states[lesson.id], p=progress.get(lesson.id)),
        enrollment=_enrollment_out(c, enr, progress),
        certificate=_certificate(db, enr) if enr.completed_at else None,
        notes=notes or [],
    )


def _gate(lesson: Lesson, kinds: tuple[str, ...]) -> None:
    if lesson.kind not in kinds:
        raise HTTPException(400, f"This is a {lesson.kind} lesson")


@router.post("/courses/{cid}/lessons/{lid}/open", response_model=ProgressOut)
def open_lesson(cid: int, lid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c, lesson, enr, progress = _context(db, cid, lid, user)
    p = progress.get(lesson.id)
    now = utcnow()
    if p is None:
        p = LessonProgress(enrollment_id=enr.id, lesson_id=lesson.id, status="in_progress", started_at=now)
        db.add(p)
    if p.status != "done":
        if lesson.kind == "reading":
            p.last_heartbeat_at = now  # the reading clock restarts every time the page is opened
        elif lesson.kind == "video":
            p.session_started_at, p.session_credit = None, 0.0  # every viewing starts a fresh clock
    db.commit()
    return _progress_out(db, c, lesson, enr, user)


@router.post("/courses/{cid}/lessons/{lid}/heartbeat", response_model=ProgressOut)
def heartbeat(cid: int, lid: int, body: HeartbeatBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c, lesson, enr, progress = _context(db, cid, lid, user)
    _gate(lesson, ("video",))
    p = progress.get(lesson.id)
    if p is None:
        raise HTTPException(409, "Open the lesson first")
    if p.status != "done":
        now = utcnow()
        dur = float(lesson.duration_seconds or 0)
        pos = min(body.position, dur)
        if p.session_started_at is None:
            # first beat of a viewing: starts the clock, credits nothing
            p.session_started_at, p.session_credit = now, 0.0
        else:
            # Credit only ground beyond the furthest second already watched, and never more than the real time
            # that has passed in this viewing (x1.1 + 2s of slack). Skipping ahead therefore cannot earn more
            # than real time, a late or jittery beat loses nothing, and beats sent in a burst earn nothing extra.
            elapsed = (now - p.session_started_at).total_seconds()
            budget = elapsed * 1.1 + 2.0 - p.session_credit
            credit = max(0.0, min(pos - p.max_position, budget))
            if credit > 0:
                p.watched_seconds = min(dur, p.watched_seconds + credit)
                p.session_credit += credit
            p.max_position = max(p.max_position, pos)
        p.last_position, p.last_heartbeat_at = pos, now
        db.commit()
    return _progress_out(db, c, lesson, enr, user)


def _certificate(db: Session, enr: Enrollment) -> CertificateOut:
    c = enr.course
    done_tasks = db.scalar(
        select(func.count(LessonProgress.id))
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .where(LessonProgress.enrollment_id == enr.id, LessonProgress.status == "done", Lesson.kind == "task")
    ) or 0
    return CertificateOut(
        code=enr.certificate_code or "",
        course_id=c.id,
        course_title=c.title,
        level=c.level,
        category=c.category,
        issuer=person(c.ngo),
        learner_name=enr.user.name,
        completed_at=enr.completed_at,
        lessons_count=len(c.lessons),
        tasks_verified=int(done_tasks),
        points_awarded=enr.points_awarded,
    )


def _new_code(db: Session, c: Course, learner: User) -> str:
    while True:
        code = f"JS-{c.id:03d}-{learner.id:04d}-{secrets.token_hex(2).upper()}"
        if db.scalar(select(Enrollment.id).where(Enrollment.certificate_code == code)) is None:
            return code


def _maybe_complete(db: Session, c: Course, enr: Enrollment, learner: User) -> list[str]:
    """Issue the certificate and pay the points once every lesson is done. Idempotent."""
    if enr.completed_at is not None:
        return []
    progress = _progress_of(db, enr.id)
    if not c.lessons or any(progress.get(l.id) is None or progress[l.id].status != "done" for l in c.lessons):
        return []
    notes: list[str] = []
    enr.completed_at = utcnow()
    enr.certificate_code = _new_code(db, c, learner)
    if course_rewards_this_week(db, learner.id) >= MAX_COURSE_REWARDS_PER_WEEK:
        notes.append("Certificate issued. You already earned points for 2 courses this week, so no points this time.")
        notify(db, learner.id, "Certificate issued", f"You completed '{c.title}'. Weekly course-point limit reached.", "event")
    else:
        res = award_points(db, learner, "course_complete", c.id, description=f"Course: {c.title[:60]}", respect_cap=False)
        enr.points_awarded = res.awarded
        if res.awarded:
            notify(db, learner.id, "Course completed", f"You earned {res.awarded} points and a certificate for '{c.title}'.", "reward")
    notify(db, c.ngo_id, "Course completed", f"{learner.name} completed '{c.title}'.", "event")
    return notes


@router.post("/courses/{cid}/lessons/{lid}/complete", response_model=ProgressOut)
def complete_lesson(cid: int, lid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c, lesson, enr, progress = _context(db, cid, lid, user)
    _gate(lesson, ("video", "reading"))
    p = progress.get(lesson.id)
    if p is None:
        raise HTTPException(409, "Open the lesson first")
    notes: list[str] = []
    if p.status != "done":
        if lesson.kind == "video":
            need = required_seconds(lesson)
            if p.watched_seconds < need:
                pct = int(p.watched_seconds * 100 / max(1, lesson.duration_seconds or 1))
                raise HTTPException(409, f"You have watched {pct}% of this video. Watch at least {int(WATCH_FRACTION * 100)}% to continue.")
        else:
            waited = (utcnow() - p.last_heartbeat_at).total_seconds() if p.last_heartbeat_at else 0
            need = read_seconds(lesson)
            if waited < need:
                raise HTTPException(409, f"Take your time: stay on this page for {math.ceil(need - waited)} more seconds.")
        p.status, p.completed_at = "done", utcnow()
        notes = _maybe_complete(db, c, enr, user)
        db.commit()
        db.refresh(enr)
    return _progress_out(db, c, lesson, enr, user, notes)


def _photo_exists(url: str) -> bool:
    name = url.removeprefix("/uploads/").split("?")[0]
    return bool(name) and "/" not in name and ".." not in name and (Path(settings.UPLOAD_DIR) / name).is_file()


@router.post("/courses/{cid}/lessons/{lid}/submit", response_model=ProgressOut)
def submit_task(cid: int, lid: int, body: SubmitBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c, lesson, enr, progress = _context(db, cid, lid, user)
    _gate(lesson, ("task",))
    p = progress.get(lesson.id)
    if p is not None and p.status == "done":
        raise HTTPException(409, "This task is already approved")
    if p is not None and p.status == "submitted":
        raise HTTPException(409, "Your proof is waiting for the NGO's review")
    if lesson.proof_type == "photo":
        if not body.proof_url or not body.proof_url.startswith("/uploads/") or not _photo_exists(body.proof_url):
            raise HTTPException(422, "Upload a photo as proof")
    elif lesson.proof_type == "link":
        if not body.proof_url or not body.proof_url.lower().startswith(("http://", "https://")):
            raise HTTPException(422, "Paste a link (starting with https://) as proof")
    else:
        if len(body.proof_text or "") < 20:
            raise HTTPException(422, "Write at least 20 characters describing what you did")
    now = utcnow()
    if p is None:
        p = LessonProgress(enrollment_id=enr.id, lesson_id=lesson.id, started_at=now)
        db.add(p)
    p.status, p.proof_text, p.proof_url = "submitted", body.proof_text, body.proof_url
    p.attempts = (p.attempts or 0) + 1
    p.submitted_at, p.feedback, p.reviewed_at = now, None, None
    notify(db, c.ngo_id, "Task to review", f"{user.name} submitted proof for '{lesson.title}' in '{c.title}'.", "event")
    db.commit()
    return _progress_out(db, c, lesson, enr, user)


# ------------------------------------------------------------------ NGO review queue
def _review_item(p: LessonProgress, c: Course) -> ReviewItem:
    l = p.lesson
    return ReviewItem(
        id=p.id,
        course_id=c.id,
        course_title=c.title,
        lesson_id=l.id,
        lesson_title=l.title,
        task_mode=l.task_mode,
        instructions=l.instructions,
        proof_type=l.proof_type,
        learner=person(p.enrollment.user),
        proof_text=p.proof_text,
        proof_url=p.proof_url,
        attempts=p.attempts,
        status=p.status,
        feedback=p.feedback,
        submitted_at=p.submitted_at,
    )


@router.get("/submissions", response_model=list[ReviewItem])
def review_queue(
    status: str = Query("submitted", pattern="^(submitted|rejected|done|all)$"),
    course_id: int | None = None,
    user: User = Depends(require_ngo),
    db: Session = Depends(get_db),
):
    stmt = (
        select(LessonProgress, Course)
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .join(Course, Course.id == Lesson.course_id)
        .where(Lesson.kind == "task", LessonProgress.attempts > 0)
    )
    if user.role != "admin":
        stmt = stmt.where(Course.ngo_id == user.id)
    if course_id is not None:
        stmt = stmt.where(Course.id == course_id)
    if status != "all":
        stmt = stmt.where(LessonProgress.status == status)
    rows = db.execute(stmt.order_by(LessonProgress.submitted_at.asc().nulls_last(), LessonProgress.id.asc()).limit(200)).unique().all()
    return [_review_item(p, c) for p, c in rows]


@router.patch("/submissions/{pid}", response_model=ReviewResult)
def review_submission(pid: int, body: ReviewDecision, user: User = Depends(require_ngo), db: Session = Depends(get_db)):
    p = db.get(LessonProgress, pid)
    if p is None:
        raise HTTPException(404, "Submission not found")
    c = _get_course(db, p.lesson.course_id)
    if not _can_manage(user, c):
        raise HTTPException(403, "This task belongs to another NGO's course")
    if p.status != "submitted":
        raise HTTPException(409, "This submission was already reviewed")
    enr = p.enrollment
    learner = enr.user
    p.reviewed_at = utcnow()
    completed = False
    if body.decision == "approve":
        p.status, p.completed_at, p.feedback = "done", utcnow(), (body.feedback or "").strip() or None
        notify(db, learner.id, "Task approved", f"'{p.lesson.title}' in '{c.title}' was approved.", "event")
        _maybe_complete(db, c, enr, learner)
        completed = enr.completed_at is not None
    else:
        p.status, p.feedback = "rejected", body.feedback.strip()
        notify(db, learner.id, "Task needs changes", f"'{p.lesson.title}' in '{c.title}': {p.feedback}", "event")
    db.commit()
    return ReviewResult(item=_review_item(p, c), course_completed=completed)


# ------------------------------------------------------------------ certificates
@router.get("/certificates/mine", response_model=list[CertificateOut])
def my_certificates(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.completed_at.is_not(None)).order_by(Enrollment.completed_at.desc())
    ).unique().all()
    return [_certificate(db, e) for e in rows]


@router.get("/certificates/{code}", response_model=CertificateOut)
def verify_certificate(code: str, db: Session = Depends(get_db)):
    """Public: anyone holding a certificate code can check it is genuine."""
    enr = db.scalar(select(Enrollment).where(Enrollment.certificate_code == code.strip().upper()))
    if enr is None or enr.completed_at is None:
        raise HTTPException(404, "No certificate with this code")
    return _certificate(db, enr)
