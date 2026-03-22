import type { ConnectionConfig } from './workoutApi';

export type AssistantContextPayload = {
  user_id: string;
  pending_sync: number;
  active_workout?: {
    workout_id: string;
    total_exercises: number;
    total_sets: number;
    started_at: string;
  };
  recent_history: Array<{
    workout_id: string;
    date: string;
    duration_minutes: number;
    total_volume: number;
    total_sets: number;
  }>;
};

export type AssistantAskPayload = {
  question: string;
  context: AssistantContextPayload;
};

export type AssistantResponse = {
  answer: string;
};

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

async function request<T>(config: ConnectionConfig, path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${normalizeBaseUrl(config.baseUrl)}${path.startsWith('/') ? path : `/${path}`}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payloadText = await response.text();
  const payload = payloadText ? (JSON.parse(payloadText) as unknown) : null;

  if (!response.ok) {
    throw new Error(
      typeof payload === 'object' && payload !== null && 'detail' in payload
        ? String((payload as Record<string, unknown>).detail)
        : 'Assistant request failed'
    );
  }

  return payload as T;
}

export async function askAssistant(config: ConnectionConfig, payload: AssistantAskPayload): Promise<AssistantResponse> {
  return request<AssistantResponse>(config, '/assistant/ask', {
    method: 'POST',
    body: payload,
  });
}
