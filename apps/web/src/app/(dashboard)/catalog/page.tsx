import CatalogManager from '@/components/catalog/CatalogManager';
export const metadata = { title: 'Catálogo — Relevé' };

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Catálogo de Productos</h1>
      <CatalogManager />
    </div>
  );
}
