"""Standalone Manual Verification Script for Person 1 (AI Service).

Run this with:
    python test_ai_manual.py
"""

import io
import sys
import requests
from PIL import Image, ImageDraw


BASE_URL = "http://localhost:8001"


def create_sample_image() -> bytes:
    """Generate a simple 200x200 PNG representing a simulated pothole in road."""
    img = Image.new("RGB", (200, 200), color=(100, 100, 100))
    draw = ImageDraw.Draw(img)
    # Draw dark oval to look like a pothole
    draw.ellipse([50, 70, 150, 130], fill=(20, 20, 20), outline=(50, 50, 50))
    draw.text((60, 90), "POTHOLE", fill=(200, 200, 200))
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def run_tests():
    print("=" * 60)
    print("   PrajaPulse AI Service (Port 8001) Manual Test Suite")
    print("=" * 60)

    # 1. Health check
    print("\n[1/9] Testing GET / (Health Check)...")
    try:
        r = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        assert r.status_code == 200
        print("PASS")
    except Exception as e:
        print(f"FAIL: {e}")
        print("Is the service running? Start it with:")
        print("  python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload")
        return

    # 2. Chatbot
    print("\n[2/9] Testing POST /api/chatbot...")
    try:
        payload = {
            "message": "There is a massive water leak outside 14th Cross Indiranagar.",
            "history": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi! How can I assist your neighborhood?"}
            ]
        }
        r = requests.post(f"{BASE_URL}/api/chatbot", json=payload, timeout=60)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        assert r.status_code == 200
        print("PASS")
    except Exception as e:
        print(f"FAIL: {e}")

    # 3. Complaint generation
    print("\n[3/9] Testing POST /api/complaint/generate...")
    try:
        payload = {
            "issue": "Overflowing open garbage dumpster",
            "location": "Ward 112, 100ft Road Corner",
            "additional_details": "Stinking badly for 4 days, dogs scattering trash"
        }
        r = requests.post(f"{BASE_URL}/api/complaint/generate", json=payload, timeout=60)
        print(f"Status: {r.status_code}")
        print(f"Sample response:\n{r.json().get('complaint', '')[:200]}...")
        assert r.status_code == 200
        print("PASS")
    except Exception as e:
        print(f"FAIL: {e}")

    # 4. Problem description
    print("\n[4/9] Testing POST /api/problem-description...")
    try:
        payload = {"description": "drain is chock full dirty water coming on street ppl falling"}
        r = requests.post(f"{BASE_URL}/api/problem-description", json=payload, timeout=60)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        assert r.status_code == 200
        print("PASS")
    except Exception as e:
        print(f"FAIL: {e}")

    # 5. Hazard detection (JSON)
    print("\n[5/9] Testing POST /api/hazard-alerts...")
    try:
        payload = {
            "issue": "Live electrical transformer sparking near children park entrance",
            "location": "Ward 112, Defence Colony Park"
        }
        r = requests.post(f"{BASE_URL}/api/hazard-alerts", json=payload, timeout=60)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        assert r.status_code == 200
        print("PASS")
    except Exception as e:
        print(f"FAIL: {e}")

    # 6. Feed prioritization (JSON)
    print("\n[6/9] Testing POST /api/feed/prioritize...")
    try:
        payload = {
            "complaints": [
                {"id": "issue-1", "title": "Faded zebra crossing paint", "category": "Roads"},
                {"id": "issue-2", "title": "Open manhole on dark footpath", "category": "Sanitation"},
                {"id": "issue-3", "title": "Dry tree leaves in park", "category": "Parks"}
            ]
        }
        r = requests.post(f"{BASE_URL}/api/feed/prioritize", json=payload, timeout=60)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        assert r.status_code == 200
        print("PASS")
    except Exception as e:
        print(f"FAIL: {e}")

    # 7. Suggestive remarks (JSON)
    print("\n[7/9] Testing POST /api/suggestive-remarks...")
    try:
        payload = {
            "issue": "Broken storm water drain wall",
            "existing_description": "Water overflowing onto walkway during rain"
        }
        r = requests.post(f"{BASE_URL}/api/suggestive-remarks", json=payload, timeout=60)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        assert r.status_code == 200
        print("PASS")
    except Exception as e:
        print(f"FAIL: {e}")

    # 8. Vision Image Analysis
    print("\n[8/9] Testing POST /api/complaint/analyze-image (requires llava)...")
    try:
        img_bytes = create_sample_image()
        files = {"image": ("test_pothole.png", img_bytes, "image/png")}
        r = requests.post(f"{BASE_URL}/api/complaint/analyze-image", files=files, timeout=120)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        if r.status_code == 200:
            print("PASS")
        else:
            print("NOTE: If status is 503, verify: ollama pull llava")
    except Exception as e:
        print(f"NOTE / FAIL: {e}")

    # 9. Vision Multi-Stage Prepare
    print("\n[9/9] Testing POST /api/complaint/prepare-with-image...")
    try:
        img_bytes = create_sample_image()
        files = {"image": ("test_pothole.png", img_bytes, "image/png")}
        data = {"issue": "Pothole road cave-in", "location": "12th Main Road"}
        r = requests.post(f"{BASE_URL}/api/complaint/prepare-with-image", files=files, data=data, timeout=120)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        if r.status_code == 200:
            print("PASS")
        else:
            print("NOTE: If status is 503, verify: ollama pull llava")
    except Exception as e:
        print(f"NOTE / FAIL: {e}")

    print("\n" + "=" * 60)
    print("   Manual Tests Finished!")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
