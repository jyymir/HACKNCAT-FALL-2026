import type { Assumptions } from '../engine/types';
import { DEFAULT_ASSUMPTIONS } from './demoCustomers';

/** A user-saved scenario: full settings plus the demand model it was saved with. */
export interface SavedScenario {
  id: string;
  name: string;
  assumptions: Assumptions;
  seasonal: boolean;
  savedAt: string; // ISO timestamp
}

const KEY = 'heatmatch.savedScenarios.v1';

/**
 * Saved scenarios live in this browser only (localStorage). Every access is guarded so the app
 * still works in private windows or when storage is blocked; scenarios just won't persist there.
 */
export function loadSaved(): SavedScenario[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedScenario[]) : [];
    // Fill in any settings added after the scenario was saved, so old saves keep working.
    return Array.isArray(list) ? list.map((s) => ({ ...s, assumptions: { ...DEFAULT_ASSUMPTIONS, ...s.assumptions } })) : [];
  } catch {
    return [];
  }
}

export function persistSaved(list: SavedScenario[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

export const newId = () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
