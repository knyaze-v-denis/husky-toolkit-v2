import { AuditReportClient } from '@/components/audit/AuditReportClient';

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AuditReportClient id={id} />;
}
