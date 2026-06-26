'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAudit } from '@/lib/hooks/useAudit';
import { AuditReportView } from './AuditView';

function ReportContent({ id }: { id: string }) {
  const { history } = useAudit();
  const searchParams = useSearchParams();
  const isFresh = searchParams.get('fresh') === '1';
  const entry = history.find(e => e.id === Number(id)) ?? null;
  return <AuditReportView entry={entry} isFresh={isFresh} />;
}

export function AuditReportClient({ id }: { id: string }) {
  return (
    <Suspense fallback={null}>
      <ReportContent id={id} />
    </Suspense>
  );
}
