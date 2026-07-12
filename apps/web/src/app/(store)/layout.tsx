import StoreHeader from '@/components/store/StoreHeader';

export const metadata = {
  title: 'Relevé — Tienda',
  description: 'Personaliza y pide tus productos sublimados: franelas, tazas, gorras, suéteres y más.',
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <StoreHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-400">
          Relevé · Sublimación personalizada · Hecho con 💜
        </div>
      </footer>
    </div>
  );
}
