'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Search } from 'lucide-react';

// Los mismos pasos que ve el negocio en su tablero de Producción.
const STEPS = [
  { key: 'PENDING_DESIGN', label: 'Diseñando', emoji: '🎨', desc: 'Estamos preparando tu diseño' },
  { key: 'PRINT_QUEUE',    label: 'En cola',   emoji: '🖨️', desc: 'Tu diseño está listo, esperando turno de impresión' },
  { key: 'SUBLIMATING',    label: 'Sublimando',emoji: '🔥', desc: '¡Lo estamos produciendo!' },
  { key: 'READY',          label: 'Listo',     emoji: '✅', desc: 'Tu pedido está listo' },
  { key: 'DELIVERED',      label: 'Entregado', emoji: '🎁', desc: '¡Entregado! Gracias por tu compra 💜' },
];

interface TrackedOrder {
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveryType: string;
  total: string;
  items: Array<{ quantity: number; variant: { label: string; baseProduct: { name: string; imageUrl: string | null } } }>;
}

export default function OrderTracker({ initialNumber }: { initialNumber?: string }) {
  const [numero, setNumero] = useState(initialNumber ?? '');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function buscar(n?: string) {
    const q = (n ?? numero).trim();
    if (!q) return;
    setLoading(true); setError(''); setOrder(null);
    try {
      const res = await fetch(`/api/shop/orders/${encodeURIComponent(q)}`);
      if (res.ok) setOrder(await res.json());
      else setError('No encontramos ese pedido. Revisa el número e intenta de nuevo.');
    } catch {
      setError('No pudimos consultar tu pedido. Intenta en un momento.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (initialNumber) buscar(initialNumber); /* eslint-disable-next-line */ }, [initialNumber]);

  const cancelado = order?.status === 'CANCELLED';
  const activeIdx = order ? STEPS.findIndex(s => s.key === order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Sigue tu pedido</h1>
        <p className="text-sm text-gray-300 mt-1">Escribe el número que te dimos al hacer tu compra.</p>
      </div>

      <div className="flex gap-2">
        <input
          value={numero}
          onChange={e => setNumero(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') buscar(); }}
          placeholder="Número de pedido"
          className="flex-1 rounded-xl px-4 py-3 text-sm bg-white/95 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <button
          onClick={() => buscar()}
          disabled={loading || !numero.trim()}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium px-5 rounded-xl transition-colors"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Buscar
        </button>
      </div>

      {error && <p className="text-sm text-red-100 bg-red-500/30 border border-red-300/40 rounded-xl px-4 py-3 text-center">{error}</p>}

      {order && (
        <div className="bg-white rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="text-center border-b border-gray-100 pb-4">
            <p className="text-xs text-gray-500">Pedido</p>
            <p className="text-lg font-bold text-gray-900">{order.orderNumber}</p>
          </div>

          {cancelado ? (
            <p className="text-center text-sm text-red-600 bg-red-50 rounded-xl py-4">
              Este pedido fue cancelado. Si crees que es un error, escríbenos por WhatsApp 💜
            </p>
          ) : (
            <ol className="space-y-3">
              {STEPS.map((step, i) => {
                const hecho = i < activeIdx;
                const actual = i === activeIdx;
                return (
                  <li key={step.key} className="flex items-start gap-3">
                    <div className={[
                      'w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                      hecho ? 'bg-teal-600 text-white'
                        : actual ? 'bg-teal-100 text-teal-700 ring-4 ring-teal-200'
                        : 'bg-gray-100 text-gray-400',
                    ].join(' ')}>
                      {hecho ? <Check size={16} /> : step.emoji}
                    </div>
                    <div className="pt-1">
                      <p className={actual ? 'text-sm font-bold text-teal-700' : hecho ? 'text-sm font-medium text-gray-700' : 'text-sm text-gray-400'}>
                        {step.label} {actual && <span className="ml-1 text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full align-middle">Aquí vas</span>}
                      </p>
                      {(actual || hecho) && <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {order.items?.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Tu pedido</p>
              <ul className="space-y-1.5">
                {order.items.map((it, i) => (
                  <li key={i} className="flex justify-between text-sm text-gray-700">
                    <span>{it.quantity}× {it.variant?.baseProduct?.name ?? 'Producto'} <span className="text-gray-400">· {it.variant?.label}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-center text-xs text-gray-400">
            ¿Dudas? Escríbenos por WhatsApp y te ayudamos 💜
          </p>
        </div>
      )}

      <div className="text-center">
        <Link href="/tienda" className="text-teal-200 hover:text-white text-sm font-medium">← Volver a la tienda</Link>
      </div>
    </div>
  );
}
