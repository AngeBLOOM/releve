import StoreHeader from '@/components/store/StoreHeader';

export const metadata = {
  title: 'Relevé — Tienda',
  description: 'Personaliza y pide tus productos sublimados: franelas, tazas, gorras, suéteres y más.',
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #6b7280 0%, #4b5563 55%, #374151 100%)' }}>
      {/* Detalles blancos: puntitos sutiles + brillo suave */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1.6px)', backgroundSize: '26px 26px' }} />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(1000px 500px at 50% -8%, rgba(255,255,255,0.22), transparent 70%)' }} />
      <div className="relative z-10 flex flex-col min-h-screen">
        <StoreHeader />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-white/10 bg-black/10 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-300">
            Relevé · Sublimación personalizada · Hecho con 💜
          </div>
        </footer>
      </div>
    </div>
  );
}
