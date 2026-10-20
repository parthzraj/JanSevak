import os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

TEXT_MODEL = os.getenv("TEXT_MODEL", "llama3.2:3b")
VISION_MODEL = os.getenv("VISION_MODEL", "llava")

TEXT_TIMEOUT = int(os.getenv("TEXT_TIMEOUT", "120"))
VISION_TIMEOUT = int(os.getenv("VISION_TIMEOUT", "300"))

MAX_INPUT_TEXT_LENGTH = 2000
MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024  # 20MB
MIN_IMAGE_SIZE_BYTES = 1024  # 1KB
MODEL_WARMUP_ON_STARTUP = bool(os.getenv("MODEL_WARMUP", "true").lower() == "true")

