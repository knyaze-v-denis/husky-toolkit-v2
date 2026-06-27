'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  const [checks, setChecks] = useState<ChecklistChecks>(INITIAL_CHECKS);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('checklist_states')
      .select('mode, checked')
      .then(({ data }) => {
        if (!data?.length) return;
        const loaded: ChecklistChecks = { ...INITIAL_CHECKS };
        data.forEach(row => {
          if (row.mode in loaded) loaded[row.mode as ChecklistMode] = row.checked;
        });
        setChecks(loaded);
      });
  }, []);

  const save = useCallback(async (mode: ChecklistMode, checked: Record<string, boolean>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('checklist_states').upsert(
      { user_id: user?.id, mode, checked, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,mode' },
    );
  }, []);

  const toggle = useCallback((mode: ChecklistMode, key: string) => {
    setChecks(prev => {
      const next = {
        ...prev,
        [mode]: { ...prev[mode], [key]: !(prev[mode] ?? {})[key] },
      };
      save(mode, next[mode]);
      return next;
    });
  }, [save]);

  const reset = useCallback((mode: ChecklistMode) => {
    setChecks(prev => {
      const next = { ...prev, [mode]: {} };
      save(mode, {});
      return next;
    });
  }, [save]);

  const stats = useCallback((mode: ChecklistMode) => {
    return getChecklistStats(mode, checks);
  }, [checks]);

  return { checks, toggle, reset, stats };
}
