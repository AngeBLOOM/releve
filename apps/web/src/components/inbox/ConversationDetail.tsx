'use client';
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const STATUS_LABEL: Record<string, string> = { PENDING_DESIGN: '✏️ Por diseñar', PRINT_QUEUE: '🖨️ En cola', SUBLIMATING: '🔥 Sublimando', READY: '✅ Listo', DELIVERED: '📬 Entregado' };

export default function ConversationDetail({ conversationId }: { conversationId: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/detail`).then(r => r.json()).then(setData).catch(() => {});
  }, [conversationId]);

  if (!data) return <div className="p-4 text-sm text-gray-400">Cargando...</div>;
  const { customer, orders } = data;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-teal-200 text-teal-700 font-bold flex items-center justify-center text-sm">{customer.displayName[0].toUpperCase()}</div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{customer.displayName}</p>
            <p className="text-xs text-gray-400">Cliente desde {format(new Date(customer.createdAt), 'MMM yyyy')}</p>
          </div>
        </div>
        {customer.phone && <p className="text-xs text-gray-500">📱 {customer.phone}</p>}
      </div>
      <div className="px-4 py-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Pedidos ({orders.length})</h4>
        {orders.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin pedidos aún</p>}
        <div className="space-y-2">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-teal-700">{order.orderNumber}</span>
                <Link href={`/orders`} className="text-gray-400 hover:text-teal-600"><ExternalLink size={12} /></Link>
              </div>
              <p className="text-xs text-gray-500 mb-1">{STATUS_LABEL[order.status] ?? order.status}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">${order.total}</span>
                <span className="text-xs text-gray-400">{format(new Date(order.createdAt), 'dd/MM/yy')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-gray-100 mt-auto">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Notas internas</h4>
        <textarea defaultValue={customer.notes ?? ''} onBlur={async e => { await fetch(`/api/customers/${customer.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: e.target.value }) }); }} placeholder="Agregar nota..." rows={3} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none" />
      </div>
    </div>
  );
}
