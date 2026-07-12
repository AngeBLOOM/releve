'use client';
import { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import OrderCard from './OrderCard';

export const COLUMNS = [
  { id: 'PENDING_DESIGN', label: '✏️ Por Diseñar',  color: 'border-t-yellow-400' },
  { id: 'PRINT_QUEUE',    label: '🖨️ Cola',          color: 'border-t-blue-400'   },
  { id: 'SUBLIMATING',    label: '🔥 Sublimando',    color: 'border-t-orange-400' },
  { id: 'READY',          label: '✅ Listo',          color: 'border-t-green-400'  },
  { id: 'DELIVERED',      label: '📬 Entregado',      color: 'border-t-gray-400'   },
] as const;

type ColumnId = typeof COLUMNS[number]['id'];

interface Order { id: string; orderNumber: string; status: ColumnId; customer: { displayName: string }; total: number; items: Array<{ quantity: number; variant: { label: string } }>; createdAt: string; paymentStatus: string; }

export default function KanbanBoard() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => { fetch('/api/orders?limit=200').then(r => r.json()).then(setOrders).catch(() => {}); }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const orderId = active.id as string;
    const newStatus = over.id as ColumnId;
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    await fetch(`/api/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
  }

  const byColumn = (colId: ColumnId) => orders.filter(o => o.status === colId);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <KanbanColumn key={col.id} id={col.id} label={col.label} color={col.color} count={byColumn(col.id).length}>
            <SortableContext items={byColumn(col.id).map(o => o.id)} strategy={verticalListSortingStrategy}>
              {byColumn(col.id).map(order => <OrderCard key={order.id} order={order} />)}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>
    </DndContext>
  );
}
