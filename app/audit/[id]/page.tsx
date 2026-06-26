'use client';

import { use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAudit } from '@/lib/hooks/useAudit';
import { AuditReportView } from '@/components/audit/AuditView';

function ReportContent({ id }: { id: string }) {
  const { history } = useAudit();
  const searchParams = useSearchParams();
  const isFresh = searchParams.get('fresh') === '1';
  const entry = history.find(e => e.id === Number(id)) ?? null;
  return <AuditReportView entry={entry} isFresh={isFresh} />;
}

export default function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <ReportContent id={id} />
    </Suspense>
  );
}
