# Demo data for JanSevak

Fills the app with realistic data so every feature can be shown. No logic is changed; it only writes rows through the existing tables.

## Apply (Windows / PowerShell, from the repo root)
1. Unzip `demo_data_pack.zip` over the project (adds `backend/core_api/demo/`, `demo_data.py`, `tests/test_demo_data.py`, this file).
2. Optional but recommended, real photos (needs internet, free, Wikimedia Commons):
   `cd backend\core_api`
   `.\.venv\Scripts\python.exe -m demo.fetch_photos`
   Open `demo_assets\photos\index.html`, delete any photo that looks wrong, re-run with `--redo` (or `--only pothole`).
   You can also drop your own images named like `pothole_1.jpg`, `garbage_2.jpg`. Without photos, labelled placeholders are drawn.
3. Load the data (WIPES the database):
   `.\.venv\Scripts\python.exe demo_data.py --reset`
4. Restart with `run.bat`.

## Logins (password `demo123` for all)
Citizens: ayush (main demo account, Gold, 738 pts), priya, meera, rahul, arjun, sneha, imran, divya, karan, lakshmi, nikhil, ananya, tara, vikram, zoya
Officials: official, official2. NGOs: ngo, ngo2.

## What you get
19 users, 41 reports (14 resolved with before/after), 244 upvotes, 159 comments, 6 courses with 23 enrollments and 12 certificates, 5 contests (2 finished with winners), 6 vacancies, 10 applications, 12 drives (7 completed), points/tiers/badges computed consistently with the rewards rules.
