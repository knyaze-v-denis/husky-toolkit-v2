'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type AuditEntry, rowToEntry } from '@/lib/hooks/useAudit';
import { AuditReportView } from './AuditView';

export function AuditReportClient({ id, isFresh }: { id: string; isFresh: boolean }) {
  const [entry, setEntry] = useState<AuditEntry | null | 'loading'>('loading');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('audit_entries')
      .select('id, title, created_at, form, result')
      .eq('id', id)
      .single()
      .then(({ data }) => setEntry(data ? rowToEntry(data as Parameters<typeof rowToEntry>[0]) : null));
  }, [id]);

  if (entry === 'loading') return null;
  return <AuditReportView entry={entry} isFresh={isFresh} />;
}
