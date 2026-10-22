"""Quiz contests, vacancies and civic drives for the demo."""


def Q(question, options, answer, explanation):
    return dict(question=question, options=options, answer_index=answer, explanation=explanation)


CONTESTS = [
    dict(key="segregation", ngo="ngo", title="Segregation Showdown", topic="Sanitation", time_limit=180, start=-20, end=-6, final=True,
         description="Wet, dry and reject: how well do you really sort your waste? Top three win bonus points and a goodie bag.",
         prize="Reusable cloth bag + seed kit from Green Ward Foundation (top 3)",
         questions=[
             Q("Where do used tea leaves and vegetable peels go?", ["Dry waste", "Wet (green) waste", "Reject waste", "E-waste"], 1, "Food scraps are wet waste and can be composted."),
             Q("Which of these is reject or sanitary waste?", ["Newspaper", "Used sanitary pads", "Glass bottles", "Garden leaves"], 1, "Sanitary waste should be wrapped and handed over separately."),
             Q("Why should plastic wrappers be kept dry and clean?", ["So they smell nice", "So recyclers can actually use them", "To make them heavier", "It makes no difference"], 1, "Wet, dirty plastic cannot be recycled."),
             Q("Where should old tubelights and CFL bulbs go?", ["General dry waste", "Wet waste bin", "A hazardous / e-waste collection point", "Burn them"], 2, "They contain mercury and need safe handling."),
             Q("A good home compost needs a mix of:", ["Only kitchen scraps", "Green kitchen scraps and brown dry leaves", "Only paper", "Plastic and food"], 1, "Brown material balances the wet green scraps and lets air in."),
         ]),
    dict(key="lake", ngo="ngo2", title="Lake Guardians Challenge", topic="Environment", time_limit=150, start=-24, end=-12, final=True,
         description="Five questions on keeping city lakes alive. Run by the Clean Lake Collective.",
         prize="A morning of birdwatching with the Collective (top 3)",
         questions=[
             Q("What most often causes foam on a polluted lake?", ["Fish breeding", "Detergents and untreated sewage", "Cold weather", "Fresh rain"], 1, "Phosphates and detergents from sewage create the foam."),
             Q("Which helps keep a lake healthy?", ["Dumping debris on the bed", "Stopping sewage and waste from entering it", "Covering it with concrete", "Draining it in summer"], 1, "Keeping pollution out is the first step."),
             Q("Why are plastic bags so harmful in lakes?", ["They do not rot and choke birds and fish", "They taste bad", "They float too high", "They make water warm"], 0, "Plastic persists and is swallowed by wildlife."),
             Q("Native plants along the bank help by:", ["Blocking the view", "Holding soil and filtering runoff", "Attracting litter", "Lowering the water"], 1, "Roots stabilise the bank and trap pollutants."),
             Q("Which of these is harmful near a lake?", ["Planting native trees", "Bird counts", "Dumping construction rubble", "Picking up litter"], 2, "Rubble fills the lake bed and kills the edge habitat."),
         ]),
    dict(key="water", ngo="ngo2", title="Water Wise Week Quiz", topic="Water", time_limit=180, start=-3, end=5, final=False,
         description="Roofs, recharge pits and leaky taps. Test your water sense this week.",
         prize="Free rainwater-harvesting home audit from the Collective (top 3)",
         questions=[
             Q("A roof of 100 sq m gets 800 mm of rain a year. With a runoff factor of 0.8, about how much water can it collect?", ["8,000 litres", "64,000 litres", "640,000 litres", "800 litres"], 1, "100 x 800 x 0.8 = 64,000 litres."),
             Q("What does a first-flush diverter do?", ["Stores extra water", "Discards the dirty first rain from the roof", "Heats the water", "Measures rainfall"], 1, "The first minutes of rain wash the roof, so they are thrown away."),
             Q("When is the best time to water a garden?", ["Noon", "Early morning or evening", "Midnight only", "It does not matter"], 1, "Less water is lost to evaporation."),
             Q("A recharge pit mainly lets rainwater:", ["Run into the drain", "Soak into the ground and refill groundwater", "Evaporate", "Go into the sewer"], 1, "Recharge refills the aquifer."),
             Q("Water from a washing machine (greywater) can be reused for:", ["Drinking", "Flushing or gardening", "Cooking", "Baby baths"], 1, "Greywater is fine for non-drinking uses."),
         ]),
    dict(key="rti", ngo="ngo", title="RTI Rapid-Fire", topic="Rights", time_limit=120, start=-2, end=2, final=False,
         description="Five quick questions on the Right to Information Act. Fast and accurate wins.",
         prize="Printed RTI guide + a free drafting session",
         questions=[
             Q("Who can file an RTI application?", ["Only lawyers", "Any Indian citizen", "Only government employees", "Only registered voters"], 1, "Any citizen can ask a public authority for information."),
             Q("How long does a PIO normally have to reply?", ["48 hours always", "30 days", "6 months", "1 year"], 1, "Thirty days is the normal limit."),
             Q("Where does the first appeal go?", ["The Prime Minister", "The First Appellate Authority in the same department", "A newspaper", "The police"], 1, "It goes to a senior officer in the same department."),
             Q("Which is a valid RTI question?", ["Why is the footpath so bad?", "Copy of the work order and expenses for the footpath repair on 12th Main", "Do you like our city?", "Fix this footpath now"], 1, "RTI is for existing records, not opinions or demands."),
             Q("RTI is meant for:", ["Records that already exist", "Creating new reports on demand", "Personal opinions", "Settling disputes"], 0, "The office does not have to create data that does not exist."),
         ]),
    dict(key="basics", ngo="ngo", title="Know Your Ward: Civic Basics", topic="Civic basics", time_limit=150, start=3, end=10, final=False,
         description="Coming up: who does what in your ward and how to get a problem fixed. Opens in three days.",
         prize="Neighbourhood hamper from Green Ward Foundation (top 3)",
         questions=[
             Q("Who usually looks after street lights and garbage in a city ward?", ["The municipal body", "The airline", "A bank", "The post office"], 0, "Local civic bodies run these services."),
             Q("The all-in-one national emergency number is:", ["100 only", "112", "1234", "555"], 1, "112 is the single emergency number in India."),
             Q("What should a good complaint include?", ["A clear photo, exact location and facts", "Only anger", "A long story with no place", "A rumour"], 0, "Details make it easy to verify and fix."),
             Q("Why upvote someone else's report?", ["To show many neighbours face it", "To delete it", "To hide it", "It does nothing"], 0, "Supporters show that the problem is shared."),
             Q("Fire emergency number in India:", ["101", "420", "786", "999"], 0, "101 is the fire service number."),
         ]),
]

# (ngo key, title, role_type, description, location, commitment, skills, slots, deadline days from now, closed?)
VACANCIES = [
    ("ngo", "Weekend clean-up volunteers", "Volunteer", "Join our weekly lake-side clean-up crew. Gloves and bags are provided; we sort the waste for recycling together.",
     "Ulsoor Lake, Bengaluru", "3 hrs every Saturday", "No experience needed", 15, 30, False),
    ("ngo", "Community outreach intern", "Internship", "Help us run awareness sessions in schools and resident associations about waste segregation and water saving.",
     "Indiranagar, Bengaluru", "8 hrs / week for 2 months", "Good communication, Kannada or Hindi", 3, 21, False),
    ("ngo", "RTI helpdesk volunteer", "Volunteer", "Sit at our Saturday helpdesk and help neighbours draft simple RTI applications about roads, drains and street lights.",
     "Green Ward office, Indiranagar", "3 hrs every Saturday", "Clear writing, patience", 4, 25, False),
    ("ngo2", "Lake monitoring fellow", "Fellowship", "Take weekly water-quality readings (pH, turbidity, bird counts) at two lakes and log them in our shared sheet.",
     "Koramangala and Ulsoor lakes", "6 hrs / week for 3 months", "Science or environment background preferred", 2, 40, False),
    ("ngo2", "Tree plantation drive coordinator", "Part-time", "Coordinate sapling pick-up, volunteers and aftercare for our monsoon plantation drives in HSR and Koramangala.",
     "HSR Layout, Bengaluru", "10 hrs / week for 6 weeks", "Organising skills, own two-wheeler", 2, 18, False),
    ("ngo2", "Water audit volunteer", "Volunteer", "Visit households and apartments with a simple checklist to find leaks and suggest rainwater harvesting.",
     "Koramangala, Bengaluru", "4 hrs every Sunday", "Basic plumbing curiosity", 8, -5, True),
]

# applications: (vacancy index, person, status, days ago applied, note)
APPLICATIONS = [
    (0, "priya", "Completed", 28, "I already volunteer at the park, happy to help at the lake too."),
    (0, "nikhil", "Completed", 27, "Free every Saturday morning."),
    (0, "ananya", "Accepted", 6, "Lake regular. I can bring two friends."),
    (1, "nikhil", "Applied", 4, "Second-year student, speak Kannada and Hindi."),
    (1, "divya", "Rejected", 12, "Interested in design for community posters."),
    (2, "karan", "Accepted", 5, "Retired banker, comfortable with forms and RTI basics."),
    (2, "lakshmi", "Applied", 3, "I have filed two RTI applications myself."),
    (3, "ananya", "Applied", 7, "Bird counts for three years, can log readings weekly."),
    (4, "arjun", "Applied", 2, "Civil engineering student with a bike."),
    (5, "meera", "Completed", 40, "Our RWA wants to do the same audit."),
]

# Civic drives. organiser key, title, kind, description, address, area, starts (days from now, + for future), hours, needed,
# attendees (past & completed) / joined (upcoming) person keys, issue title prefix (optional)
DRIVES = [
    # ---- completed
    dict(org="ngo2", title="School Wall Mural Clean-up", kind="Cleanup", desc="Scrub, repaint and tidy the wall outside the government school so it can hold a student mural.",
         address="Government school wall, Jayanagar 4th Block", area="jayanagar", start=-32, hours=3, needed=20, attended=["priya", "nikhil", "ananya", "divya", "imran", "meera", "karan"], noshow=["rahul"]),
    dict(org="ngo", title="Sunday Seed-ball Sowing", kind="Plantation", desc="Make seed balls from clay and compost and scatter them along the lake bund before the rains.",
         address="Bund road, Koramangala Lake", area="koramangala", start=-25, hours=3, needed=25, attended=["priya", "meera", "nikhil", "ananya", "arjun", "sneha", "divya", "karan", "lakshmi"], noshow=["imran", "rahul"]),
    dict(org="priya", title="Park Bench Repair Day", kind="Repair", desc="Re-plank the broken benches and paint the swings in Defence Colony Park. Bring brushes and gloves.",
         address="Defence Colony Park, Indiranagar", area="defence", start=-20, hours=3, needed=10, attended=["ayush", "nikhil", "meera", "ananya", "karan"], noshow=["rahul"], issue="Broken benches"),
    dict(org="ngo", title="Koramangala Lake Tree Plantation", kind="Plantation", desc="Plant forty native saplings along the lake path with guards and stakes provided.",
         address="Lake path, Koramangala", area="koramangala", start=-15, hours=4, needed=30, attended=["priya", "meera", "nikhil", "ananya", "ayush", "sneha", "divya"], noshow=["imran", "lakshmi", "rahul", "arjun"]),
    dict(org="ngo2", title="Ulsoor Lake Plastic-Free Sunday", kind="Cleanup", desc="Clear plastic from the lake edge and sort it for recycling with the Clean Lake Collective.",
         address="Ulsoor Lake steps, Bengaluru", area="ulsoor", start=-10, hours=3, needed=40, attended=["priya", "meera", "nikhil", "ananya", "ayush", "sneha", "arjun", "divya", "karan", "imran"], noshow=["lakshmi", "rahul"], issue="Litter and plastic piled"),
    dict(org="ayush", title="5th Cross Junction Clean-up", kind="Cleanup", desc="Clear the garbage heap at the junction, wash the area and put up a no-dumping board.",
         address="5th Cross junction, Indiranagar", area="indiranagar", start=-8, hours=2.5, needed=15, attended=["priya", "nikhil", "meera", "rahul", "ananya", "sneha", "karan", "divya", "imran", "lakshmi", "tara"], noshow=["arjun"], issue="Garbage piling up"),
    dict(org="ayush", title="Double Road Drain De-silting Walk", kind="Cleanup", desc="Walk the drain line with gloves and rakes, remove plastic and silt from inlets before the rains.",
         address="Double Road crossing, Indiranagar", area="indiranagar", start=-4, hours=2.5, needed=15, attended=["priya", "nikhil", "meera", "ananya", "sneha", "karan", "divya", "imran", "lakshmi", "vikram", "zoya", "tara"], noshow=["rahul", "arjun"], issue="Blocked storm drain"),
    # ---- upcoming
    dict(org="ayush", title="Fill the 12th Main pothole together", kind="Repair", desc="We will mark the pothole, warn traffic and push for BBMP cold-mix material. Come with cones or reflective tape if you have them.",
         address="12th Main Road, Indiranagar", area="indiranagar", start=1, hours=2, needed=12, joined=["priya", "nikhil", "rahul", "meera"], issue="Deep pothole on 12th Main"),
    dict(org="meera", title="80 Feet Road Light-Pole Audit Walk", kind="Awareness", desc="Walk the road after dark and note every dead light and dark spot with photos, then file them together as reports.",
         address="80 Feet Road, Koramangala", area="koramangala", start=2, hours=1.5, needed=15, joined=["rahul", "ananya", "sneha"]),
    dict(org="ngo", title="Ulsoor Lake Plastic-Free Sunday (Part 2)", kind="Cleanup", desc="Bring a bag and a friend. We will clear plastic from the lake edge and sort it for recycling.",
         address="Ulsoor Lake, Bengaluru", area="ulsoor", start=3, hours=3, needed=40, joined=["priya", "ayush", "nikhil", "meera", "ananya", "karan"]),
    dict(org="priya", title="Weekend Park Tidy-up", kind="Cleanup", desc="Pick up the litter left after the weekend market and plant marigolds along the walking path.",
         address="Jayanagar 4th Block Park", area="jayanagar", start=6, hours=2, needed=12, joined=["divya", "imran"]),
    dict(org="ngo2", title="Lake Bird-Count Morning", kind="Awareness", desc="A guided early-morning bird count at Koramangala Lake. Binoculars provided, beginners welcome.",
         address="Koramangala Lake gate, Bengaluru", area="koramangala", start=8, hours=2, needed=20, joined=["ananya", "meera", "arjun"]),
]
