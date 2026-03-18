const API_URL = import.meta.env.VITE_API_URL || '';

function getApiKey() {
  return localStorage.getItem('apiKey') || '';
}

async function request(endpoint, body) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getApiKey(),
      'Accept-Language': localStorage.getItem('APP_LANG') || navigator.language || 'en-US',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function generatePlan(bodyPart, specialRequest, measurements) {
  return request('/api/generate-plan', {
    body_part: bodyPart,
    special_request: specialRequest || '',
    user_body_measurements: measurements,
  });
}

export function saveWorkout(data) {
  return request('/api/save-workout', data);
}

export function chatWithAi(messages) {
  return request('/api/chat', { messages });
}

export function suggestAlternatives(exerciseName, bodyPart, reason, currentPlan) {
  return request('/api/suggest-alternatives', {
    exercise_name: exerciseName,
    body_part: bodyPart,
    reason: reason || '',
    current_plan: currentPlan || [],
  });
}
