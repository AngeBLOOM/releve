'use client';
import { useState } from 'react';
import { Search, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const CHANNEL_ICON: Record<string, string> = { WHATSAPP: '📱', INSTAGRAM: '📸', MESSENGER: '💬' };
const STATUS_COLOR: Record<string, string> = { BOT_ACTIVE: 'bg-green-100 text-green-700', HUMAN_TAKEOVER: 'bg-amber-100 text-amber-700', CLOSED: 'bg-gray-100 text-gray-500' };

interface Conversation { id: string; channel: string; status: string; updatedAt: string; customer: { displayName: string }; messages: Array<{ content: string; direction: string }>; }
interface Props { conversations: Conversation[]; activeId: string | null; onSelect: (id: string) => void; }

export default function ConversationList({ conversations, activeId, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'BOT_ACTIVE' | 'HUMAN_TAKEOVER'>('all');

  const filtered = conversations.filter(c => {
    const matchSearch = c.customer.displayName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Bandeja</h2>
          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">{conversations.filter(c => c.status === 'HUMAN_TAKEOVER').length} esperando</span>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'HUMAN_TAKEOVER', 'BOT_ACTIVE'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn('flex-1 text-xs py-1 rounded-md font-medium transition-colors', filter === f ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {f === 'all' ? 'Todos' : f === 'HUMAN_TAKEOVER' ? 'Humano' : 'Bot'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {filtered.length === 0 && <p className="text-center text-sm text-gray-400 py-10">Sin resultados</p>}
        {filtered.map(conv => {
          const lastMsg = conv.messages[conv.messages.length - 1];
          return (
            <button key={conv.id} onClick={() => onSelect(conv.id)} className={cn('w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors', activeId === conv.id && 'bg-teal-50')}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-200 flex items-center justify-center text-teal-700 font-semibold text-sm shrink-0">{conv.customer.displayName[0].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{conv.customer.displayName}</span>
                    <span className="text-xs text-gray-400 shrink-0">{formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span>{CHANNEL_ICON[conv.channel]}</span>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', STATUS_COLOR[conv.status])}>
                      {conv.status === 'BOT_ACTIVE' ? <Bot size={10} className="inline" /> : <User size={10} className="inline" />} {conv.status === 'BOT_ACTIVE' ? 'Bot' : 'Agente'}
                    </span>
                  </div>
                  {lastMsg && <p className="text-xs text-gray-500 truncate mt-1">{lastMsg.direction === 'OUTBOUND' && '✓ '}{lastMsg.content}</p>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
