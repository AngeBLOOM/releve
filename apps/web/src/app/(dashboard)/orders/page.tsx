import KanbanBoard from '@/components/orders/KanbanBoard';
export const metadata = { title: 'Pedidos — Relevé' };

export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Producción</h1>
      <KanbanBoard />
    </div>
  );
}
