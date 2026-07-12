import ReportsDashboard from '@/components/reports/ReportsDashboard';
export const metadata = { title: 'Reportes — Relevé' };

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Reportes y Métricas</h1>
      <ReportsDashboard />
    </div>
  );
}
