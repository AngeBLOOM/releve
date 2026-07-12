import StoreCatalog from '@/components/store/StoreCatalog';

export default function TiendaPage() {
  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-white drop-shadow">Personaliza lo que imaginas</h1>
        <p className="text-gray-200 mt-2">Franelas, tazas, gorras, suéteres, bolígrafos y más — sublimados a tu gusto.</p>
      </div>
      <StoreCatalog />
    </div>
  );
}
