import { useEffect, useState, type FormEvent } from 'react';
import type { Assumptions, CandidateResult } from '../engine/types';
import { askAi, getAiStatus, whatIfAi, type AiStatus } from '../ai/client';
import { describeFields, validateChanges, type AppliedChange } from '../ai/whatif';

function useAiStatus(): AiStatus | null {
  const [s, setS] = useState<AiStatus | null>(null);
  useEffect(() => {
    getAiStatus().then(setS);
  }, []);
  return s;
}

function AiOff() {
  return (
    <div className="ai-off">
      ✨ AI assistant is off. <span className="muted">Add GEMINI_API_KEY to .env.local to enable.</span>
    </div>
  );
}

const AiTag = ({ model }: { model?: string }) => <span className="ai-tag">✨ AI-generated{model ? ` · ${model}` : ''}</span>;

/** Renders a short plain-text/markdown-ish answer safely (no HTML injection). */
function AnswerText({ text }: { text: string }) {
  const lines = text.replace(/\*\*/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-*•]\s/.test(l));
  return (
    <div className="ai-answer-text">
      {lines.filter((l) => !/^[-*•]\s/.test(l)).map((l, i) => (
        <p key={i}>{l}</p>
      ))}
      {bullets.length > 0 && (
        <ul>
          {bullets.map((l, i) => (
            <li key={i}>{l.replace(/^[-*•]\s/, '')}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

const WHATIF_EXAMPLES = [
  { label: 'Electricity 50% pricier', q: 'What if electricity got 50% more expensive?' },
  { label: 'Pipes cost double', q: 'What if pipes cost twice as much?' },
  { label: 'Only a 4 MW data center', q: 'What if the data center were only 4 MW?' },
];

/** Natural-language what-if → validated setting changes → user confirms → engine recalculates. */
export function WhatIfBox({ assumptions, onApply }: { assumptions: Assumptions; onApply: (a: Assumptions) => void }) {
  const status = useAiStatus();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<{ next: Assumptions; applied: AppliedChange[]; rejected: string[]; explanation: string; model?: string } | null>(null);
  const [undo, setUndo] = useState<Assumptions | null>(null);

  if (status === null) return null;
  if (!status.enabled) return <AiOff />;

  const submit = async (q: string, e?: FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setText(q);
    setBusy(true);
    setError(null);
    setProposal(null);
    setUndo(null);
    try {
      const r = await whatIfAi(q, describeFields(assumptions));
      setProposal({ ...validateChanges(r.changes, assumptions), explanation: r.explanation, model: r.model });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card ai-card">
      <div className="card-title">✨ Ask a what-if</div>
      <div className="card-sub">AI suggests setting changes. You approve them.</div>
      <form className="ai-form" onSubmit={(e) => submit(text, e)}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. What if electricity got 50% more expensive?" maxLength={300} aria-label="What-if question" />
        <button className="pill dark" disabled={busy || !text.trim()}>
          {busy ? 'Thinking…' : 'Try it'}
        </button>
      </form>
      <div className="ai-examples">
        {WHATIF_EXAMPLES.map((x) => (
          <button key={x.label} className="chip" onClick={() => submit(x.q)} disabled={busy}>
            {x.label}
          </button>
        ))}
      </div>

      {error && <div className="ai-error">{error}</div>}

      {proposal && (
        <div className="ai-answer">
          <AiTag model={proposal.model ?? status.model} />
          {proposal.explanation && <p>{proposal.explanation}</p>}
          {proposal.applied.length > 0 ? (
            <>
              <ul className="ai-changes">
                {proposal.applied.map((c) => (
                  <li key={c.key}>
                    <strong>{c.label}</strong>: {c.from} → <b>{c.to}</b> {c.unit}
                    {c.clamped && <em> (kept within the allowed range)</em>}
                  </li>
                ))}
              </ul>
              <div className="ai-actions">
                <button
                  className="pill dark"
                  onClick={() => {
                    setUndo(assumptions);
                    onApply(proposal.next);
                    setProposal(null);
                  }}
                >
                  Apply these changes
                </button>
                <button className="pill ghost" onClick={() => setProposal(null)}>
                  Discard
                </button>
              </div>
            </>
          ) : (
            <p className="muted">No settings were changed.</p>
          )}
          {proposal.rejected.length > 0 && <p className="muted">Ignored: {proposal.rejected.join('; ')}</p>}
        </div>
      )}

      {undo && (
        <div className="ai-applied">
          ✓ Changes applied. All pages are updated.{' '}
          <button
            className="linklike"
            onClick={() => {
              onApply(undo);
              setUndo(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
    </section>
  );
}

function suggestions(r: CandidateResult, top: CandidateResult): string[] {
  const base =
    r.status === 'Promising'
      ? ['Why is this a good match?', 'What could make it worse?']
      : r.status === 'Marginal'
        ? ['Why is this only a possible match?', 'What settings would make it a good match?']
        : ['Why doesn’t this work?', 'What would have to change for it to work?'];
  if (r.customer.id !== top.customer.id) base.push(`How does it compare to ${top.customer.name}?`);
  return base;
}

/** Q&A about the selected building, grounded in engine outputs only. */
export function AskBox({ selected, ranked, buildContext }: { selected: CandidateResult; ranked: CandidateResult[]; buildContext: () => unknown }) {
  const status = useAiStatus();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<{ q: string; text: string; model?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === null) return null;
  if (!status.enabled) return <AiOff />;

  const ask = async (question: string, e?: FormEvent) => {
    e?.preventDefault();
    if (!question.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await askAi(question, buildContext());
      setAnswer({ q: question, text: r.text, model: r.model });
      setQ('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card ai-card">
      <div className="card-title">✨ Ask about {selected.customer.name}</div>
      <div className="card-sub">Answers use only this tool’s own numbers.</div>
      <div className="ai-examples">
        {suggestions(selected, ranked[0]).map((s) => (
          <button key={s} className="chip" onClick={() => ask(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>
      <form className="ai-form" onSubmit={(e) => ask(q, e)}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about this building…" maxLength={300} aria-label="Question" />
        <button className="pill dark" disabled={busy || !q.trim()}>
          {busy ? 'Thinking…' : 'Ask'}
        </button>
      </form>
      {error && <div className="ai-error">{error}</div>}
      {answer && (
        <div className="ai-answer">
          <AiTag model={answer.model ?? status.model} />
          <div className="ai-q">“{answer.q}”</div>
          <AnswerText text={answer.text} />
          <p className="fineprint">AI can be wrong. The numbers above are the source of truth.</p>
        </div>
      )}
    </section>
  );
}
