import DesignsView from '@/components/designs/DesignsView';

export const metadata = { title: 'Diseños — Relevé' };

export default function DesignsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Diseños recibidos</h1>
        <p className="text-sm text-gray-500">Diseños que los clientes prueban y piden desde la tienda.</p>
      </div>
      <DesignsView />
    </div>
  );
}
