/**
 * Local Gemini proxy, mounted inside the Vite dev/preview server (not a separate backend).
 * The API key is read from GEMINI_API_KEY (e.g. in .env.local) and never sent to the browser.
 *
 *   GET  /api/ai/status  → { enabled, model }
 *   POST /api/ai/ask     → { text }                body: { question, context }
 *   POST /api/ai/whatif  → { changes, explanation } body: { request, fields }
 *
 * Gemini only explains and interprets. All numbers come from the deterministic engine.
 */
import type { Connect, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

const MAX_BODY = 64 * 1024;
const TIMEOUT_MS = 12_000; // per attempt
const OVERALL_BUDGET_MS = 45_000; // across all retries and fallback models

const ASK_SYSTEM = `You are the plain-language explainer inside "Lenovo HeatMatch", a prototype tool that screens whether nearby buildings could reuse waste heat from an AI data center.
Rules:
- Your reader is a non-expert. Use short, everyday sentences. Answer in 2–5 sentences or up to 5 short bullet points.
- Use ONLY the numbers and facts in the provided JSON context. Never invent buildings, data, prices, or results. If the context doesn't contain what is needed, say so.
- Never compute new savings or paybacks yourself. If the user asks "what would make X work", point to which settings on the "Set up" page they could change (e.g. pipe cost, electricity price, water temperature) and explain the direction of the effect.
- All buildings and values are fictional, illustrative demo data. Mention this if the user treats them as real.
- Do not give engineering, legal, or investment advice. This is a screening aid.
- HeatMatch is a concept prototype, not an existing Lenovo product.`;

const WHATIF_SYSTEM = `You translate a user's "what if" question into changes to the settings of a waste-heat screening model.
Rules:
- Only change settings the user actually asked about. Use the exact "key" values provided.
- Values must be in the STORED unit given for each field (fractions are 0–1, not percent).
- Relative wording is relative to the current value: "50% more expensive" means current × 1.5; "halve" means current × 0.5; "double" means current × 2.
- Stay within each field's min/max.
- If the request cannot be expressed with these settings (e.g. adding a new building), return no changes and explain why in one sentence.
- "explanation" is one or two plain-language sentences describing what you changed.`;

type Json = Record<string, unknown>;

function readBody(req: IncomingMessage): Promise<Json> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('Request too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: Json) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/** Error from a single Gemini call, carrying the HTTP status so we can decide whether to retry. */
class GeminiHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Overloaded / rate-limited / transient server errors (and timeouts) are worth retrying or falling back on. */
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

async function callOnce(apiKey: string, model: string, system: string, userText: string, generationConfig: Json): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: ctrl.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: { temperature: 0.2, ...generationConfig },
      }),
    });
    const data = (await r.json().catch(() => ({}))) as Json;
    if (!r.ok) {
      const msg = String((data.error as Json | undefined)?.message ?? `HTTP ${r.status}`);
      throw new GeminiHttpError(r.status, msg);
    }
    const parts = ((data.candidates as Json[] | undefined)?.[0]?.content as Json | undefined)?.parts as { text?: string }[] | undefined;
    const text = (parts ?? []).map((p) => p.text ?? '').join('').trim();
    if (!text) throw new GeminiHttpError(503, 'Gemini returned an empty answer');
    return text;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw new GeminiHttpError(504, 'Gemini took too long to respond.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Google returns these (with 400/403/404) when a model ID is retired, renamed or not enabled for the key. */
const UNAVAILABLE_MSG = /no longer available|not found|not supported|is not available|deprecated|retired|update your code to use/i;

function isModelUnavailable(err: unknown): boolean {
  if (!(err instanceof GeminiHttpError)) return false;
  return err.status === 404 || ([400, 403].includes(err.status) && UNAVAILABLE_MSG.test(err.message));
}

/**
 * Try each model in order.
 *  - Busy/transient error (429/5xx/timeout): retry the primary model once, then move on.
 *  - Model retired / not available to this key: skip straight to the next model.
 *  - Anything else (bad key, bad request): stop and report it.
 */
async function callGemini(apiKey: string, models: string[], system: string, userText: string, generationConfig: Json = {}) {
  const deadline = Date.now() + OVERALL_BUDGET_MS;
  let lastErr: unknown;
  let sawBusy = false;
  const unavailable: string[] = [];

  for (const [index, model] of models.entries()) {
    const attempts = index === 0 ? 2 : 1;
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (Date.now() > deadline) break;
      try {
        const text = await callOnce(apiKey, model, system, userText, generationConfig);
        return { text, model };
      } catch (err) {
        lastErr = err;
        const status = err instanceof GeminiHttpError ? err.status : 0;
        if (isModelUnavailable(err)) {
          console.warn(`[gemini] ${model} unavailable (${status}): ${(err as Error).message}`);
          unavailable.push(model);
          break; // next model
        }
        if (!RETRYABLE.has(status)) throw err; // bad key, bad request, etc.
        sawBusy = true;
        console.warn(`[gemini] ${model} attempt ${attempt + 1} failed (${status}): ${(err as Error).message}`);
        if (attempt + 1 < attempts) await wait(800 + Math.random() * 400);
      }
    }
  }

  if (sawBusy) throw new Error('Gemini is very busy right now. Please try again in a minute. Everything else in HeatMatch still works.');
  if (unavailable.length === models.length) {
    throw new Error(`None of the configured Gemini models are available to this API key (${unavailable.join(', ')}). Set GEMINI_MODEL in .env.local to a current model.`);
  }
  throw lastErr instanceof Error ? lastErr : new Error('Gemini request failed');
}

export function geminiProxy(env: Record<string, string>): Plugin {
  const apiKey = env.GEMINI_API_KEY ?? '';
  const primary = env.GEMINI_MODEL || 'gemini-3.6-flash';
  // Fallbacks used when the primary model is overloaded. Override with a comma-separated list.
  const fallbacks = (env.GEMINI_FALLBACK_MODELS || 'gemini-3.8-flash,gemini-3.5-flash-lite,gemini-flash-latest')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  const models = [primary, ...fallbacks.filter((m) => m !== primary)];
  const model = primary;

  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    const path = (req.url ?? '').split('?')[0];
    if (!path.startsWith('/api/ai/')) return next();
    try {
      if (path === '/api/ai/status' && req.method === 'GET') return send(res, 200, { enabled: Boolean(apiKey), model });
      if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
      if (!apiKey) return send(res, 503, { error: 'AI assistant is off: GEMINI_API_KEY is not set.' });
      const body = await readBody(req);

      if (path === '/api/ai/ask') {
        const question = String(body.question ?? '').slice(0, 1000);
        if (!question.trim()) return send(res, 400, { error: 'Please type a question.' });
        const out = await callGemini(apiKey, models, ASK_SYSTEM, `CONTEXT (JSON):\n${JSON.stringify(body.context)}\n\nQUESTION:\n${question}`);
        return send(res, 200, { text: out.text, model: out.model });
      }

      if (path === '/api/ai/whatif') {
        const request = String(body.request ?? '').slice(0, 1000);
        const fields = Array.isArray(body.fields) ? (body.fields as Json[]) : [];
        if (!request.trim()) return send(res, 400, { error: 'Please describe a what-if.' });
        const keys = fields.map((f) => String(f.key));
        const schema = {
          type: 'OBJECT',
          properties: {
            changes: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: { key: { type: 'STRING', enum: keys }, value: { type: 'NUMBER' } },
                required: ['key', 'value'],
              },
            },
            explanation: { type: 'STRING' },
          },
          required: ['changes', 'explanation'],
        };
        const out = await callGemini(apiKey, models, WHATIF_SYSTEM, `SETTINGS (JSON):\n${JSON.stringify(fields)}\n\nWHAT-IF:\n${request}`, {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0,
        });
        let parsed: Json;
        try {
          parsed = JSON.parse(out.text);
        } catch {
          return send(res, 502, { error: 'Gemini returned an unreadable answer. Try rephrasing.' });
        }
        return send(res, 200, { changes: Array.isArray(parsed.changes) ? parsed.changes : [], explanation: String(parsed.explanation ?? ''), model: out.model });
      }

      return send(res, 404, { error: 'Unknown AI endpoint' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return send(res, 502, { error: msg });
    }
  };

  return {
    name: 'heatmatch-gemini-proxy',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
