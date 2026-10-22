"""Load a rich, realistic demo dataset (about 15 people, 33 civic reports with photos, a points history, Civic Academy
courses with certificates, quiz contests, NGO vacancies and civic drives).

    python demo_data.py --reset     # wipe the database, then load the demo data (recommended)
    python demo_data.py             # only works on an EMPTY database

It writes straight to the database (like seed_data.py), but the rules of the app are respected: the daily 60-point cap,
the weekly limit on volunteering and course points, "one reward per action", prize ranks, and certificate codes.
No application code is changed. Real photos: run `python -m demo.fetch_photos` first (optional, see DEMO_DATA.md).

Demo logins, password for all: demo123
    ayush@example.com  priya@example.com  rahul@example.com   (the three main citizens, free to earn points today)
    meera@example.com  (ward champion)      official@example.com / official2@example.com (officials)
    ngo@example.com / ngo2@example.com (NGOs: courses, contests, drives, vacancies)
"""
from __future__ import annotations

import copy
import json
import random
import secrets
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import func, select  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.database import Base, SessionLocal, create_all_tables, engine, utcnow  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models import (  # noqa: E402
    Campaign, CampaignMember, CivicIssue, Contest, ContestEntry, Course, Enrollment, ImpactReaction, ImpactShare,
    IssueComment, IssueEvidence, IssueTimelineEvent, IssueVote, Lesson, LessonProgress, Notification, QuizAttempt,
    RewardTransaction, User, Vacancy, VacancyApplication,
)
from app.routers.campaigns import MAX_HOST_POINTS, _hours_credit  # noqa: E402
from app.routers.quizzes import _pass_mark  # noqa: E402
from app.services.points_engine import (  # noqa: E402
    MAX_COURSE_REWARDS_PER_WEEK, MAX_VOLUNTEER_REWARDS_PER_WEEK, POINTS, _local_tz, tier_for, today_bounds_utc,
)
from app.services.quiz_bank import QUIZ_BY_ID  # noqa: E402
from demo.content_courses import all_courses  # noqa: E402
from demo.content_people import CITIZENS, PASSWORD, PEOPLE  # noqa: E402
from demo.content_programs import APPLICATIONS, CONTESTS, DRIVES, VACANCIES  # noqa: E402
from demo.content_reports import AREAS, CITIZEN_COMMENTS, DEPT, OFFICIAL_COMMENTS, REPORTS, THANKS_COMMENTS  # noqa: E402
from demo.photos import photo_url, using_real_photos  # noqa: E402

rnd = random.Random(20261022)
NOW = utcnow()
TODAY_START = today_bounds_utc()[0]
MAIN3 = ("ayush", "priya", "rahul")  # kept clear of "today" so a live demo can still earn points
ATTEND = {"meera": 1.0, "priya": 1.0, "ananya": 0.9, "nikhil": 0.75, "karan": 0.5, "divya": 0.45, "sneha": 0.4, "lakshmi": 0.35,
          "imran": 0.3, "arjun": 0.3, "rahul": 0.25, "ayush": 0.45}
FORCED_SUPPORT = {"Pipeline leak at the Koramangala water tank junction": ["ayush", "priya"]}  # so the "stayed with it 30+ days" badge shows
QUIET = ("ayush", "priya", "rahul", "official")
ACTIVITY = {"meera": 1.0, "priya": 0.85, "ananya": 0.8, "ayush": 0.7, "nikhil": 0.6, "karan": 0.5, "divya": 0.4, "sneha": 0.4,
            "lakshmi": 0.35, "imran": 0.3, "arjun": 0.3, "rahul": 0.2, "tara": 0.12, "vikram": 0.1, "zoya": 0.15}


def ago(days: float = 0, hours: float = 0) -> datetime:
    return NOW - timedelta(days=days, hours=hours)


class Ledger:
    """Collects point events, then applies them in time order with the same rules the app enforces."""

    def __init__(self, db, users: dict[str, User]):
        self.db, self.users, self.events = db, users, []
        self.by_id = {u.id: k for k, u in users.items()}

    def add(self, key, action, action_id, points, desc, when, capped=True):
        self.events.append((when, key, action, str(action_id), points, desc, capped))

    def apply(self):
        used: dict[tuple[int, object], int] = defaultdict(int)
        tz = _local_tz()
        for when, key, action, action_id, points, desc, capped in sorted(self.events, key=lambda e: e[0]):
            user = self.users[key]
            if key in MAIN3 and when >= TODAY_START - timedelta(hours=1):
                when = TODAY_START - timedelta(hours=rnd.randint(2, 20))
            pts = points
            if capped:
                day = (user.id, when.astimezone(tz).date())
                pts = max(0, min(points, settings.DAILY_POINTS_CAP - used[day]))
                used[day] += pts
                if pts == 0:
                    continue
            self.db.add(RewardTransaction(user_id=user.id, points=pts, action_type=action, action_id=action_id, description=desc[:255], created_at=when))
            user.points += pts
        for user in self.users.values():
            user.tier = tier_for(user.points)


def notify(db, user, title, message, type_, when, read=True):
    db.add(Notification(user_id=user.id, title=title[:150], message=message, type=type_, is_read=read, created_at=when))


def build(db) -> None:
    # ------------------------------------------------------------------ people
    users: dict[str, User] = {}
    for i, (key, p) in enumerate(PEOPLE.items()):
        u = User(name=p["name"], email=p["email"], password_hash=hash_password(PASSWORD), ward=p["ward"], role=p["role"],
                 avatar_url=p["avatar"], bio=p.get("bio"), phone=p.get("phone"), address=p.get("address"), city=p.get("city") or ("Bengaluru" if p.get("phone") else None),
                 pincode=p.get("pincode"), points=0, tier="Bronze", created_at=ago(days=110 - i * 4, hours=rnd.randint(0, 10)))
        db.add(u)
        users[key] = u
    db.flush()
    led = Ledger(db, users)
    official = {"Water": users["official2"]}
    get_official = lambda cat: official.get(cat, users["official"])  # noqa: E731

    # ------------------------------------------------------------------ reports
    issues: list[tuple[dict, CivicIssue]] = []
    seen_before: dict[str, int] = {}  # every report gets its own picture slot within its category
    seen_after: dict[str, int] = {}
    for r in REPORTS:
        lat0, lng0 = AREAS[r["area"]]
        created = ago(days=r["age"], hours=rnd.randint(1, 9))
        kind = r["photo"][0]
        seen_before[kind] = seen_before.get(kind, 0) + 1
        n = seen_before[kind]
        r["photo"] = (kind, n)
        issue = CivicIssue(
            title=r["title"], description=r["description"], category=r["category"], priority=r["priority"], status=r["status"],
            image_urls=json.dumps([photo_url(kind, n)]), address=r["address"],
            latitude=round(lat0 + rnd.uniform(-0.0012, 0.0012), 6), longitude=round(lng0 + rnd.uniform(-0.0012, 0.0012), 6),
            reporter_id=users[r["reporter"]].id, upvotes=0, created_at=created, updated_at=created,
        )
        if r["status"] == "Resolved":
            days, note, after_kind, _ = r["fix"]
            seen_after[after_kind] = seen_after.get(after_kind, 0) + 1
            after_n = seen_after[after_kind]
            issue.resolved_at = min(created + timedelta(days=days, hours=rnd.randint(1, 8)), ago(hours=6))
            issue.resolution_image_urls = json.dumps([photo_url(after_kind, after_n)])
            issue.resolution_note = note
            issue.updated_at = issue.resolved_at
        db.add(issue)
        db.flush()
        issues.append((r, issue))
        users[r["reporter"]].reports_count += 1
        led.add(r["reporter"], "report", issue.id, POINTS["report"], f"Reported: {issue.title[:60]}", created)
        led.add(r["reporter"], "report_photo", issue.id, POINTS["report_photo"], "Photo evidence attached", created + timedelta(minutes=1))
        led.add(r["reporter"], "report_location", issue.id, POINTS["report_location"], "Location tagged", created + timedelta(minutes=1))

    # ------------------------------------------------------- timeline, votes, comments, evidence
    for r, issue in issues:
        reporter, off = users[r["reporter"]], get_official(r["category"])
        db.add(IssueTimelineEvent(issue_id=issue.id, status="Reported", note="Issue reported", actor_id=reporter.id, created_at=issue.created_at))
        steps = ["Under Review", "In Progress", "Resolved"]
        reached = steps[: steps.index(r["status"]) + 1] if r["status"] != "Reported" else []
        t = issue.created_at
        for step in reached:
            if step == "Resolved":
                t = issue.resolved_at
            else:
                t = min(t + timedelta(hours=rnd.randint(7, 40)), ago(hours=3))
            note = {"Under Review": "Complaint verified and assigned to the section.", "In Progress": "Work order issued, crew assigned.",
                    "Resolved": issue.resolution_note}[step]
            db.add(IssueTimelineEvent(issue_id=issue.id, status=step, note=note, actor_id=off.id, created_at=t))
            notify(db, reporter, f"Your report is now {step}", f'"{issue.title[:70]}"', "status", t, read=r["age"] > 3)
            if step in OFFICIAL_COMMENTS:
                db.add(IssueComment(issue_id=issue.id, user_id=off.id, is_official=True, created_at=t + timedelta(minutes=20),
                                    text=rnd.choice(OFFICIAL_COMMENTS[step]).format(dept=DEPT[r["category"]])))
            elif issue.resolution_note:
                db.add(IssueComment(issue_id=issue.id, user_id=off.id, is_official=True, created_at=t + timedelta(minutes=20), text=issue.resolution_note))
        pool = [c for c in CITIZENS if c != r["reporter"]]
        want = min(len(pool), max(1, round(r["votes"] * 0.75)))
        forced = FORCED_SUPPORT.get(r["title"], [])
        voters = []  # weighted pick without replacement: some citizens are far more active than others
        cand = list(pool)
        while len(voters) < want and cand:
            pick = rnd.choices(cand, weights=[ACTIVITY.get(k, 0.4) for k in cand])[0]
            voters.append(pick)
            cand.remove(pick)
        for k in forced:
            if k != r["reporter"] and k not in voters:
                voters.append(k)
        issue.upvotes = len(voters)
        end = min(ago(hours=2), (issue.resolved_at or NOW))
        for v in voters:
            when = issue.created_at + timedelta(hours=1) + (end - issue.created_at - timedelta(hours=1)) * rnd.random()
            db.add(IssueVote(issue_id=issue.id, user_id=users[v].id, created_at=when))
            users[v].supported_count += 1
            led.add(v, "upvote", issue.id, POINTS["upvote"], f"Upvoted: {issue.title[:60]}", when)
        for c in rnd.sample(voters, min(len(voters), rnd.randint(1, 3))):
            db.add(IssueComment(issue_id=issue.id, user_id=users[c].id, text=rnd.choice(CITIZEN_COMMENTS),
                                created_at=issue.created_at + timedelta(hours=rnd.randint(2, 70))))
        if r["status"] == "Resolved":
            db.add(IssueComment(issue_id=issue.id, user_id=reporter.id, text=rnd.choice(THANKS_COMMENTS), created_at=issue.resolved_at + timedelta(hours=5)))
            users[r["reporter"]].resolved_count += 1
            led.add(r["reporter"], "resolve", issue.id, POINTS["resolve"], f"Resolved: {issue.title[:60]}", issue.resolved_at)
        if issue.upvotes >= 9:
            kind, n = r["photo"]
            for j, ev in enumerate(rnd.sample(voters, min(2, len(voters))), start=1):
                when = issue.created_at + timedelta(days=min(r["age"] / 2, 2 + j))
                db.add(IssueEvidence(issue_id=issue.id, user_id=users[ev].id, image_url=photo_url(kind, n + j), created_at=when))
                led.add(ev, "evidence", issue.id, POINTS["evidence"], f"Photo evidence: {issue.title[:50]}", when)
        # impact reels: likes, saves and shares on resolved issues
        if r["status"] == "Resolved":
            for u in rnd.sample(CITIZENS, rnd.randint(5, 9)):
                db.add(ImpactReaction(issue_id=issue.id, user_id=users[u].id, kind="like", created_at=issue.resolved_at + timedelta(hours=rnd.randint(1, 60))))
            for u in rnd.sample(CITIZENS, rnd.randint(2, 4)):
                db.add(ImpactReaction(issue_id=issue.id, user_id=users[u].id, kind="save", created_at=issue.resolved_at + timedelta(hours=rnd.randint(1, 60))))
            for _ in range(rnd.randint(3, 8)):
                db.add(ImpactShare(issue_id=issue.id, user_id=users[rnd.choice(CITIZENS)].id, channel=rnd.choice(["whatsapp", "whatsapp", "x", "telegram", "copy", "native"]),
                                   created_at=issue.resolved_at + timedelta(hours=rnd.randint(1, 80))))
    issue_by_title = {i.title: i for _, i in issues}

    # ------------------------------------------------------------------ quizzes (graded bank quizzes)
    quiz_attempts = [  # person, quiz id, correct answers, days ago
        ("ayush", "quiz-1", 4, 18), ("ayush", "quiz-2", 2, 12), ("ayush", "quiz-3", 3, 7),
        ("priya", "quiz-1", 2, 25), ("priya", "quiz-1", 4, 24), ("priya", "quiz-2", 3, 16), ("priya", "quiz-3", 3, 10),
        ("rahul", "quiz-1", 3, 9), ("rahul", "quiz-2", 1, 6),
        ("meera", "quiz-1", 4, 21), ("meera", "quiz-2", 3, 19), ("meera", "quiz-3", 3, 14),
        ("nikhil", "quiz-1", 3, 11), ("nikhil", "quiz-2", 2, 8), ("ananya", "quiz-3", 3, 6), ("ananya", "quiz-2", 3, 5),
        ("divya", "quiz-1", 4, 13), ("karan", "quiz-3", 2, 15), ("karan", "quiz-3", 3, 14), ("lakshmi", "quiz-1", 4, 17), ("sneha", "quiz-2", 3, 9),
    ]
    paid_quiz: set[tuple[str, str]] = set()
    for key, qid, score, days in quiz_attempts:
        quiz = QUIZ_BY_ID[qid]
        total = len(quiz["questions"])
        passed = score >= _pass_mark(quiz)
        pts = 0
        when = ago(days=days, hours=rnd.randint(1, 8))
        if passed and (key, qid) not in paid_quiz:
            paid_quiz.add((key, qid))
            pts = round(score / total * quiz["points_reward"])
            led.add(key, "quiz", qid, pts, f"Quiz: {quiz['title']}", when)
        db.add(QuizAttempt(user_id=users[key].id, quiz_id=qid, score=score, total=total, passed=passed, points_awarded=pts, created_at=when))

    # ------------------------------------------------------------------ contests
    contests = copy.deepcopy(CONTESTS)
    for spec in contests:
        start, end = ago(days=-spec["start"]), ago(days=-spec["end"])
        c = Contest(ngo_id=users[spec["ngo"]].id, title=spec["title"], topic=spec["topic"], description=spec["description"], prize=spec["prize"],
                    questions=json.dumps(spec["questions"]), time_limit_seconds=spec["time_limit"], starts_at=start, ends_at=end,
                    created_at=start - timedelta(days=3))
        db.add(c)
        db.flush()
        spec["_row"] = c
    CONTEST_ENTRIES = {
        "segregation": [("meera", 5, 62), ("priya", 5, 75), ("ayush", 4, 88), ("nikhil", 4, 97), ("ananya", 3, 110), ("rahul", 3, 120), ("arjun", 2, 140), ("divya", 2, 150)],
        "lake": [("ananya", 5, 70), ("meera", 5, 84), ("priya", 4, 91), ("sneha", 4, 100), ("karan", 3, 105), ("nikhil", 3, 122)],
        "water": [("ananya", 5, 95), ("meera", 4, 101), ("ayush", 4, 118), ("rahul", 3, 130)],
        "rti": [("karan", 5, 55), ("lakshmi", 4, 70), ("priya", 4, 80)],
    }
    prizes = {1: 100, 2: 60, 3: 40}
    for spec in contests:
        c = spec["_row"]
        rows = []
        for key, score, secs in CONTEST_ENTRIES.get(spec["key"], []):
            qs = spec["questions"]
            right = set(rnd.sample(range(len(qs)), score))
            answers = [q["answer_index"] if i in right else (q["answer_index"] + 1 + rnd.randint(0, 2)) % len(q["options"]) for i, q in enumerate(qs)]
            started = c.starts_at + timedelta(hours=rnd.randint(2, 60))
            started = min(started, NOW - timedelta(hours=5))
            e = ContestEntry(contest_id=c.id, user_id=users[key].id, started_at=started, submitted_at=started + timedelta(seconds=secs), score=score,
                             total=len(qs), duration_seconds=float(secs), answers=json.dumps(answers))
            db.add(e)
            rows.append((key, e))
        if spec["final"]:
            c.finalized_at = c.ends_at + timedelta(hours=1)
            rows.sort(key=lambda ke: (-ke[1].score, ke[1].duration_seconds, ke[1].submitted_at))
            for idx, (key, e) in enumerate(rows, start=1):
                e.rank = idx
                paid = 0
                if e.score >= 1:
                    led.add(key, "contest_play", c.id, 10, f"Finished contest: {c.title}", c.finalized_at, capped=False)
                    paid += 10
                    if idx in prizes:
                        led.add(key, "contest_win", c.id, prizes[idx], f"Contest #{idx}: {c.title}", c.finalized_at, capped=False)
                        paid += prizes[idx]
                e.bonus_points = paid
                notify(db, users[key], "You placed #%d!" % idx if idx in prizes else "Contest results are in",
                       f'You finished #{idx} in "{c.title}" and earned {paid} points.', "reward", c.finalized_at, read=True)

    # ------------------------------------------------------------------ volunteering: vacancies and drives
    vol_events = []  # (when, kind, payload) processed in time order so the weekly limit works as in the app
    vacancies = []
    for ngo, title, role, desc, loc, commit, skills, slots, dl, closed in VACANCIES:
        v = Vacancy(ngo_id=users[ngo].id, title=title, role_type=role, description=desc, location=loc, commitment=commit, skills=skills, slots=slots,
                    deadline=NOW + timedelta(days=dl), closed_at=ago(days=6) if closed else None, created_at=ago(days=45))
        db.add(v)
        vacancies.append(v)
    db.flush()
    for vi, key, status, days, note in APPLICATIONS:
        v = vacancies[vi]
        when = ago(days=days)
        a = VacancyApplication(vacancy_id=v.id, user_id=users[key].id, note=note, status=status, points_awarded=0, created_at=when, updated_at=when + timedelta(days=min(days, 5)))
        db.add(a)
        db.flush()
        if status == "Completed":
            vol_events.append((a.updated_at + timedelta(days=5), "vacancy", (key, a, v)))
        owner = next(k for k, u in users.items() if u.id == v.ngo_id)
        notify(db, users[owner], "New application", f"{users[key].name} applied for {v.title}.", "info", when)
        if status in ("Accepted", "Completed", "Rejected"):
            notify(db, users[key], f"Application {status.lower()}", f"{v.title}: {users[owner].name} has marked your application as {status}.", "event", a.updated_at)

    drives = []
    for d in copy.deepcopy(DRIVES):
        start = ago(days=-d["start"], hours=-2)
        c = Campaign(organiser_id=users[d["org"]].id, issue_id=next((i.id for t, i in issue_by_title.items() if "issue" in d and t.startswith(d["issue"])), None),
                     title=d["title"], kind=d["kind"], description=d["desc"], address=d["address"], latitude=AREAS[d["area"]][0], longitude=AREAS[d["area"]][1],
                     starts_at=start, ends_at=start + timedelta(hours=d["hours"]), volunteers_needed=d["needed"], created_at=min(start - timedelta(days=6), NOW - timedelta(hours=8)))
        db.add(c)
        db.flush()
        drives.append((d, c))
        if "attended" in d:
            if d["org"] != "ayush":  # people do not come to everything (Ayush's own drives keep their full turnout)
                d["attended"] = [k for k in d["attended"] if rnd.random() < ATTEND.get(k, 0.5)]
            c.completed_at = c.ends_at + timedelta(minutes=40)
            for key in d["attended"] + d.get("noshow", []):
                db.add(CampaignMember(campaign_id=c.id, user_id=users[key].id, status="Attended" if key in d["attended"] else "NoShow",
                                      joined_at=c.created_at + timedelta(hours=rnd.randint(2, 100))))
            vol_events.append((c.completed_at, "drive", (d, c)))
        else:
            for key in d["joined"]:
                db.add(CampaignMember(campaign_id=c.id, user_id=users[key].id, status="Joined", joined_at=ago(hours=rnd.randint(3, 120))))
    db.flush()
    rewards_by_user: dict[str, list[datetime]] = defaultdict(list)

    def can_pay(key, when):
        return sum(1 for t in rewards_by_user[key] if when - timedelta(days=7) <= t <= when) < MAX_VOLUNTEER_REWARDS_PER_WEEK

    members = {(m.campaign_id, m.user_id): m for m in db.scalars(select(CampaignMember))}
    for when, kind, payload in sorted(vol_events, key=lambda e: e[0]):
        if kind == "vacancy":
            key, a, v = payload
            if can_pay(key, when):
                a.points_awarded = POINTS["vacancy_complete"]
                rewards_by_user[key].append(when)
                led.add(key, "vacancy_complete", a.id, POINTS["vacancy_complete"], f"NGO volunteering: {v.title[:60]}", when, capped=False)
            continue
        d, c = payload
        hours = _hours_credit(c)
        for key in d["attended"]:
            m = members[(c.id, users[key].id)]
            users[key].volunteer_hours = round((users[key].volunteer_hours or 0) + hours, 1)
            if can_pay(key, when):
                m.points_awarded = POINTS["campaign_attend"]
                rewards_by_user[key].append(when)
                led.add(key, "campaign_attend", c.id, POINTS["campaign_attend"], f"Civic drive: {c.title[:60]}", when, capped=False)
        host_key = d["org"]
        if users[host_key].role == "citizen" and can_pay(host_key, when):
            hp = min(MAX_HOST_POINTS, POINTS["campaign_host"] + 10 * len(d["attended"]))
            c.host_points = hp
            rewards_by_user[host_key].append(when)
            led.add(host_key, "campaign_host", c.id, hp, f"Organised: {c.title[:60]}", when, capped=False)

    # ------------------------------------------------------------------ Civic Academy
    courses = []
    for spec in all_courses():
        lessons = [Lesson(position=i, **l) for i, l in enumerate(spec.pop("lessons"), start=1)]
        ngo = users["ngo2"] if spec["category"] in ("Water", "Environment") else users["ngo"]
        c = Course(ngo_id=ngo.id, published_at=ago(days=60), created_at=ago(days=62), lessons=lessons, **spec)
        db.add(c)
        courses.append(c)
    db.flush()
    PROOF_TEXT = {
        "Work out your yield": "Roof area 1,100 sq ft, about 102 sq m. 102 x 950 x 0.8 is roughly 77,500 litres a year. I would send the clean roof water to a recharge pit in the garden because our borewell level drops every summer.",
        "Draft your first RTI question": "To the PIO, ward engineering office. 1. Copy of the work order for the footpath repair on 12th Main between January and June. 2. The amount sanctioned and paid. 3. The date the work was completed and the inspection report.",
        "Tell us your plan": "Wet waste goes into a home compost bin on the balcony, the rest to the ward's wet-waste pick-up. Dry waste is collected by the waste picker on Wednesdays and reject waste on Fridays.",
        "Draft one strong report": "Title: Pothole on 12th Main below metro pillar 112. It is about two feet wide, open for nine days, and a rider fell last week. It affects two-wheelers and the school bus route.",
    }
    PROOF_PHOTO = {"Photograph your catchment": "after_road", "Set up your three bins": "park", "Do the leak check at home": "after_pipe", "Plant or adopt a sapling": "after_tree"}
    enrol_specs = [  # person, course index, state, days ago the course was completed (or last activity)
        ("ayush", 3, "done", 22), ("ayush", 1, "partial", 9), ("ayush", 0, "pending", 2),
        ("priya", 0, "done", 30), ("priya", 2, "partial", 18), ("priya", 3, "done", 11), ("priya", 4, "partial", 3),
        ("meera", 0, "done", 26), ("meera", 1, "done", 20), ("meera", 3, "done", 13), ("meera", 5, "done", 6),
        ("rahul", 2, "partial", 14), ("rahul", 1, "partial", 4),
        ("nikhil", 5, "done", 8), ("nikhil", 2, "partial", 25), ("divya", 4, "done", 10), ("karan", 1, "done", 12),
        ("lakshmi", 2, "done", 16), ("ananya", 5, "done", 5), ("ananya", 4, "partial", 15), ("sneha", 0, "pending", 1), ("arjun", 3, "partial", 2), ("imran", 2, "pending", 3),
    ]
    course_rewards: dict[str, list[datetime]] = defaultdict(list)
    for key, ci, state, days in sorted(enrol_specs, key=lambda s: -s[3]):
        c, u = courses[ci], users[key]
        last = ago(days=days)
        started = last - timedelta(days=rnd.randint(2, 6)) if state == "done" else last - timedelta(days=1)
        enr = Enrollment(course_id=c.id, user_id=u.id, enrolled_at=started)
        db.add(enr)
        db.flush()
        n_lessons = len(c.lessons)
        done_upto = n_lessons if state == "done" else (n_lessons - 1 if state == "pending" else max(1, n_lessons // 2))
        for i, lesson in enumerate(c.lessons):
            t = started + timedelta(hours=3 + i * 5)
            if i < done_upto:
                p = LessonProgress(enrollment_id=enr.id, lesson_id=lesson.id, status="done", started_at=t, completed_at=t + timedelta(minutes=14))
                if lesson.kind == "task":
                    p.attempts, p.submitted_at, p.reviewed_at = 1, t + timedelta(minutes=10), t + timedelta(hours=18)
                    if lesson.proof_type == "photo":
                        p.proof_url = photo_url(PROOF_PHOTO.get(lesson.title, "cleanup"), 1 + i)
                        p.feedback = "Verified. A clear photo that shows the real place."
                    else:
                        p.proof_text = PROOF_TEXT.get(lesson.title, "Completed as instructed.")
                        p.feedback = "Good, specific answer. Verified."
                db.add(p)
            elif i == done_upto:
                p = LessonProgress(enrollment_id=enr.id, lesson_id=lesson.id, status="in_progress", started_at=t)
                if state == "pending" and lesson.kind == "task":
                    p.status, p.attempts, p.submitted_at = "submitted", 1, last
                    if lesson.proof_type == "photo":
                        p.proof_url = photo_url(PROOF_PHOTO.get(lesson.title, "cleanup"), 2 + i)
                    else:
                        p.proof_text = PROOF_TEXT.get(lesson.title, "Completed as instructed.")
                db.add(p)
        if state == "done":
            enr.completed_at = last
            enr.certificate_code = f"JS-{c.id:03d}-{u.id:04d}-{secrets.token_hex(2).upper()}"
            recent = sum(1 for t in course_rewards[key] if last - timedelta(days=7) <= t <= last)
            if recent < MAX_COURSE_REWARDS_PER_WEEK:
                enr.points_awarded = POINTS["course_complete"]
                course_rewards[key].append(last)
                led.add(key, "course_complete", c.id, POINTS["course_complete"], f"Course: {c.title[:60]}", last, capped=False)
            notify(db, u, "Certificate issued", f"You completed '{c.title}'.", "reward", last, read=days > 3)
    db.flush()

    # ------------------------------------------------------------------ apply points, a few welcome notices
    led.apply()
    for key in MAIN3 + ("meera",):
        notify(db, users[key], "Welcome to JanSevak", "Report issues, support your neighbours and earn recognition points.", "info", users[key].created_at)
    # the demo accounts get a few fresh, unread notices so the bell is not empty
    notify(db, users["ayush"], "Your report got a new supporter", f'"{REPORTS[0]["title"][:70]}" now has more supporters.', "upvote", ago(hours=3), read=False)
    notify(db, users["priya"], "New drive near you", "Ulsoor Lake Plastic-Free Sunday (Part 2) needs volunteers.", "info", ago(hours=5), read=False)
    notify(db, users["rahul"], "Contest closing soon", "RTI Rapid-Fire ends in two days. You have not played yet.", "info", ago(hours=7), read=False)
    db.commit()


def report(db) -> None:
    def n(model):
        return db.scalar(select(func.count()).select_from(model))

    print(f"  users {n(User)} | reports {n(CivicIssue)} | votes {n(IssueVote)} | comments {n(IssueComment)} | evidence {n(IssueEvidence)}")
    print(f"  courses {n(Course)} | enrollments {n(Enrollment)} | certificates {db.scalar(select(func.count()).select_from(Enrollment).where(Enrollment.completed_at.is_not(None)))}")
    print(f"  contests {n(Contest)} | contest entries {n(ContestEntry)} | quiz attempts {n(QuizAttempt)}")
    print(f"  vacancies {n(Vacancy)} | applications {n(VacancyApplication)} | drives {n(Campaign)} | drive members {n(CampaignMember)}")
    print("  points:")
    for u in db.scalars(select(User).where(User.role == "citizen").order_by(User.points.desc())):
        print(f"    {u.name:<20} {u.points:>5}  {u.tier:<9} {u.reports_count} reports, {u.supported_count} supported, {u.volunteer_hours:g} h")
    photos = using_real_photos()
    print(f"  photos: {'real photos for ' + str(photos) + ' kinds' if photos else 'placeholder pictures (run python -m demo.fetch_photos for real ones)'}")


def main() -> None:
    if "--reset" in sys.argv:
        Base.metadata.drop_all(bind=engine)
        print("All tables dropped.")
    create_all_tables()
    db = SessionLocal()
    try:
        if db.scalar(select(func.count()).select_from(User)):
            print("The database already has data. Run `python demo_data.py --reset` to wipe it and load the demo data.")
            sys.exit(1)
        build(db)
        print("Demo data loaded.")
        report(db)
        print(f"\nLog in with any of the emails above. Password for every account: {PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
