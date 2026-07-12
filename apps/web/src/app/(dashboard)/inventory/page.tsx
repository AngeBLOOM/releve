import InventoryTable from '@/components/inventory/InventoryTable';
import LowStockBanner from '@/components/inventory/LowStockBanner';
export const metadata = { title: 'Inventario — Relevé' };

export default function InventoryPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Inventario de Insumos</h1>
      <LowStockBanner />
      <InventoryTable />
    </div>
  );
}
