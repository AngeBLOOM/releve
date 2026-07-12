'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PAYMENT_BADGE: Record<string, string> = { PENDING: 'bg-red-100 text-red-600', PARTIAL: 'bg-yellow-100 text-yellow-700', PAID: 'bg-green-100 text-green-700' };

interface Props { order: { id: string; orderNumber: string; customer: { displayName: string }; total: number; items: Array<{ quantity: number; variant: { label: string } }>; createdAt: string; paymentStatus: string; } }

export default function OrderCard({ order }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn('bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing', isDragging && 'opacity-50 shadow-lg ring-2 ring-teal-400')}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-teal-700">{order.orderNumber}</span>
        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', PAYMENT_BADGE[order.paymentStatus] ?? 'bg-gray-100 text-gray-500')}>{order.paymentStatus === 'PAID' ? 'Pagado' : order.paymentStatus === 'PARTIAL' ? '50%' : 'Pendiente'}</span>
      </div>
      <p className="text-sm font-medium text-gray-800 truncate">{order.customer.displayName}</p>
      <div className="mt-2 space-y-0.5">
        {order.items.slice(0, 2).map((item, i) => <p key={i} className="text-xs text-gray-500 truncate">{item.quantity}× {item.variant.label}</p>)}
        {order.items.length > 2 && <p className="text-xs text-gray-400">+{order.items.length - 2} más</p>}
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <span className="text-sm font-bold text-gray-900">${order.total}</span>
        <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}</span>
      </div>
    </div>
  );
}
