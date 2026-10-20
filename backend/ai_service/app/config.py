import os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

TEXT_MODEL = os.getenv("TEXT_MODEL", "llama3.2:3b")
VISION_MODEL = os.getenv("VISION_MODEL", "llava")

TEXT_TIMEOUT = int(os.getenv("TEXT_TIMEOUT", "120"))
VISION_TIMEOUT = int(os.getenv("VISION_TIMEOUT", "300"))
