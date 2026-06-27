'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  QUESTIONS, BUILDS, RISK_GROUPS,
  getBuildType, getEBSize,
  type Answer, type BuildType, type EBSizeResult,
} from '../data/builder';

// ─── ТИПЫ ────────────────────────────────────────────────────────

export interface BuilderState {
  step: number;
  maxReached: number;
  answers: Record<string, Answer>;
  build: BuildType | null;
  complexity: string | null;
  novelty: string | null;
  risks: Record<string, string[]>;
}

const INITIAL_STATE: BuilderState = {
  step: 1,
  maxReached: 1,
  answers: {},
  build: null,
  complexity: null,
  novelty: null,
  risks: {},
};

function initRisks(risks: Record<string, string[]>): Record<string, string[]> {
  const result = { ...risks };
  RISK_GROUPS.forEach(g => {
    if (!result[g.label]) result[g.label] = [];
  });
  return result;
}


// ─── ХУК ─────────────────────────────────────────────────────────

export function useBuilder() {
  const [state, setState] = useState<BuilderState>({ ...INITIAL_STATE, risks: initRisks({}) });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('builder_state')
      .select('state')
      .single()
      .then(({ data }) => {
        if (data?.state) {
          const loaded = data.state as BuilderState;
          setState({ ...loaded, risks: initRisks(loaded.risks ?? {}) });
        }
      });
  }, []);

  const persist = useCallback((next: BuilderState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('builder_state').upsert(
        { user_id: user?.id, state: next, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    }, 1000);
  }, []);

  const update = useCallback((fn: (prev: BuilderState) => BuilderState) => {
    setState(prev => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, [persist]);

  const calcQScore = useCallback((): number => {
    let s = 0;
    QUESTIONS.forEach(q => {
      const a = state.answers[q.id];
      if (a === 'yes')                           s += q.yes;
      else if (a === 'maybe' && q.maybe != null) s += q.maybe;
      else if (a === 'no')                       s += q.no;
    });
    return s;
  }, [state.answers]);

  const calcEBScore = useCallback((): number => {
    const build = state.build ?? 'min';
    let s = BUILDS[build].ebVol;
    const cp: Record<string, number> = { senior: 0, mid: 1, junior: 2 };
    const np: Record<string, number> = { many: 0, some: 1, none: 2 };
    if (state.complexity) s += cp[state.complexity] ?? 0;
    if (state.novelty)    s += np[state.novelty]    ?? 0;
    RISK_GROUPS.forEach(g => {
      (state.risks[g.label] ?? []).forEach(v => {
        const item = g.items.find(x => x.v === v);
        if (item && !item.none) s += item.p;
      });
    });
    return s;
  }, [state]);

  const ebSizeResult = useCallback((): EBSizeResult => {
    return getEBSize(calcEBScore());
  }, [calcEBScore]);

  const setAnswer = useCallback((id: string, answer: Answer) => {
    update(prev => ({ ...prev, answers: { ...prev.answers, [id]: answer } }));
  }, [update]);

  const goToStep = useCallback((n: number) => {
    update(prev => {
      const next = { ...prev, step: n, maxReached: Math.max(prev.maxReached, n) };
      if (n === 2) next.build = getBuildType(calcQScore());
      return next;
    });
  }, [update, calcQScore]);

  const setFactor = useCallback((key: 'complexity' | 'novelty', value: string) => {
    update(prev => ({ ...prev, [key]: value }));
  }, [update]);

  const toggleRisk = useCallback((group: string, v: string, isNone: boolean) => {
    update(prev => {
      const sel = prev.risks[group] ?? [];
      let next: string[];
      if (isNone) {
        next = sel.includes(v) ? [] : [v];
      } else {
        const exclusive: Record<string, string> = { cmp1: 'cmp2', cmp2: 'cmp1' };
        let filtered = sel.filter(x => {
          const it = RISK_GROUPS.find(g => g.label === group)?.items.find(i => i.v === x);
          return it && !it.none;
        });
        if (exclusive[v]) filtered = filtered.filter(x => x !== exclusive[v]);
        const idx = filtered.indexOf(v);
        if (idx > -1) filtered.splice(idx, 1); else filtered.push(v);
        next = filtered;
      }
      return { ...prev, risks: { ...prev.risks, [group]: next } };
    });
  }, [update]);

  const reset = useCallback(() => {
    update(() => ({ ...INITIAL_STATE, risks: initRisks({}) }));
  }, [update]);

  const resetFactors = useCallback(() => {
    update(prev => ({ ...prev, complexity: null, novelty: null, risks: initRisks({}) }));
  }, [update]);

  return {
    state,
    calcQScore,
    calcEBScore,
    ebSizeResult,
    setAnswer,
    goToStep,
    setFactor,
    toggleRisk,
    reset,
    resetFactors,
  };
}
