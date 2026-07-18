'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Submission {
  id: string;
  createdAt: string;
  source: string;
  designUrl: string;
  garment?: string;
  colors?: string;
  customerName?: string;
  phone?: string;
  status: string;
}

const STATUS = {
  NUEVO: { label: 'Nuevo', cls: 'bg-teal-100 text-teal-700' },
  VISTO: { label: 'Visto', cls: 'bg-gray-100 text-gray-600' },
  ATENDIDO: { label: 'Atendido', cls: 'bg-green-100 text-green-700' },
} as const;

export default function DesignsView() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch('/api/design-submissions')
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function setStatus(id: string, status: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    await fetch(`/api/design-submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  }

  async function remove(id: string) {
    if (!confirm('¿Borrar este diseño?')) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/design-submissions/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  if (loading) return <p className="text-sm text-gray-400">Cargando diseños…</p>;
  if (!items.length)
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
        Aún no hay diseños recibidos. Cuando un cliente pruebe un diseño en el simulador y pida por WhatsApp, aparecerá aquí. 🎨
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it) => {
        const st = STATUS[it.status as keyof typeof STATUS] ?? STATUS.NUEVO;
        return (
          <div key={it.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
            <a href={it.designUrl} target="_blank" rel="noopener noreferrer" className="block bg-gray-50 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.designUrl} alt="Diseño del cliente" className="w-full h-full object-contain" />
            </a>
            <div className="p-3 space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{format(new Date(it.createdAt), "d MMM HH:mm", { locale: es })}</span>
                  <button onClick={() => remove(it.id)} title="Borrar" className="text-gray-300 hover:text-red-500 text-xs">✕</button>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-800">{it.garment ?? 'Diseño'} · <span className="text-gray-400 font-normal">{it.source}</span></p>
              {it.colors && <p className="text-xs text-gray-500">{it.colors}</p>}
              <div className="flex gap-2 pt-1 mt-auto">
                <a href={it.designUrl} download target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center text-xs font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-1.5">Ver / Descargar</a>
                {it.status !== 'ATENDIDO' ? (
                  <button onClick={() => setStatus(it.id, 'ATENDIDO')} className="text-xs font-medium border border-gray-200 hover:bg-gray-50 rounded-lg px-2">✓ Atendido</button>
                ) : (
                  <button onClick={() => setStatus(it.id, 'NUEVO')} className="text-xs font-medium border border-gray-200 hover:bg-gray-50 rounded-lg px-2">↺</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
