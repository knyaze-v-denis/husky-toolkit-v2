'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
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
  const [state, setState] = useLocalStorage<BuilderState>(
    'husky-builder',
    { ...INITIAL_STATE, risks: initRisks({}) },
  );

  // Вычисление суммы баллов опросника
  const calcQScore = useCallback((): number => {
    let s = 0;
    QUESTIONS.forEach(q => {
      const a = state.answers[q.id];
      if (a === 'yes')                      s += q.yes;
      else if (a === 'maybe' && q.maybe != null) s += q.maybe;
      else if (a === 'no')                  s += q.no;
    });
    return s;
  }, [state.answers]);

  // Вычисление баллов ЭБ
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

  // Установить ответ на вопрос
  const setAnswer = useCallback((id: string, answer: Answer) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [id]: answer },
    }));
  }, [setState]);

  // Перейти на шаг (определяет билд на шаге 2)
  const goToStep = useCallback((n: number) => {
    setState(prev => {
      const next = { ...prev, step: n, maxReached: Math.max(prev.maxReached, n) };
      if (n === 2) {
        const score = calcQScore();
        next.build = getBuildType(score);
      }
      return next;
    });
  }, [setState, calcQScore]);

  // Установить фактор ЭБ (complexity / novelty)
  const setFactor = useCallback((key: 'complexity' | 'novelty', value: string) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, [setState]);

  // Переключить риск
  const toggleRisk = useCallback((group: string, v: string, isNone: boolean) => {
    setState(prev => {
      const sel = prev.risks[group] ?? [];
      let next: string[];

      if (isNone) {
        next = sel.includes(v) ? [] : [v];
      } else {
        // Взаимоисключающие пункты компонентов
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
  }, [setState]);

  // Сброс
  const reset = useCallback(() => {
    setState({ ...INITIAL_STATE, risks: initRisks({}) });
  }, [setState]);

  const resetFactors = useCallback(() => {
    setState(prev => ({ ...prev, complexity: null, novelty: null, risks: initRisks({}) }));
  }, [setState]);

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