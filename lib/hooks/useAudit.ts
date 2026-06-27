'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  id: string;
  date: string;
  time: string;
  title: string;
  link: string;
  usAs: string;
  usWant: string;
  usTo: string;
  desc: string;
  result: AuditResult;
}

export interface AuditForm {
  title: string;
  link: string;
  usAs: string;
  usWant: string;
  usTo: string;
  desc: string;
}

const EMPTY_FORM: AuditForm = { title: '', link: '', usAs: '', usWant: '', usTo: '', desc: '' };

export function rowToEntry(row: { id: string; title: string; created_at: string; form: AuditForm; result: AuditResult }): AuditEntry {
  const d = new Date(row.created_at);
  return {
    id: row.id,
    date: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    title: row.title,
    link: row.form.link ?? '',
    usAs: row.form.usAs ?? '',
    usWant: row.form.usWant ?? '',
    usTo: row.form.usTo ?? '',
    desc: row.form.desc ?? '',
    result: row.result,
  };
}

// ─── ХУК ─────────────────────────────────────────────────────────

export function useAudit() {
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [form, setForm] = useState<AuditForm>(EMPTY_FORM);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('audit_entries')
      .select('id, title, created_at, form, result')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setHistory(data.map(rowToEntry));
      });
  }, []);

  const updateForm = useCallback((patch: Partial<AuditForm>) => {
    setForm(prev => ({ ...prev, ...patch }));
  }, []);

  const runAudit = useCallback(async (): Promise<string | null> => {
    if (!form.title.trim()) {
      setError('Укажите название задачи — оно используется в истории аудитов и экспорте.');
      return null;
    }
    const us = [form.usAs && `Как ${form.usAs}`, form.usWant && `я хочу ${form.usWant}`, form.usTo && `чтобы ${form.usTo}`].filter(Boolean).join(', ');
    if (us.trim().length + form.desc.trim().length < 30) {
      setError('Заполните хотя бы одно поле описания — текст слишком короткий для анализа.');
      return null;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ us, desc: form.desc }),
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
        return null;
      }

      setResult(data);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: inserted, error: dbError } = await supabase
        .from('audit_entries')
        .insert({ user_id: user?.id, title: form.title, form: { link: form.link, usAs: form.usAs, usWant: form.usWant, usTo: form.usTo, desc: form.desc }, result: data })
        .select('id, title, created_at, form, result')
        .single();

      if (dbError || !inserted) {
        setError('Аудит выполнен, но не удалось сохранить в историю.');
        return null;
      }

      const entry = rowToEntry(inserted);
      setHistory(prev => [entry, ...prev].slice(0, 20));
      return entry.id;

    } catch {
      setError('Нет соединения с сервером. Проверьте интернет и попробуйте снова.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [form]);

  const openEntry = useCallback((entry: AuditEntry) => {
    setForm({ title: entry.title, link: entry.link, usAs: entry.usAs, usWant: entry.usWant, usTo: entry.usTo, desc: entry.desc });
    setResult(entry.result);
    setError(null);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from('audit_entries').delete().eq('id', id);
    setHistory(prev => prev.filter(e => e.id !== id));
  }, []);

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
