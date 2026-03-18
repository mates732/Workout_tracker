const defaultHeaders = (apiKey) => ({
  "Content-Type": "application/json",
  "x-api-key": apiKey,
});

async function request(baseUrl, path, apiKey, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...defaultHeaders(apiKey),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.detail || `Request failed with ${response.status}`);
  }
  return data;
}

export const getProfile = (baseUrl, apiKey, userId) => request(baseUrl, `/profile/${userId}`, apiKey);
export const updateProfile = (baseUrl, apiKey, userId, payload) =>
  request(baseUrl, `/profile/${userId}`, apiKey, { method: "PUT", body: JSON.stringify(payload) });

export const startWorkout = (baseUrl, apiKey, userId) =>
  request(baseUrl, "/workouts/start", apiKey, { method: "POST", body: JSON.stringify({ user_id: userId }) });

export const getActiveWorkout = (baseUrl, apiKey, userId) => request(baseUrl, `/workouts/active/${userId}`, apiKey);
export const getWorkoutHistory = (baseUrl, apiKey, userId) => request(baseUrl, `/workouts/history/${userId}`, apiKey);
export const getAnalytics = (baseUrl, apiKey, userId) => request(baseUrl, `/analytics/progress/${userId}`, apiKey);

export const addExerciseToWorkout = (baseUrl, apiKey, workoutId, exerciseName) =>
  request(baseUrl, `/workouts/${workoutId}/exercise`, apiKey, {
    method: "POST",
    body: JSON.stringify({ exercise_name: exerciseName }),
  });

export const logSet = (baseUrl, apiKey, workoutId, payload) =>
  request(baseUrl, `/workouts/${workoutId}/set`, apiKey, { method: "POST", body: JSON.stringify(payload) });

export const finishWorkout = (baseUrl, apiKey, workoutId) =>
  request(baseUrl, `/workouts/${workoutId}/finish`, apiKey, { method: "POST" });

export const askAssistant = (baseUrl, apiKey, payload) =>
  request(baseUrl, "/assistant/ask", apiKey, { method: "POST", body: JSON.stringify(payload) });

export const searchExercises = (baseUrl, apiKey, payload) =>
  request(baseUrl, "/exercises/search", apiKey, { method: "POST", body: JSON.stringify(payload) });

export const createCustomExercise = (baseUrl, apiKey, payload) =>
  request(baseUrl, "/exercises/custom", apiKey, { method: "POST", body: JSON.stringify(payload) });
