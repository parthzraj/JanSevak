import json
import logging
import re
import requests
from typing import Any, Dict, List, Optional
from app import config

logger = logging.getLogger(__name__)


def call_ollama_text(prompt: str, json_mode: bool = False, timeout: Optional[int] = None) -> str:
    """Send a text prompt to Ollama and return the generated string response."""
    url = f"{config.OLLAMA_URL.rstrip('/')}/api/generate"
    payload = {
        "model": config.TEXT_MODEL,
        "prompt": prompt,
        "stream": False,
    }
    if json_mode:
        payload["format"] = "json"

    timeout_val = timeout or config.TEXT_TIMEOUT

    try:
        response = requests.post(url, json=payload, timeout=timeout_val)
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as err:
            raise ConnectionError(f"Ollama returned HTTP {response.status_code}: {response.text[:200]}") from err
        data = response.json()
        if "response" not in data:
            raise ValueError(f"Ollama returned unexpected payload: {data}")
        resp_text = data["response"].strip()
        if not resp_text:
            raise ValueError("Ollama returned an empty response. The model may have failed to generate output.")
        return resp_text
    except requests.exceptions.ConnectionError as err:
        raise ConnectionError(f"Could not connect to Ollama at {config.OLLAMA_URL}. Ensure Ollama is running.") from err
    except requests.exceptions.Timeout as err:
        raise TimeoutError(f"Ollama request timed out after {timeout_val}s.") from err


def call_ollama_json(prompt: str, max_retries: int = 3) -> Dict[str, Any]:
    """Call Ollama in JSON mode and parse the returned JSON.

    Retries with a stricter prompt if Ollama returns malformed JSON.
    """
    current_prompt = prompt
    last_error = None

    for attempt in range(max_retries + 1):
        raw_text = call_ollama_text(current_prompt, json_mode=True)
        raw_text = re.sub(r'^```(?:json)?\s*', '', raw_text)
        raw_text = re.sub(r'\s*```$', '', raw_text)
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as e:
            last_error = e
            logger.warning(
                "Ollama returned invalid JSON (attempt %d/%d): %s",
                attempt + 1,
                max_retries + 1,
                raw_text[:200],
            )
            current_prompt = (
                f"{prompt}\n\nIMPORTANT: Your previous response was not valid JSON. "
                f"You MUST return ONLY a valid, parseable JSON object. No Markdown, no explanation, no backticks."
            )

    raise ValueError(f"AI returned invalid JSON after {max_retries + 1} attempts: {last_error}")


def call_ollama_vision(prompt: str, image_base64: str, timeout: Optional[int] = None) -> str:
    """Send an image + prompt to Ollama LLaVA and return the text response."""
    url = f"{config.OLLAMA_URL.rstrip('/')}/api/generate"
    payload = {
        "model": config.VISION_MODEL,
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
    }

    timeout_val = timeout or config.VISION_TIMEOUT

    try:
        response = requests.post(url, json=payload, timeout=timeout_val)
        response.raise_for_status()
        data = response.json()
        if "response" not in data:
            raise ValueError(f"Ollama returned unexpected payload: {data}")
        return data["response"].strip()
    except requests.exceptions.ConnectionError as err:
        raise ConnectionError(f"Could not connect to Ollama at {config.OLLAMA_URL}. Ensure Ollama is running.") from err
    except requests.exceptions.Timeout as err:
        raise TimeoutError(f"Ollama vision request timed out after {timeout_val}s.") from err
