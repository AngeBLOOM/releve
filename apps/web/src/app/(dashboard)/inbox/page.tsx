import { Suspense } from 'react';
import InboxView from '@/components/inbox/InboxView';
export const metadata = { title: 'Bandeja — Relevé' };

export default function InboxPage() {
  return (
    <div className="h-full -m-6">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-400">Cargando...</div>}>
        <InboxView />
      </Suspense>
    </div>
  );
}
