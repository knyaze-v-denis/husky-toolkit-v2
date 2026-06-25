'use client';

import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

// ─── ТИПЫ ────────────────────────────────────────────────────────

export interface AuditSectionItem {
  status: 'ok' | 'warn' | 'fail';
  text: string;
}

export interface AuditSection {
  title: string;
  status: 'ok' | 'warn' | 'fail';
  items: AuditSectionItem[];
}

export interface AuditResult {
  score: number;
  summary: string;
  sections: AuditSection[];
  issues: string[];
  recommendations: string[];
  questions: string[];
}

export interface AuditEntry {
  id: number;
  date: string;
  time: string;
  title: string;
  link: string;
  us: string;
  desc: string;
  result: AuditResult;
}

export interface AuditForm {
  title: string;
  link: string;
  us: string;
  desc: string;
}

const EMPTY_FORM: AuditForm = { title: '', link: '', us: '', desc: '' };
const MAX_HISTORY = 20;


// ─── ХУК ─────────────────────────────────────────────────────────

export function useAudit() {
  const [history, setHistory] = useLocalStorage<AuditEntry[]>('husky-audit-history', []);
  const [form, setForm] = useState<AuditForm>(EMPTY_FORM);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = useCallback((patch: Partial<AuditForm>) => {
    setForm(prev => ({ ...prev, ...patch }));
  }, []);

  const runAudit = useCallback(async () => {
    if (!form.title.trim()) {
      setError('Укажите название задачи — оно используется в истории аудитов и экспорте.');
      return;
    }
    if (form.us.trim().length + form.desc.trim().length < 30) {
      setError('Заполните хотя бы одно поле описания — текст слишком короткий для анализа.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ us: form.us, desc: form.desc }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msgs: Record<number, string> = {
          400: 'Описание слишком короткое. Добавьте больше деталей.',
          429: 'Слишком много запросов. Подождите минуту и попробуйте снова.',
          500: 'Внутренняя ошибка. Попробуйте ещё раз.',
          502: 'Не удалось получить ответ от модели. Попробуйте через несколько секунд.',
        };
        setError(msgs[response.status] ?? data.error ?? 'Что-то пошло не так. Попробуйте ещё раз.');
        return;
      }

      setResult(data);

      const entry: AuditEntry = {
        id:   Date.now(),
        date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        title: form.title,
        link:  form.link,
        us:    form.us,
        desc:  form.desc,
        result: data,
      };

      setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY));

    } catch {
      setError('Нет соединения с сервером. Проверьте интернет и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  }, [form, setHistory]);

  const openEntry = useCallback((entry: AuditEntry) => {
    setForm({ title: entry.title, link: entry.link, us: entry.us, desc: entry.desc });
    setResult(entry.result);
    setError(null);
  }, []);

  const deleteEntry = useCallback((id: number) => {
    setHistory(prev => prev.filter(e => e.id !== id));
  }, [setHistory]);

  const resetAudit = useCallback(() => {
    setForm(EMPTY_FORM);
    setResult(null);
    setError(null);
  }, []);

  return {
    form, updateForm,
    result, loading, error,
    history,
    runAudit, openEntry, deleteEntry, resetAudit,
  };
}