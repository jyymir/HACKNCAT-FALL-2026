import type { Assumptions } from '../engine/types';
import { ALL_FIELDS, FIELD_BY_KEY } from '../data/fields';

/** Field descriptions sent to Gemini, in STORED units (fractions 0–1). */
export function describeFields(a: Assumptions) {
  return ALL_FIELDS.map((f) => {
    const scale = f.scale ?? 1;
    return {
      key: f.key,
      label: f.label,
      unit: scale === 100 ? `fraction 0–1 (shown to users as %)` : f.unit,
      min: f.min / scale,
      max: f.max / scale,
      current: a[f.key],
    };
  });
}

export interface AppliedChange {
  key: keyof Assumptions;
  label: string;
  unit: string;
  from: number; // display units
  to: number; // display units
  clamped: boolean;
}

/**
 * Never trust model output: keep only known keys and finite numbers, clamp to the same
 * ranges the sliders allow, and drop no-op changes. Returns the proposed next assumptions.
 */
export function validateChanges(raw: unknown, a: Assumptions): { next: Assumptions; applied: AppliedChange[]; rejected: string[] } {
  const next = { ...a };
  const applied: AppliedChange[] = [];
  const rejected: string[] = [];
  const list = Array.isArray(raw) ? raw : [];

  for (const item of list) {
    const key = (item as { key?: unknown })?.key;
    const value = Number((item as { value?: unknown })?.value);
    const def = typeof key === 'string' ? FIELD_BY_KEY.get(key as keyof Assumptions) : undefined;
    if (!def) {
      rejected.push(`Unknown setting “${String(key)}”`);
      continue;
    }
    if (!Number.isFinite(value)) {
      rejected.push(`${def.label}: not a number`);
      continue;
    }
    const scale = def.scale ?? 1;
    const shown = value * scale;
    const clampedShown = Math.min(def.max, Math.max(def.min, shown));
    const to = Math.round(clampedShown * 1e4) / 1e4;
    const from = Math.round(a[def.key] * scale * 1e4) / 1e4;
    if (to === from) continue;
    next[def.key] = to / scale;
    applied.push({ key: def.key, label: def.label, unit: def.unit, from, to, clamped: clampedShown !== shown });
  }
  return { next, applied, rejected };
}
