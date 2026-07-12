import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface Props { id: string; label: string; color: string; count: number; children: React.ReactNode; }

export default function KanbanColumn({ id, label, color, count, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn('flex flex-col w-64 shrink-0 bg-gray-100 rounded-xl border-t-4 transition-colors', color, isOver && 'bg-teal-50')}>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-xs bg-white text-gray-600 rounded-full px-2 py-0.5 font-medium shadow-sm">{count}</span>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-3 min-h-16">{children}</div>
    </div>
  );
}
