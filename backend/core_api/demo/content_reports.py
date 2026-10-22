"""Demo civic reports. Each one reads like a real complaint: where, how long, who it affects.

Fields: reporter, title, description, category, priority, area, address, status, age (days since reported),
        photo (kind, variant), votes, and for Resolved reports: fix = (days to fix, official's note, after-photo kind, variant).
"""

AREAS = {  # (lat, lng)
    "indiranagar": (12.9784, 77.6408), "cmh": (12.9780, 77.6390), "defence": (12.9765, 77.6371),
    "koramangala": (12.9352, 77.6245), "ulsoor": (12.9830, 77.6200), "hsr2": (12.9116, 77.6389),
    "hsr7": (12.9081, 77.6476), "jayanagar": (12.9250, 77.5938), "malleshwaram": (13.0035, 77.5710),
    "silkboard": (12.9174, 77.6229), "sarjapur": (12.9100, 77.6700),
}


def R(reporter, title, description, category, priority, area, address, status, age, photo, votes, fix=None):
    return dict(reporter=reporter, title=title, description=description, category=category, priority=priority, area=area,
                address=address, status=status, age=age, photo=photo, votes=votes, fix=fix)


REPORTS = [
    # ------------------------------------------------------------------ Roads
    R("ayush", "Deep pothole on 12th Main Road near the metro pillar",
      "A pothole roughly two feet wide and six inches deep has opened in the left lane right under the Indiranagar metro pillar. "
      "Two-wheelers swerve into the middle of the road to avoid it, and a rider fell here last Thursday evening. It fills with water "
      "when it rains, so you cannot see how deep it is.",
      "Roads", "High", "indiranagar", "12th Main Road, below metro pillar 112, Indiranagar, Bengaluru", "Under Review", 9, ("pothole", 1), 11),
    R("priya", "Road caved in after the water-board digging on CMH Road",
      "The trench dug for a pipe repair three weeks ago was refilled with loose soil and never re-tarred. After the last two showers the "
      "patch has sunk about a foot and autos and cars slow to a crawl, which backs traffic up past the school gate every morning.",
      "Roads", "High", "cmh", "CMH Road, opposite the government school, Indiranagar, Bengaluru", "In Progress", 14, ("pothole", 2), 9),
    R("rahul", "Uneven patchwork on 80 Feet Road makes bikes skid",
      "The stretch between the park gate and the Sony signal has been patched with thick bumps of cold-mix that are higher than the road. "
      "Two cyclists and a scooter rider skidded here this week. It needs levelling, not another layer on top.",
      "Roads", "Medium", "koramangala", "80 Feet Road, between the park gate and Sony signal, Koramangala, Bengaluru", "Reported", 3, ("pothole", 3), 4),
    R("imran", "Footpath tiles broken outside the 4th Block shopping complex",
      "About twenty paver tiles are cracked or missing along the footpath in front of the complex. Senior citizens and mothers with prams "
      "have to step down onto the road, which is full of parked cars and auto traffic.",
      "Roads", "Medium", "jayanagar", "4th Block shopping complex footpath, Jayanagar, Bengaluru", "Reported", 6, ("footpath", 1), 5),
    R("karan", "Pothole cluster on Malleshwaram 8th Cross",
      "Five or six potholes close together on the 8th Cross, the worst one nearly a foot across next to the vegetable market. Autos and "
      "handcarts weave around them all day and the cross turns into a bottleneck at 6 pm.",
      "Roads", "High", "malleshwaram", "8th Cross near the vegetable market, Malleshwaram, Bengaluru", "Resolved", 21, ("pothole", 2), 8,
      fix=(6, "Potholes cut square, filled with hot-mix and rolled. Crew re-checked the stretch after the first rain.", "after_road", 1)),
    R("meera", "Road cave-in beside the bus bay on Sarjapur Road",
      "A section of the service road beside the BMTC bus bay has collapsed into a hollow about three feet across, partly covered by a loose "
      "plank. Buses and bikes pass within inches of it. A drain line has clearly washed out underneath.",
      "Roads", "Critical", "sarjapur", "Service road beside the BMTC bus bay, Sarjapur Road, Bengaluru", "Resolved", 30, ("pothole", 3), 12,
      fix=(4, "Washed-out drain pipe replaced, trench compacted in layers and the surface re-laid. Barricades removed.", "after_road", 2)),
    # ------------------------------------------------------------- Sanitation
    R("priya", "Garbage piling up at the 5th Cross junction",
      "The community bin has not been cleared for six days. Waste is spilling onto the footpath and stray dogs scatter it across the road. "
      "The smell is hitting the bakery and the clinic next to it.",
      "Sanitation", "Medium", "indiranagar", "5th Cross junction, Ward 112, Bengaluru", "Reported", 2, ("garbage", 1), 6),
    R("rahul", "Overflowing dustbins at the 10th Main market junction",
      "The bins at the 10th Main market junction overflowed onto the road for over a week. Stray animals tore the bags open and every "
      "shopkeeper nearby is dealing with the smell and flies, especially after noon.",
      "Sanitation", "High", "indiranagar", "10th Main market junction, Indiranagar, Bengaluru", "Resolved", 26, ("garbage", 2), 14,
      fix=(3, "Eight tonnes of waste cleared, the street washed and disinfected. Two covered bins added and pick-up moved to twice a day.", "after_clean", 1)),
    R("lakshmi", "Burning rubbish heap smoking behind the school wall",
      "Someone sets the garbage heap behind the Malleshwaram school wall alight in the evenings. The smoke drifts into the classrooms and "
      "the playground. Plastic is clearly being burnt, the smell is toxic.",
      "Sanitation", "High", "malleshwaram", "Lane behind the school wall, Malleshwaram, Bengaluru", "Under Review", 4, ("garbage", 3), 7),
    R("sneha", "Sewage overflowing onto the lane in HSR Sector 7",
      "Sewage has been welling up from the manhole in our lane for eight days. The whole lane is wet and black, children cannot play outside "
      "and two houses report the smell inside. The overflow gets worse at around 8 in the morning.",
      "Sanitation", "Critical", "hsr7", "3rd Main, Sector 7, HSR Layout, Bengaluru", "In Progress", 8, ("sewage", 1), 10),
    R("ananya", "Litter and plastic piled around the Ulsoor Lake steps",
      "Bottles, chip packets and carry bags have collected around the lake steps and are drifting into the water. Coots and egrets are "
      "tangled in plastic. A weekend crowd leaves it like this every Sunday.",
      "Sanitation", "Medium", "ulsoor", "Lake steps, Ulsoor Lake, Bengaluru", "Resolved", 18, ("garbage", 1), 9,
      fix=(5, "Cleared with the Clean Lake Collective volunteers and two litter bins placed at the steps. Sunday patrols added.", "after_clean", 2)),
    R("nikhil", "Construction debris dumped on the footpath",
      "A load of broken tiles and rubble has been dumped across the whole footpath next to the new building. People have to walk on the "
      "road, and it has stayed there for four days.",
      "Sanitation", "Medium", "indiranagar", "Footpath on 3rd Cross, Indiranagar, Bengaluru", "Reported", 1, ("garbage", 2), 2),
    R("lakshmi", "Choked drain breeding mosquitoes behind the market",
      "The open drain behind the market is full of silt, plastic bags and stagnant water. Mosquitoes breed there and three neighbours "
      "have had fever in the past fortnight.",
      "Sanitation", "High", "malleshwaram", "Drain behind Malleshwaram market, Bengaluru", "Resolved", 20, ("drain", 2), 8,
      fix=(4, "Silt and plastic removed along 400 m, drain flushed and larvicide sprayed. Next de-silting scheduled before monsoon.", "after_drain", 2)),
    # ------------------------------------------------------------ Streetlights
    R("rahul", "Four streetlights out on Koramangala 80 Feet Road",
      "Four consecutive streetlights between the park gate and the bus stop have been dark for ten days. The stretch is unsafe for women "
      "and senior citizens walking home after 7 pm, and a phone was snatched here on Monday.",
      "Streetlights", "High", "koramangala", "80 Feet Road, park gate to bus stop, Koramangala, Bengaluru", "In Progress", 11, ("streetlight", 1), 12),
    R("divya", "Dark stretch near the Jayanagar metro exit, four lamps dead",
      "The approach road to the metro exit has no light at all after sunset. Commuters walk in the dark past a construction pit with no "
      "barricade, which makes it dangerous.",
      "Streetlights", "High", "jayanagar", "Road to Jayanagar metro exit, Bengaluru", "Under Review", 5, ("streetlight", 2), 8),
    R("priya", "Flickering lamp posts on CMH Road near the school",
      "The two lamps outside the school flicker and go off every few minutes after dark. Parents collecting children from tuition "
      "classes cannot see the speed breaker.",
      "Streetlights", "Medium", "cmh", "CMH Road outside the school, Indiranagar, Bengaluru", "Resolved", 16, ("streetlight", 3), 6,
      fix=(5, "Faulty ballast and two lamps replaced with LED units. Timer checked, lights now switch on at dusk.", "after_light", 1)),
    R("lakshmi", "No light on the Malleshwaram park path after 7 pm",
      "The walking path in the park is pitch dark in the evenings because the lamps stay off. Regular walkers now stop at sunset, which "
      "leaves the park empty and unsafe.",
      "Streetlights", "Medium", "malleshwaram", "Walking path, Malleshwaram park, Bengaluru", "Reported", 2, ("streetlight", 1), 3),
    # ------------------------------------------------------------------ Water
    R("ayush", "Water pipeline leak flooding the lane at house 41",
      "A main supply pipe is leaking near house no. 41. Clean water has been running down the lane since morning and the road surface is "
      "starting to cave in. Valuable drinking water is being wasted while upstairs taps run dry.",
      "Water", "Critical", "indiranagar", "41, 3rd Cross, Indiranagar, Bengaluru", "Reported", 1, ("pipeleak", 1), 7),
    R("ayush", "Blocked storm drain flooding the Double Road crossing",
      "The storm drain beside the zebra crossing was choked with silt. Every drizzle left a knee-deep pool right where schoolchildren cross, "
      "and cars splash them as they pass.",
      "Water", "Critical", "indiranagar", "Double Road crossing, Indiranagar, Bengaluru", "Resolved", 24, ("drain", 1), 15,
      fix=(3, "Silt removed over a 1.2 km stretch and the inlet grating replaced. The crossing now stays dry in rain.", "after_drain", 1)),
    R("sneha", "Dirty brown water from the taps for the third day",
      "Our building has been getting brown, smelly water for three days. Neighbouring buildings report the same. We are buying cans, which "
      "is expensive for the senior residents on the ground floor.",
      "Water", "High", "hsr2", "Sector 2, HSR Layout, Bengaluru", "Under Review", 3, ("pipeleak", 2), 9),
    R("arjun", "Waterlogging outside the school gate after every drizzle",
      "The road in front of the school gate turns into a pond even after a light shower because the drain slopes the wrong way. Children "
      "wade through the water and autos refuse to stop.",
      "Water", "High", "hsr2", "School gate road, Sector 2, HSR Layout, Bengaluru", "In Progress", 10, ("waterlog", 1), 11),
    R("imran", "Leaking borewell pump line flooding the street",
      "The line from the common borewell pump has split and sprays water across the street all morning. The water also seeps into "
      "the shop fronts and the footpath has gone slippery with moss.",
      "Water", "Medium", "jayanagar", "Lane behind the 4th Block complex, Jayanagar, Bengaluru", "Resolved", 12, ("pipeleak", 3), 5,
      fix=(3, "Split section of pipe replaced and the joint sealed. The footpath was cleaned and the road patched.", "after_pipe", 1)),
    R("meera", "Main road submerged near the Silk Board underpass",
      "After yesterday's rain the service road next to the Silk Board underpass was under about a foot of water for four hours. "
      "Two-wheelers stalled and a car got stuck. This happens at every heavy shower.",
      "Water", "Critical", "silkboard", "Service road next to Silk Board underpass, Bengaluru", "Under Review", 6, ("waterlog", 2), 16),
    R("sneha", "Water tanker overflow wasting water every morning",
      "The overhead tank of the building next door overflows for twenty minutes every morning because the float valve is stuck. "
      "The water runs along the lane and into the gutter while the next lane complains of a shortage.",
      "Water", "Low", "hsr7", "2nd Main, Sector 7, HSR Layout, Bengaluru", "Reported", 3, ("waterlog", 3), 3),
    # ------------------------------------------------------------------ Parks
    R("priya", "Broken benches and swings in the neighbourhood park",
      "Several benches have missing planks and one swing chain has snapped. Children play here every evening and the exposed screws on "
      "the benches could hurt someone, so this needs repair soon.",
      "Parks", "Low", "defence", "Defence Colony Park, Indiranagar, Bengaluru", "Resolved", 28, ("bench", 1), 9,
      fix=(7, "Benches re-planked, the swing chain replaced and the area painted. The play area was reopened.", "after_bench", 1)),
    R("nikhil", "Fallen tree blocking half of the park walkway",
      "A large branch came down in last night's wind and lies across the walking path. Walkers have to squeeze past on the lawn and "
      "the jogging track is blocked. The remaining branch above looks cracked.",
      "Parks", "Medium", "defence", "Walking path, Defence Colony Park, Indiranagar, Bengaluru", "Resolved", 9, ("tree", 1), 7,
      fix=(2, "Fallen branch cut up and removed, the cracked limb pruned and the path swept clear.", "after_tree", 1)),
    R("divya", "Park lawn littered after the weekend market",
      "The market stalls leave food waste and plastic cups across the lawn and nobody picks it up before Monday morning, when the "
      "children arrive.",
      "Parks", "Low", "jayanagar", "Jayanagar 4th Block park, Bengaluru", "Reported", 2, ("park", 1), 2),
    R("ayush", "Overgrown branches touching live wires on 4th Cross",
      "A tree has grown right into the overhead electricity lines. In the evening wind the branches spark against the wire. Houses "
      "below lose power every time it blows.",
      "Public Safety", "High", "indiranagar", "4th Cross, Indiranagar, Bengaluru", "Under Review", 7, ("tree", 2), 10),
    # ---------------------------------------------------------- Public Safety
    R("arjun", "Open manhole beside the HSR Sector 2 bus stop",
      "The manhole cover next to the bus stop has been missing for five days. Someone has put a broken chair over it, which is easy to "
      "miss at night. It is right where people wait for the bus.",
      "Public Safety", "Critical", "hsr2", "Bus stop, Sector 2, HSR Layout, Bengaluru", "In Progress", 5, ("manhole", 1), 13),
    R("karan", "Missing railing on the footbridge over the nala",
      "Two sections of railing on the pedestrian bridge are missing. The gap is wide enough for a child to fall through to the nala "
      "below. School children cross here twice a day.",
      "Public Safety", "Critical", "malleshwaram", "Footbridge over the nala, Malleshwaram, Bengaluru", "In Progress", 13, ("manhole", 2), 12),
    R("ananya", "Traffic signal stuck on red at the Double Road junction",
      "The signal on the Double Road side has stayed red for several minutes at a time since Sunday. Drivers have started jumping it, "
      "and the pedestrian crossing is a near miss every few minutes.",
      "Public Safety", "High", "indiranagar", "Double Road junction, Indiranagar, Bengaluru", "Reported", 1, ("streetlight", 3), 4),
    # -------------------------------------------------------------- Community
    R("ananya", "Request: a fortnightly clean-up drive for the Ulsoor Lake edge",
      "The lake edge fills with plastic every weekend. A fortnightly volunteer clean-up with gloves, bags and a collection truck "
      "would keep it from building up. Residents and a couple of NGOs have already offered to join.",
      "Community", "Low", "ulsoor", "Ulsoor Lake edge, Bengaluru", "Under Review", 8, ("cleanup", 1), 8),
    R("priya", "The unused corner plot could become a community garden",
      "The fenced corner plot next to the park has been empty for years and collects weeds and litter. Neighbours would happily "
      "plant and maintain a small community garden with composting if the ward office allows it.",
      "Community", "Low", "indiranagar", "Vacant corner plot next to Defence Colony Park, Bengaluru", "Reported", 4, ("park", 2), 6),
    # ------------------------------------------------- Meera's reports (Koramangala ward champion)
    R("meera", "Streetlight pole leaning dangerously on 5th Block",
      "The pole outside the bakery on 5th Block has tilted about 20 degrees since the last storm and the base is cracked. It leans over the "
      "footpath where people queue every morning, and the lamp has been off for a week.",
      "Streetlights", "High", "koramangala", "5th Block, near the bakery, Koramangala, Bengaluru", "Under Review", 6, ("streetlight", 2), 6),
    R("meera", "Garbage being burnt next to the Koramangala playground",
      "Piles of waste are set alight next to the children's playground most evenings. The smoke blows over the swings and two neighbours "
      "with asthma have complained. The pile is mostly plastic and thermocol.",
      "Sanitation", "High", "koramangala", "Next to the playground, 5th Block, Koramangala, Bengaluru", "In Progress", 9, ("garbage", 3), 7),
    R("meera", "Drain overflow on 7th Main every evening",
      "Between 6 and 8 pm the drain on 7th Main overflows onto the road, even when it has not rained. The water is grey and smells of "
      "detergent, which suggests a connection from a nearby building is dumping into the storm drain.",
      "Water", "High", "koramangala", "7th Main, Koramangala, Bengaluru", "Resolved", 40, ("drain", 1), 8,
      fix=(4, "Illegal connection traced to a commercial building and disconnected. The drain was flushed and a notice issued.", "after_drain", 2)),
    R("meera", "Footpath blocked by parked vehicles and a broken slab",
      "A concrete slab on the footpath has snapped and tilted, and cars park right up against it so pedestrians cannot pass. People walk on "
      "the main road with school buses going by.",
      "Roads", "Medium", "koramangala", "Footpath on 80 Feet Road, Koramangala, Bengaluru", "In Progress", 12, ("footpath", 2), 5),
    R("meera", "Tree roots lifting the pavement on 20th Main",
      "Roots of the rain tree have pushed up the pavement tiles and created a trip hazard. Two elderly neighbours have already stumbled. "
      "We would like the pavement re-laid without harming the tree.",
      "Parks", "Medium", "koramangala", "Pavement on 20th Main, Koramangala, Bengaluru", "Resolved", 33, ("footpath", 3), 4,
      fix=(5, "Pavers lifted, root zone cleared and a ramp built over the roots so the tree is untouched. Pavement re-laid level.", "after_road", 1)),
    R("meera", "Pipeline leak at the Koramangala water tank junction",
      "Clean water has been seeping out of the road at the tank junction for weeks and the tar has started to crumble. The leak sits on "
      "the main line, so the repair needed shutting the supply for a whole zone and clearance from the board.",
      "Water", "High", "koramangala", "Water tank junction, Koramangala, Bengaluru", "Resolved", 57, ("pipeleak", 1), 11,
      fix=(36, "Shutdown arranged after zone-wide notice, the damaged section replaced and the road re-laid. Supply restored the same evening.", "after_pipe", 2)),
    R("meera", "Open drain slab missing on the 3rd Block lane",
      "One slab covering the drain has been missing for ten days. It is right in the middle of the lane and a scooter wheel went in on Sunday. "
      "People have placed a brick as a warning, which is not enough at night.",
      "Public Safety", "Critical", "koramangala", "Lane off 3rd Block main road, Koramangala, Bengaluru", "Resolved", 20, ("manhole", 3), 9,
      fix=(2, "Replacement slab cast and fixed, drain interior checked for damage. Reflective paint added at the edge.", "after_road", 1)),
    R("meera", "Broken swing and rusty slide in the 5th Block play area",
      "The swing seat has come loose on one side and the slide has a sharp, rusted join. Toddlers play here after school. "
      "The ward office needs to replace the swing and sand down or replace the slide.",
      "Parks", "Medium", "koramangala", "5th Block play area, Koramangala, Bengaluru", "In Progress", 15, ("bench", 2), 6),
]

OFFICIAL_COMMENTS = {
    "Under Review": [
        "Received. Forwarded to the {dept} section; a field inspection is scheduled within 48 hours.",
        "Thank you for reporting. The site has been marked for inspection by the {dept} team.",
    ],
    "In Progress": [
        "Work order issued. The crew is scheduled on site this week and we will update here once done.",
        "Material and crew allocated. Work has started on site; barricades will stay until completion.",
    ],
}
DEPT = {"Roads": "roads", "Water": "water supply", "Sanitation": "solid waste", "Streetlights": "electrical",
        "Public Safety": "engineering", "Parks": "horticulture", "Community": "ward office"}

CITIZEN_COMMENTS = [
    "I pass this every day, it really needs attention.",
    "Same problem here, it has got worse since last week.",
    "Confirmed this morning. The photo is accurate.",
    "Upvoted. Many of us in the lane are affected.",
    "Please prioritise, children use this route.",
    "Thank you for reporting this, I was about to post the same thing.",
    "Still there as of this evening.",
    "This has been like this for weeks. Hope the ward office acts now.",
]
THANKS_COMMENTS = [
    "Checked it today. It is properly fixed, thank you!",
    "Great work by the team. It looks much better now.",
    "Confirmed on site. Thank you to everyone who supported this.",
]
