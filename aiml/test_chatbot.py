
from app.chatbot.chatbot import chat_with_prajapulse

print("Testing PrajaPulse Chatbot...\n")

try:
    answer = chat_with_prajapulse(
        "There is a large pothole near my house. What should I include in my complaint?"
    )

    print("CHATBOT RESPONSE")
    print("-" * 40)
    print(answer)

except Exception as error:
    print("Error:", error)
