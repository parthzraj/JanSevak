
from app.complaint_generator.generator import generate_complaint

print("Testing PrajaPulse AI Complaint Generator...\n")

try:
    complaint = generate_complaint(
        issue="Garbage has been accumulating on the road",
        location="Sector 62, Noida",
        additional_details="The garbage is causing inconvenience to pedestrians."
    )

    print("GENERATED COMPLAINT")
    print("-" * 40)
    print(complaint)

except Exception as error:
    print("Error:", error)
