'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { CHECKLISTS, type ChecklistMode } from '../data/checklists';

// ─── ТИПЫ ────────────────────────────────────────────────────────

export type ChecklistChecks = Record<ChecklistMode, Record<string, boolean>>;

const INITIAL_CHECKS: ChecklistChecks = { us: {}, uc: {}, ex: {}, dq: {} };


// ─── СТАТИСТИКА ──────────────────────────────────────────────────

export interface ChecklistStats {
  total: number;
  checked: number;
  req: number;
  reqChecked: number;
  pct: number;
  missedReq: number;
}

export function getChecklistStats(
  mode: ChecklistMode,
  checks: ChecklistChecks,
): ChecklistStats {
  const cur = CHECKLISTS[mode];
  const st  = checks[mode] ?? {};
  let total = 0, checked = 0, req = 0, reqChecked = 0;

  cur.blocks.forEach(b => {
    b.items.forEach((item, i) => {
      total++;
      if (item.r) req++;
      if (st[b.title + '|' + i]) {
        checked++;
        if (item.r) reqChecked++;
      }
    });
  });

  const pct = total ? Math.round((checked / total) * 100) : 0;
  return { total, checked, req, reqChecked, pct, missedReq: req - reqChecked };
}


// ─── ХУК ─────────────────────────────────────────────────────────

export function useChecklist() {
  const [checks, setChecks] = useLocalStorage<ChecklistChecks>(
    'husky-checklists',
    INITIAL_CHECKS,
  );

  const toggle = useCallback((mode: ChecklistMode, key: string) => {
    setChecks(prev => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [key]: !(prev[mode] ?? {})[key],
      },
    }));
  }, [setChecks]);

  const reset = useCallback((mode: ChecklistMode) => {
    setChecks(prev => ({ ...prev, [mode]: {} }));
  }, [setChecks]);

  const stats = useCallback((mode: ChecklistMode) => {
    return getChecklistStats(mode, checks);
  }, [checks]);

  return { checks, toggle, reset, stats };
}