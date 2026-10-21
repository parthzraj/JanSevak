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
    Course,
    ImpactReaction,
    IssueComment,
    IssueTimelineEvent,
    IssueVote,
    Lesson,
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
    (
        "rahul@example.com",
        "Overflowing dustbins at the market junction",
        "The bins at the 10th Main market junction were overflowing onto the road for over a week, attracting stray "
        "animals and a terrible smell for every shopkeeper nearby.",
        "Sanitation", "High", "10th Main Market Junction, Indiranagar, Bengaluru", 12.9784, 77.6408, "Resolved",
        ["ayush@example.com", "priya@example.com"],
    ),
    (
        "ayush@example.com",
        "Blocked storm drain flooding the crossing",
        "The storm drain beside the zebra crossing was choked with silt. Every drizzle left a knee-deep pool right "
        "where schoolchildren cross.",
        "Water", "Critical", "Double Road Crossing, Indiranagar, Bengaluru", 12.9741, 77.6402, "Resolved",
        ["priya@example.com", "rahul@example.com"],
    ),
]

# Demo "before / after" photos and the official's closing note for the resolved sample issues.
BEFORE_AFTER = {
    "Broken benches and swings in the neighbourhood park": (
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=80", "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80", "Benches re-planked and the swing chain replaced; the play area was reopened."),
    "Overflowing dustbins at the market junction": (
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1080&q=80", "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1080&q=80", "8 tons of waste cleared, street sanitised and 3 covered bins installed."),
    "Blocked storm drain flooding the crossing": (
        "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1080&q=80", "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1080&q=80", "Silt removed over a 1.2 km stretch; the crossing now stays dry in rain."),
}


# Civic Academy sample courses (text + tasks; add video lessons from NGO Studio -> Courses with a YouTube link).
SEED_COURSES = [
    dict(
        title="Rainwater Harvesting for Your Home", level="Beginner", category="Water",
        summary="Learn how a roof becomes a water source, work out your own yield and plan a recharge pit.",
        description="Bengaluru's borewells are falling while monsoon water runs into drains. In this short course you learn how rainwater harvesting works, estimate how much water your own roof can collect, and plan where it would go.",
        lessons=[
            dict(kind="reading", title="Why harvest rain at home?", summary="The problem, and the two ways to use roof water.",
                 body=("Most of the rain that falls on a city roof leaves as storm-water. That is a double loss: the groundwater under the city keeps dropping, "
                       "and the same water floods streets a few minutes later. Rainwater harvesting catches that roof water before it leaves the plot.\n\n"
                       "There are two simple ways to use it. First, store it: a sump or tank collects the clean roof water and you use it for gardening, washing or flushing. "
                       "Second, recharge: a recharge well or pit lets the water soak down and refill the shallow aquifer your borewell or neighbours' borewells draw from.\n\n"
                       "Every system has the same four parts: a catchment (the roof), gutters and downpipes to carry the water, a filter or first-flush diverter that throws away the dirty first minutes of rain, "
                       "and the storage or recharge point. If any part is missing the system clogs or pollutes the groundwater.")),
            dict(kind="reading", title="How much water can your roof collect?", summary="A simple formula you can use with a calculator.",
                 body=("Yield in litres is roughly: roof area in square metres multiplied by yearly rainfall in millimetres multiplied by 0.8. The 0.8 is a runoff factor that allows for losses.\n\n"
                       "Example: a 1000 sq ft roof is about 93 square metres. Bengaluru gets about 900 to 950 mm of rain a year. 93 x 950 x 0.8 is about 70,000 litres a year. "
                       "That is the figure for a whole year, and most of it arrives in a few heavy months, so storage or recharge capacity matters as much as the roof.\n\n"
                       "To use the formula: measure the length and breadth of your terrace in feet, multiply to get square feet, divide by 10.76 to get square metres, then follow the steps above. "
                       "Use the rainfall figure for your own city if you do not live in Bengaluru.")),
            dict(kind="task", title="Photograph your catchment", summary="A physical task: find where your roof water goes today.", task_mode="physical", proof_type="photo",
                 instructions="Go to your terrace or the nearest roof. Take one clear photo showing the roof surface together with the downpipe (or the edge where water drains). Only one photo is needed. The NGO checks that it shows a real roof and drainage point."),
            dict(kind="task", title="Work out your yield", summary="An online task: apply the formula to your own roof.", task_mode="online", proof_type="text",
                 instructions="Write your roof area in square feet, convert it to square metres, apply the formula and give the litres per year. Then say in one or two sentences where you would send the water (storage or recharge) and why."),
        ],
    ),
    dict(
        title="Your Right to Information in 20 Minutes", level="Beginner", category="Rights & RTI",
        summary="Understand what the RTI Act lets you ask for and draft your first application.",
        description="The Right to Information Act, 2005 lets any citizen ask a public office for records and decisions. You will learn what to ask, who to ask, what to expect and how to appeal, and you will draft a real question about your own neighbourhood.",
        lessons=[
            dict(kind="reading", title="What RTI is, and what it is not", summary="Who can ask, who must answer, what you can ask for.",
                 body=("Under the Right to Information Act, 2005, any Indian citizen can ask a public authority for information it holds: files, orders, measurements, expenses, inspection reports, work-order copies and similar records. "
                       "Every public office has a Public Information Officer (PIO) who must answer your written request.\n\n"
                       "RTI is for records that already exist. It is not a complaint box and the office does not have to create new data, give opinions, or answer 'why' questions. "
                       "Ask for specific documents or facts: 'copy of the work order for the footpath repair on 12th Main between January and June' works; 'why is the footpath bad?' does not.\n\n"
                       "Some information is exempt, for example matters that threaten security or personal data with no public interest. If something is refused the office must say which exemption applies.")),
            dict(kind="reading", title="Applying and appealing", summary="The steps, the timeline and the first appeal.",
                 body=("Write your request on paper or on your state's online RTI portal. Say who you are, address it to the PIO of the right department, list your questions as numbered points and pay the application fee. "
                       "The fee is usually small (often 10 rupees) and differs by state, so check your state's rules. Keep a copy and the postal or portal receipt.\n\n"
                       "The PIO normally has to reply within 30 days. If your question concerns a person's life or liberty the limit is 48 hours. "
                       "If you get no reply or an unsatisfactory one, you can file a first appeal with the First Appellate Authority in the same department, normally within 30 days of the reply or of the deadline passing. "
                       "A second appeal then goes to the Information Commission.\n\n"
                       "Numbered, specific questions, dates and the exact name of the place or scheme get the best answers.")),
            dict(kind="task", title="Draft your first RTI question", summary="An online task: write a precise request about a local issue.", task_mode="online", proof_type="text",
                 instructions="Pick a real civic issue near you (a road, drain, streetlight or water supply). Write the department you would address, then two or three numbered questions asking for specific records, with dates where possible. Do not ask 'why' questions. You do not have to send it."),
        ],
    ),
    dict(
        title="Segregate at Source: Wet, Dry and Reject", level="Beginner", category="Waste",
        summary="Set up three-way segregation at home and keep it going.",
        description="Waste that is mixed at home cannot be recycled or composted later. This course shows the simple wet / dry / reject system, why it matters for your ward, and asks you to set it up at home and show it.",
        lessons=[
            dict(kind="reading", title="The three streams", summary="What goes where, and why mixed waste is the real problem.",
                 body=("Segregation at source means separating waste where it is created, in your kitchen, not at a landfill. A common household system has three streams.\n\n"
                       "Wet waste is food scraps, peels, flowers and garden leaves. It can be composted or sent to a bio-methane plant. "
                       "Dry waste is paper, cardboard, plastic, metal and glass. Keep it clean and dry so a waste-picker or recycler can use it. "
                       "Reject or sanitary waste is diapers, sanitary pads, bandages and broken ceramics, plus household hazardous items like batteries and bulbs, which should be handed over separately as the rules in your city describe.\n\n"
                       "A wet mess ruins recyclable paper and plastic, which is why mixed waste ends up in landfills and why collectors refuse mixed bins.")),
            dict(kind="task", title="Set up your three bins", summary="A physical task: show your household segregation set-up.", task_mode="physical", proof_type="photo",
                 instructions="Set up three clearly separated containers or bags at home: wet, dry and reject/sanitary. Label them. Take one photo that shows all three together with their labels. A photo of a single bin will not be accepted."),
            dict(kind="task", title="Tell us your plan", summary="An online task: say how wet waste will be handled.", task_mode="online", proof_type="text",
                 instructions="In three or four sentences describe what happens to your wet waste: home compost, a community composting point, or your ward's wet-waste collection. Mention who collects dry waste and on which day."),
        ],
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
            if state == "Resolved" and title in BEFORE_AFTER:
                before, after, note = BEFORE_AFTER[title]
                issue.image_urls = json.dumps([before])
                issue.resolution_image_urls = json.dumps([after])
                issue.resolution_note = note
            if state == "Resolved":
                issue.resolved_at = min(issue.created_at + timedelta(days=2 + i % 3), utcnow() - timedelta(hours=2))
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

        if not db.scalar(select(Course.id)):
            for c in SEED_COURSES:
                lessons = [Lesson(position=i, **l) for i, l in enumerate(c.pop("lessons"), start=1)]
                db.add(Course(ngo_id=ngo.id, published_at=utcnow(), lessons=lessons, **c))
            print(f"  + {len(SEED_COURSES)} Civic Academy courses")

        db.commit()
        print(f"\nDone. {created} issue(s) added. Demo password for every account: {PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
