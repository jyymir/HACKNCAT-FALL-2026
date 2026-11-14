/** Browser client for the local /api/ai proxy. The Gemini key never reaches the browser. */

export interface AiStatus {
  enabled: boolean;
  model?: string;
}

let statusPromise: Promise<AiStatus> | null = null;

/** Cached check. Resolves to disabled if the proxy is missing (e.g. a static build) or offline. */
export function getAiStatus(): Promise<AiStatus> {
  statusPromise ??= fetch('/api/ai/status')
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .then((j) => ({ enabled: Boolean(j.enabled), model: j.model }))
    .catch(() => ({ enabled: false }));
  return statusPromise;
}

// Simple in-memory cache so repeating a demo question is instant and doesn't depend on the network twice.
const cache = new Map<string, unknown>();

async function post<T>(path: string, body: unknown): Promise<T> {
  const cacheKey = path + JSON.stringify(body);
  if (cache.has(cacheKey)) return cache.get(cacheKey) as T;
  let r: Response;
  try {
    r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('Couldn’t reach the AI assistant. Check your internet connection.');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `AI request failed (${r.status})`);
  cache.set(cacheKey, j);
  return j as T;
}

export const askAi = (question: string, context: unknown) => post<{ text: string; model?: string }>('/api/ai/ask', { question, context });

export const whatIfAi = (request: string, fields: unknown) =>
  post<{ changes: unknown; explanation: string; model?: string }>('/api/ai/whatif', { request, fields });
