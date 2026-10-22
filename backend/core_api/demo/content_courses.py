"""Civic Academy demo courses: the three from seed_data.py plus three more, all reading + task lessons."""
import copy

from seed_data import SEED_COURSES

EXTRA_COURSES = [
    dict(
        title="Reporting a Civic Problem So It Gets Fixed", level="Beginner", category="Civic basics",
        summary="What makes a report easy to act on: a clear photo, an exact place and a short, factual description.",
        description="Officials see hundreds of complaints a week. The ones that get fixed first are the ones that are easy to verify and easy to find. This course shows what a strong report contains and how to follow it up.",
        lessons=[
            dict(kind="reading", title="Anatomy of a report that gets action", summary="The four things every report needs.",
                 body=("A good report answers four questions: what is wrong, where exactly, how bad is it and who does it affect. Start the title with the problem and the place: 'Pothole on 12th Main below metro pillar 112' beats 'Road problem'.\n\n"
                       "Add a photo that shows the problem and something that identifies the place, such as a shop sign, a pillar number or a junction board. Stand where a passer-by would stand, in daylight if you can. "
                       "Do not edit the picture; the ward office compares it with what the inspector finds.\n\n"
                       "In the description give size and duration ('two feet wide, open for nine days'), the risk ('a rider fell here last week') and the exact landmark. Keep it factual. Anger makes a report easy to dismiss, details make it hard to.")),
            dict(kind="reading", title="Follow up without nagging", summary="Supporting, adding evidence and recognising a fix.",
                 body=("After you file, the best thing neighbours can do is support the report and add evidence: another photo from a different angle, a later date, or a comment confirming it is still there. Many supporters tell the ward office that the problem is shared, not personal.\n\n"
                       "Check the status timeline. 'Under Review' means someone has looked at it; 'In Progress' means a work order is out. If it stays in one status for a long time, add a short comment with a new photo rather than filing a duplicate.\n\n"
                       "When it is fixed, confirm it. A fix that is checked by the person who reported it is far more reliable than one that is only marked done.")),
            dict(kind="task", title="Draft one strong report", summary="An online task: write a report about a real problem near you.", task_mode="online", proof_type="text",
                 instructions="Pick a real civic problem near you. Write the title, the exact location with a landmark, a two or three sentence description with size and duration, and say who it affects. Do not file it here; this is practice."),
        ],
    ),
    dict(
        title="Spotting and Fixing Household Water Leaks", level="Beginner", category="Water",
        summary="Find silent leaks, read your water meter and know when a leak is the utility's job.",
        description="A dripping tap or a running cistern can waste thousands of litres a month, and a leaking supply line outside your gate wastes far more. Learn the checks that take ten minutes.",
        lessons=[
            dict(kind="reading", title="The ten-minute leak check", summary="Using the water meter to find leaks you cannot see.",
                 body=("Close every tap and make sure no one uses water, then look at your water meter. If the small dial or the last digit keeps moving, water is leaking somewhere after the meter.\n\n"
                       "Check the usual suspects: toilet cisterns (put a few drops of food colour in the tank; if colour appears in the bowl without flushing, the flush valve leaks), dripping taps and shower heads, and the float valve of the overhead tank, which causes the 'tank overflows every morning' problem.\n\n"
                       "A damp patch on a wall or ground that stays wet in dry weather usually points to a buried pipe. Switch off the supply to that part of the building and see whether the patch stops spreading.")),
            dict(kind="reading", title="Your leak or the utility's leak?", summary="Who fixes what, and what to report.",
                 body=("Pipes inside your plot and after the meter are your responsibility. A leak on the road, at the meter box or on the main line is the water utility's. If you see clean water running on a public road, report it with a photo and the nearest landmark right away: every hour wastes thousands of litres and can wash out the road base.\n\n"
                       "When you report, say whether the water is clean or dirty, since dirty water suggests sewage mixing with the supply. Mention how long it has been running and whether supply upstairs has dropped.")),
            dict(kind="task", title="Do the leak check at home", summary="A physical task: check one tap or cistern and photograph the result.", task_mode="physical", proof_type="photo",
                 instructions="Do the leak check on one toilet cistern or tap at home or at a neighbour's. Take one photo of the meter, the dye test or the repaired fitting. The NGO checks that the photo shows a real fixture."),
        ],
    ),
    dict(
        title="Urban Trees: Plant, Protect, Report", level="Beginner", category="Environment",
        summary="Choose the right native tree, plant it properly and know what to report when a tree is at risk.",
        description="City trees cool streets, hold soil and give birds a home, but they are damaged by paving, wiring and careless pruning. This course covers planting and what is and is not allowed.",
        lessons=[
            dict(kind="reading", title="Right tree, right place", summary="Native species, spacing and the first year of care.",
                 body=("Pick native, long-lived species that suit the space: neem, pongamia, jamun and tamarind for wide roadsides; smaller flowering trees like Indian cork or bauhinia near buildings. Avoid fast-growing exotics that drop heavy branches in storms.\n\n"
                       "Leave at least three metres from buildings and keep clear of overhead wires and drains. Dig a pit about 60 cm deep and wide, mix the soil with compost, plant at the same depth as the sapling grew in its bag, and water deeply. A guard and a stake protect it from cattle and wind.\n\n"
                       "Water twice a week in dry weather for the first year and mulch with dry leaves to hold moisture.")),
            dict(kind="reading", title="Pruning, wires and what to report", summary="What is not allowed and who to call.",
                 body=("Trees should not be cut, felled or heavily trimmed without permission from the tree officer of the municipal body. Concreting right up to the trunk, nailing boards to the bark and burning waste at the base all damage a tree slowly.\n\n"
                       "Report a tree to the ward office if branches touch live wires, if a large limb is cracked or hanging, or if you see illegal felling. Note the exact location, take a photo that shows the problem and keep people away from the area until it is made safe.")),
            dict(kind="task", title="Plant or adopt a sapling", summary="A physical task: show a sapling you planted or adopted.", task_mode="physical", proof_type="photo",
                 instructions="Plant a native sapling or adopt one that needs care (stake, guard, water). Take one photo of the sapling with its guard or stake and something that shows the location. Planting on private land with permission is fine."),
        ],
    ),
]


def all_courses():
    return copy.deepcopy(SEED_COURSES) + copy.deepcopy(EXTRA_COURSES)
