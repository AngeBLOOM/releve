import CustomersView from '@/components/customers/CustomersView';
export const metadata = { title: 'Clientes — Relevé' };

export default function CustomersPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
      <CustomersView />
    </div>
  );
}
