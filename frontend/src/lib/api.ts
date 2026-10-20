const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const AI_API_BASE_URL = (import.meta.env.VITE_AI_API_URL || 'http://localhost:8001').replace(/\/$/, '');

interface ApiErrorResponse {
  detail?: string;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = `Backend request failed (${response.status})`;
    try {
      const error = (await response.json()) as ApiErrorResponse;
      if (error.detail) message = error.detail;
    } catch {
      // Preserve the HTTP error when the backend did not return JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function aiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${AI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = `AI service request failed (${response.status})`;
    try {
      const error = (await response.json()) as ApiErrorResponse;
      if (error.detail) message = error.detail;
    } catch {
      // Preserve the HTTP error
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function sendChatMessage(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  const response = await aiRequest<{ reply: string }>('/api/chatbot', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
  return response.reply;
}

export async function generateComplaint(input: {
  issue: string;
  location: string;
  additionalDetails?: string;
}): Promise<string> {
  const response = await aiRequest<{ complaint: string }>('/api/complaint/generate', {
    method: 'POST',
    body: JSON.stringify({
      issue: input.issue,
      location: input.location,
      additional_details: input.additionalDetails || '',
    }),
  });
  return response.complaint;
}

export async function improveDescription(description: string): Promise<string> {
  const response = await aiRequest<{ improved_description: string }>('/api/problem-description', {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
  return response.improved_description;
}

export async function analyzeHazard(
  issue: string,
  location: string
): Promise<{
  hazard_type: string;
  severity: string;
  reason: string;
  recommended_action: string;
}> {
  return aiRequest('/api/hazard-alerts', {
    method: 'POST',
    body: JSON.stringify({ issue, location }),
  });
}

export async function getSuggestiveRemarks(
  issue: string,
  existingDescription?: string
): Promise<{
  citizen_actions: string[];
  government_actions: string[];
}> {
  return aiRequest('/api/suggestive-remarks', {
    method: 'POST',
    body: JSON.stringify({ issue, existing_description: existingDescription || '' }),
  });
}

export async function analyzeImage(imageFile: File): Promise<{
  detected_issue: string;
  visual_description: string;
  suggested_category: string;
  suggested_severity: string;
}> {
  const formData = new FormData();
  formData.append('image', imageFile);
  const response = await fetch(`${AI_API_BASE_URL}/api/complaint/analyze-image`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    let message = `Image analysis failed (${response.status})`;
    try {
      const error = (await response.json()) as ApiErrorResponse;
      if (error.detail) message = error.detail;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
}
