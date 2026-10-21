"""Quiz content lives on the server so answers never reach the browser before submission."""

QUIZZES: list[dict] = [{'id': 'quiz-1',
  'title': 'Solid Waste Segregation Master',
  'category': 'Sanitation',
  'description': 'Test your understanding of 2-bin-1-bag waste classification and home composting '
                 'essentials.',
  'points_reward': 40,
  'estimated_minutes': 3,
  'questions': [{'question': 'Which of the following items belongs in the RED (Domestic Hazardous) sanitary '
                             'bag?',
                 'options': ['Banana peels and vegetable scraps',
                             'Used baby diapers and bandages',
                             'Cardboard packaging',
                             'Glass bottles'],
                 'answer_index': 1,
                 'explanation': 'Sanitary waste such as diapers, sanitary pads, and medical bandages are '
                                'categorized as Domestic Hazardous waste and must be wrapped separately.'},
                {'question': 'Should pizza boxes with grease oil stains be placed in the dry paper recycling '
                             'bin?',
                 'options': ['Yes, paper is always recyclable',
                             'No, food grease contaminates paper fibers; tear greasy parts for compost or '
                             'reject',
                             'Only if washed thoroughly with soap',
                             'It belongs in the e-waste bin'],
                 'answer_index': 1,
                 'explanation': 'Grease oil prevents paper pulp fibers from binding during recycling. '
                                'Heavily greased sections should be composted or disposed with rejects.'},
                {'question': 'What is the ideal moisture level in an aerobic home compost bin?',
                 'options': ['Bone dry like sand',
                             'Damp like a wrung-out sponge',
                             'Waterlogged and soupy',
                             'Completely sealed with no air'],
                 'answer_index': 1,
                 'explanation': 'Aerobic bacteria thrive when compost has roughly 50% moisture—moist like a '
                                'wrung-out sponge—with plenty of air circulation.'},
                {'question': 'Where should discarded tubelights and CFL bulbs be handed over?',
                 'options': ['General dry waste truck',
                             'Authorized E-Waste / Hazardous collection centre',
                             'Buried in park soil',
                             'Flushed in drain'],
                 'answer_index': 1,
                 'explanation': 'CFLs and tubelights contain toxic mercury vapor and must be delivered '
                                'safely to designated hazardous or e-waste collection drives.'}]},
 {'id': 'quiz-2',
  'title': 'Water Conservation & Rainwater Harvesting',
  'category': 'Water',
  'description': 'Learn urban water resilience, recharge wells, and leak prevention techniques.',
  'points_reward': 35,
  'estimated_minutes': 2,
  'questions': [{'question': 'A single leaky tap dripping at one drip per second wastes approximately how '
                             'much water per day?',
                 'options': ['Less than 1 liter', 'Around 20 to 30 liters', 'Zero liters', '1000 liters'],
                 'answer_index': 1,
                 'explanation': 'A tap dripping once a second wastes over 20-30 liters of potable water '
                                'daily, or over 9,000 liters a year.'},
                {'question': 'What is the primary function of an urban groundwater recharge well?',
                 'options': ['To extract deep borewell water directly',
                             'To filter and channel rooftop rainwater directly into the shallow aquifer',
                             'To dispose of greywater from washing machines',
                             'To store tap water for summer gardening'],
                 'answer_index': 1,
                 'explanation': 'Recharge wells act like unconfined aquifer recharge points, replenishing '
                                'shallow water tables and preventing urban flood runoff.'},
                {'question': 'Installing aerators on bathroom faucets reduces water flow by what percentage '
                             'without losing pressure feel?',
                 'options': ['5% to 10%', '30% to 50%', '80% to 95%', 'Aerators do not reduce water flow'],
                 'answer_index': 1,
                 'explanation': 'Faucet aerators mix air into the water stream, cutting flow by 30-50% while '
                                'maintaining effective washing pressure.'}]},
 {'id': 'quiz-3',
  'title': 'Citizen Rights & RTI 101',
  'category': 'Public Awareness',
  'description': 'Understand how Ward Committees, RTI applications, and citizen charters work.',
  'points_reward': 50,
  'estimated_minutes': 3,
  'questions': [{'question': 'Under the Right to Information (RTI) Act 2005, what is the standard time limit '
                             'for an authority to respond?',
                 'options': ['7 days', '30 days', '90 days', '1 year'],
                 'answer_index': 1,
                 'explanation': 'Section 7(1) of the RTI Act mandates that information must be provided '
                                'within 30 days of receiving the application (48 hours if concerning life '
                                'and liberty).'},
                {'question': 'Who is eligible to attend a monthly Ward Committee meeting in your local '
                             'municipal ward?',
                 'options': ['Only elected corporators',
                             'Any citizen residing in the ward (it is a constitutionally open platform)',
                             'Only government registered contractors',
                             'Only police officers'],
                 'answer_index': 1,
                 'explanation': 'The 74th Constitutional Amendment empowers Ward Committees as participatory '
                                'platforms open to local citizens and residents.'},
                {'question': 'What is a "Citizen Charter" issued by a municipal corporation?',
                 'options': ['A tax penalty notice',
                             'A published commitment detailing standard delivery timelines for civic '
                             'services',
                             'A property lease agreement',
                             'A voter registration form'],
                 'answer_index': 1,
                 'explanation': 'A Citizen Charter outlines the standard turnaround times (e.g. 48h for '
                                'streetlight repair, 7 days for birth certificate) that civic bodies pledge '
                                'to adhere to.'}]}]

QUIZ_BY_ID = {q["id"]: q for q in QUIZZES}
