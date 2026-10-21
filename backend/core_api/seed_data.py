"""Load demo data: 3 citizens, 1 municipal official, 1 NGO, 5 civic complaints and 1 live contest.

    python seed_data.py            # add demo data (safe to run twice)
    python seed_data.py --reset    # wipe ALL tables first, then seed

Demo logins (password for all: demo123)
    ayush@example.com   Gold     340 pts
    priya@example.com   Silver   180 pts
    rahul@example.com   Bronze    40 pts
    official@example.com         municipal official (can change issue status)
    ngo@example.com              NGO (can publish quiz contests)
"""
import json
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import select  # noqa: E402

from app.core.database import Base, SessionLocal, create_all_tables, engine, utcnow  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models import (  # noqa: E402
    Campaign,
    CampaignMember,
    CivicIssue,
    Contest,
    IssueComment,
    IssueTimelineEvent,
    IssueVote,
    RewardTransaction,
    User,
    Vacancy,
)
from app.services.points_engine import tier_for  # noqa: E402

PASSWORD = "demo123"

AVATARS = {  # built-in avatar illustrations (users can change them in Edit Profile)
    "ayush@example.com": "preset:man-1",
    "priya@example.com": "preset:woman-1",
    "rahul@example.com": "preset:man-2",
}

USERS = [
    # name, email, ward, points, role
    ("Ayush Sharma", "ayush@example.com", "Ward 112 - Indiranagar", 340, "citizen"),
    ("Priya Nair", "priya@example.com", "Ward 112 - Indiranagar", 180, "citizen"),
    ("Rahul Verma", "rahul@example.com", "Ward 85 - Koramangala", 40, "citizen"),
    ("BBMP Ward Officer", "official@example.com", "Ward 112 - Indiranagar", 0, "official"),
    ("Green Ward Foundation", "ngo@example.com", "Ward 112 - Indiranagar", 0, "ngo"),
]

# reporter email, title, description, category, priority, address, lat, lng, status, upvote_by
ISSUES = [
    (
        "ayush@example.com",
        "Deep pothole on 12th Main Road",
        "A pothole roughly 2 feet wide and 6 inches deep has formed in the left lane near the Indiranagar metro "
        "pillar. Two-wheelers swerve into traffic to avoid it, and a rider fell here last week.",
        "Roads", "High", "12th Main Road, Indiranagar, Bengaluru", 12.9784, 77.6408, "Under Review",
        ["priya@example.com", "rahul@example.com"],
    ),
    (
        "priya@example.com",
        "Garbage piling up at 5th Cross junction",
        "The community bin has not been cleared for six days. Waste is overflowing onto the footpath and stray "
        "dogs are scattering it across the road. A strong smell is affecting nearby shops.",
        "Sanitation", "Medium", "5th Cross, Ward 112, Bengaluru", 12.9719, 77.6412, "Reported",
        ["ayush@example.com"],
    ),
    (
        "rahul@example.com",
        "Streetlights out on Koramangala 80ft Road",
        "Four consecutive streetlights between the park gate and the bus stop have been dark for ten days. The "
        "stretch is unsafe for women and senior citizens walking after 7 pm.",
        "Streetlights", "High", "80ft Road, Koramangala, Bengaluru", 12.9352, 77.6245, "In Progress",
        ["ayush@example.com", "priya@example.com"],
    ),
    (
        "ayush@example.com",
        "Water pipeline leak flooding the lane",
        "A main supply pipe is leaking near house no. 41. Clean water has been running down the lane since "
        "morning and the road surface is starting to cave in.",
        "Water", "Critical", "41, 3rd Cross, Indiranagar, Bengaluru", 12.9801, 77.6385, "Reported",
        ["rahul@example.com"],
    ),
    (
        "priya@example.com",
        "Broken benches and swings in the neighbourhood park",
        "Several benches have missing planks and one swing chain is snapped. Children play here every evening, "
        "so this needs repair before someone is hurt.",
        "Parks", "Low", "Defence Colony Park, Indiranagar, Bengaluru", 12.9765, 77.6371, "Resolved",
        ["ayush@example.com", "rahul@example.com"],
    ),
]


def reset() -> None:
    Base.metadata.drop_all(bind=engine)


def main() -> None:
    if "--reset" in sys.argv:
        reset()
        print("All tables dropped.")
    create_all_tables()

    db = SessionLocal()
    try:
        users: dict[str, User] = {}
        for name, email, ward, points, role in USERS:
            user = db.scalar(select(User).where(User.email == email))
            if user is None:
                user = User(
                    name=name,
                    email=email,
                    password_hash=hash_password(PASSWORD),
                    ward=ward,
                    points=points,
                    tier=tier_for(points),
                    role=role,
                    avatar_url=AVATARS.get(email),
                )
                db.add(user)
                db.flush()
                if points:
                    # Back-dated so the demo accounts still have their full 60-point daily allowance today.
                    db.add(
                        RewardTransaction(
                            user_id=user.id,
                            points=points,
                            action_type="seed_balance",
                            action_id="initial",
                            description="Starting balance (demo data)",
                            created_at=utcnow() - timedelta(days=7),
                        )
                    )
                print(f"  + user  {email}")
            users[email] = user

        official = users["official@example.com"]
        created = 0
        for i, (rep, title, desc, cat, prio, addr, lat, lng, state, voters) in enumerate(ISSUES):
            if db.scalar(select(CivicIssue.id).where(CivicIssue.title == title)):
                continue
            ago = timedelta(days=len(ISSUES) - i, hours=3)
            issue = CivicIssue(
                title=title,
                description=desc,
                category=cat,
                priority=prio,
                status=state,
                image_urls=json.dumps([]),
                address=addr,
                latitude=lat,
                longitude=lng,
                reporter_id=users[rep].id,
                upvotes=len(voters),
                created_at=utcnow() - ago,
            )
            db.add(issue)
            db.flush()

            db.add(IssueTimelineEvent(issue_id=issue.id, status="Reported", note="Issue reported",
                                      actor_id=users[rep].id, created_at=issue.created_at))
            steps = ["Under Review", "In Progress", "Resolved"]
            for step in steps[: steps.index(state) + 1] if state != "Reported" else []:
                db.add(IssueTimelineEvent(issue_id=issue.id, status=step, note=f"Marked {step}",
                                          actor_id=official.id, created_at=issue.created_at + timedelta(hours=6)))

            for voter in voters:
                db.add(IssueVote(issue_id=issue.id, user_id=users[voter].id))
            db.add(IssueComment(issue_id=issue.id, user_id=users[voters[0]].id,
                                text="I pass this every day - it really needs attention.", is_official=False))
            if state != "Reported":
                db.add(IssueComment(issue_id=issue.id, user_id=official.id,
                                    text=f"Noted. The ward office has marked this as {state}.", is_official=True))
            users[rep].reports_count += 1
            created += 1
            print(f"  + issue {title}")

        if not db.scalar(select(Contest.id)):
            from app.services.quiz_bank import QUIZ_BY_ID

            q = QUIZ_BY_ID["quiz-1"]["questions"]
            db.add(Contest(
                ngo_id=users["ngo@example.com"].id,
                title="Segregation Showdown",
                topic="Sanitation",
                description="Show how well you know wet, dry and hazardous waste. Top three win bonus points and a goodie bag.",
                prize="Reusable cloth bag + seed kit from Green Ward Foundation (top 3)",
                questions=json.dumps(q),
                time_limit_seconds=180,
                starts_at=utcnow() - timedelta(hours=1),
                ends_at=utcnow() + timedelta(days=7),
            ))
            print("  + contest Segregation Showdown")

        ngo = users["ngo@example.com"]
        if not db.scalar(select(Vacancy.id)):
            db.add_all([
                Vacancy(ngo_id=ngo.id, title="Weekend clean-up volunteers", role_type="Volunteer",
                        description="Join our weekly lake-side clean-up crew. Gloves and bags are provided; we sort the waste for recycling together.",
                        location="Ulsoor Lake, Bengaluru", commitment="3 hrs every Saturday", skills="No experience needed", slots=15,
                        deadline=utcnow() + timedelta(days=30)),
                Vacancy(ngo_id=ngo.id, title="Community outreach intern", role_type="Internship",
                        description="Help us run awareness sessions in schools and resident associations about waste segregation and water saving.",
                        location="Indiranagar, Bengaluru", commitment="8 hrs / week for 2 months", skills="Good communication, Kannada or Hindi", slots=3,
                        deadline=utcnow() + timedelta(days=21)),
            ])
            print("  + 2 vacancies")
        if not db.scalar(select(Campaign.id)):
            pothole = db.scalar(select(CivicIssue).where(CivicIssue.title.like("Deep pothole%")))
            camp_ngo = Campaign(organiser_id=ngo.id, title="Ulsoor Lake Plastic-Free Sunday", kind="Cleanup",
                                description="Bring a bag and a friend. We will clear plastic from the lake edge and sort it for recycling.",
                                address="Ulsoor Lake, Bengaluru", starts_at=utcnow() + timedelta(days=3, hours=2),
                                ends_at=utcnow() + timedelta(days=3, hours=5), volunteers_needed=40)
            camp_citizen = Campaign(organiser_id=users["ayush@example.com"].id, issue_id=pothole.id if pothole else None,
                                    title="Fill the 12th Main pothole together", kind="Repair",
                                    description="We will mark the pothole, warn traffic and push for BBMP cold-mix material. Come with cones or reflective tape if you have them.",
                                    address="12th Main Road, Indiranagar", starts_at=utcnow() + timedelta(days=1, hours=1),
                                    ends_at=utcnow() + timedelta(days=1, hours=3), volunteers_needed=12)
            db.add_all([camp_ngo, camp_citizen])
            db.flush()
            db.add(CampaignMember(campaign_id=camp_citizen.id, user_id=users["priya@example.com"].id))
            print("  + 2 campaigns")

        db.commit()
        print(f"\nDone. {created} issue(s) added. Demo password for every account: {PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
