const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

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

export async function sendChatMessage(message: string): Promise<string> {
  const response = await request<{ reply: string }>('/api/chatbot', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return response.reply;
}

export async function generateComplaint(input: {
  issue: string;
  location: string;
  additionalDetails?: string;
}): Promise<string> {
  const response = await request<{ complaint: string }>('/api/complaint/generate', {
    method: 'POST',
    body: JSON.stringify({
      issue: input.issue,
      location: input.location,
      additional_details: input.additionalDetails || '',
    }),
  });
  return response.complaint;
}
