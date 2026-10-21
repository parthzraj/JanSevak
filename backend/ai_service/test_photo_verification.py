"""
Test suite for AI Photo Relevance Check: POST /api/photo/verify
Can be run standalone: python test_photo_verification.py
"""

import io
import unittest
from PIL import Image, ImageDraw
from app.modules.photo_verifier import verify_photo, CIVIC_CATEGORIES


def create_synthetic_image(text: str, color=(200, 200, 200), size=(300, 300)) -> bytes:
    img = Image.new("RGB", size, color=color)
    draw = ImageDraw.Draw(img)
    draw.text((20, size[1] // 2), text, fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


class TestPhotoVerification(unittest.TestCase):

    def test_empty_image_raises_error(self):
        with self.assertRaises(ValueError):
            verify_photo(b"")

    def test_corrupted_image_raises_error(self):
        with self.assertRaises(ValueError):
            verify_photo(b"not_an_image_at_all_corrupt_data")

    def test_too_small_image_raises_error(self):
        with self.assertRaises(ValueError):
            verify_photo(b"123")

    def test_categories_contract(self):
        self.assertEqual(len(CIVIC_CATEGORIES), 7)
        self.assertIn("Roads", CIVIC_CATEGORIES)
        self.assertIn("Water", CIVIC_CATEGORIES)
        self.assertIn("Sanitation", CIVIC_CATEGORIES)
        self.assertIn("Streetlights", CIVIC_CATEGORIES)
        self.assertIn("Public Safety", CIVIC_CATEGORIES)
        self.assertIn("Parks", CIVIC_CATEGORIES)
        self.assertIn("Community", CIVIC_CATEGORIES)

    def test_photo_verification_schema(self):
        # Generate a synthetic non-civic image
        data = create_synthetic_image("Dinner food pizza at restaurant", color=(240, 200, 160))
        result = verify_photo(data, timeout=60)
        self.assertIn("decision", result)
        self.assertIn(result["decision"], ["pass", "reject", "uncertain"])
        self.assertIn("is_civic_issue", result)
        self.assertIsInstance(result["is_civic_issue"], bool)
        self.assertIn("confidence", result)
        self.assertIsInstance(result["confidence"], (int, float))
        self.assertIn("detected_issue", result)
        self.assertIn("suggested_category", result)
        self.assertIn("reason", result)
        self.assertIn("unsafe_content", result)


if __name__ == "__main__":
    unittest.main()
