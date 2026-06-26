'use client';

import { useAudit } from '@/lib/hooks/useAudit';
import { AuditReportView } from './AuditView';

export function AuditReportClient({ id, isFresh }: { id: string; isFresh: boolean }) {
  const { history } = useAudit();
  const entry = history.find(e => e.id === Number(id)) ?? null;
  return <AuditReportView entry={entry} isFresh={isFresh} />;
}
