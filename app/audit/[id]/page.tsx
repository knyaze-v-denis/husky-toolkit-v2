import { AuditReportClient } from '@/components/audit/AuditReportClient';

export default async function AuditReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fresh?: string }>;
}) {
  const { id } = await params;
  const { fresh } = await searchParams;
  return <AuditReportClient id={id} isFresh={fresh === '1'} />;
}
