type AIContext = {
  pendingSync: number;
  activeWorkoutSummary: string;
  recentSummary: string;
};

type ProviderResult = {
  provider: 'groq' | 'gemini' | 'local';
  answer: string;
};

const REQUEST_TIMEOUT_MS = 12000;

function buildPrompt(question: string, context: AIContext): string {
  return [
    'You are VPULZ AI coach.',
    'Give short, practical training advice in 2-5 bullets.',
    `Pending sync actions: ${context.pendingSync}`,
    `Active workout: ${context.activeWorkoutSummary}`,
    `Recent history: ${context.recentSummary}`,
    `Question: ${question}`,
  ].join('\n');
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function parseResponseError(response: Response, providerName: string): Promise<Error> {
  const text = await response.text();
  const detail = text ? text.slice(0, 180) : `${providerName} request failed (${response.status})`;
  return new Error(detail);
}

async function withTransientRetry(fn: () => Promise<string>): Promise<string> {
  try {
    return await fn();
  } catch (error) {
    if (isAbortError(error)) {
      return fn();
    }

    const message = error instanceof Error ? error.message : '';
    const maybeRetryable = /429|5\d\d|timeout|timed out|temporarily|rate/i.test(message);
    if (!maybeRetryable) {
      throw error;
    }

    return fn();
  }
}

async function groqProvider(question: string, context: AIContext): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Groq API key');
  }

  const model = process.env.EXPO_PUBLIC_GROQ_MODEL || 'llama-3.1-8b-instant';
  const content = buildPrompt(question, context);

  const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a performance-focused training coach.' },
        { role: 'user', content },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    if (isRetryableStatus(response.status)) {
      throw new Error(`Groq retryable ${response.status}`);
    }
    throw await parseResponseError(response, 'Groq');
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const answer = payload.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error('Groq empty response');
  }

  return answer;
}

async function geminiProvider(question: string, context: AIContext): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Gemini API key');
  }

  const model = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash-8b';
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: buildPrompt(question, context),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 320,
        },
      }),
    }
  );

  if (!response.ok) {
    if (isRetryableStatus(response.status)) {
      throw new Error(`Gemini retryable ${response.status}`);
    }
    throw await parseResponseError(response, 'Gemini');
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const answer = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!answer) {
    throw new Error('Gemini empty response');
  }

  return answer;
}

function localFallback(question: string, context: AIContext): string {
  const normalized = question.toLowerCase();

  if (normalized.includes('deload') || normalized.includes('fatigue')) {
    return 'Deload by 10-15% for one session and keep movement quality high before ramping load again.';
  }

  if (normalized.includes('increase') || normalized.includes('progress')) {
    return 'Increase one variable only (load +2.5kg or +1 rep) if your previous sets were technically clean.';
  }

  if (context.activeWorkoutSummary !== 'No active workout') {
    return `Finish your current session first, then adjust next block. ${context.activeWorkoutSummary}.`;
  }

  return 'Keep consistency first: hit planned volume this week, then progress next week.';
}

function getProviderOrder(): Array<'groq' | 'gemini'> {
  const raw = process.env.EXPO_PUBLIC_AI_PROVIDER_ORDER?.trim().toLowerCase();
  if (!raw) {
    return ['groq', 'gemini'];
  }

  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is 'groq' | 'gemini' => value === 'groq' || value === 'gemini');

  if (!values.length) {
    return ['groq', 'gemini'];
  }

  return Array.from(new Set(values));
}

export async function getCoachResponse(question: string, context: AIContext): Promise<ProviderResult> {
  const providers = getProviderOrder();

  for (const provider of providers) {
    try {
      if (provider === 'groq') {
        const answer = await withTransientRetry(() => groqProvider(question, context));
        return { provider: 'groq', answer };
      }

      const answer = await withTransientRetry(() => geminiProvider(question, context));
      return { provider: 'gemini', answer };
    } catch {
      continue;
    }
  }

  return { provider: 'local', answer: localFallback(question, context) };
}
