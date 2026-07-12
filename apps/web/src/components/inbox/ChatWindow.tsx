'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, RefreshCw, UserCheck } from 'lucide-react';
import { useInboxStore } from '@/store/inbox.store';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Props { conversationId: string }

export default function ChatWindow({ conversationId }: Props) {
  const { getConversation, addMessage, updateConversation } = useInboxStore();
  const conv = getConversation(conversationId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = useInboxStore(s => s.messagesByConversation[conversationId] ?? []);

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/messages`).then(r => r.json()).then(msgs => useInboxStore.setState(state => ({ messagesByConversation: { ...state.messagesByConversation, [conversationId]: msgs } }))).catch(() => {});
  }, [conversationId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) });
      const msg = await res.json();
      addMessage(conversationId, msg);
      setText('');
    } finally { setSending(false); }
  }

  async function toggleTakeover() {
    const newStatus = conv?.status === 'HUMAN_TAKEOVER' ? 'BOT_ACTIVE' : 'HUMAN_TAKEOVER';
    await fetch(`/api/conversations/${conversationId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    updateConversation(conversationId, { status: newStatus });
  }

  if (!conv) return null;
  const isHuman = conv.status === 'HUMAN_TAKEOVER';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{conv.customer?.displayName}</h3>
          <span className="text-xs text-gray-400">{conv.channel}</span>
        </div>
        <button onClick={toggleTakeover} className={cn('flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors', isHuman ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200')}>
          {isHuman ? <><RefreshCw size={13} /> Devolver al bot</> : <><UserCheck size={13} /> Tomar control</>}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
        {messages.map(msg => {
          const isOut = msg.direction === 'OUTBOUND';
          return (
            <div key={msg.id} className={cn('flex', isOut ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm', isOut ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm')}>
                {isOut && <span className={cn('text-xs font-medium block mb-1', msg.sender === 'BOT' ? 'text-teal-200' : 'text-teal-100')}>{msg.sender === 'BOT' ? '🤖 Bot' : `👤 ${msg.sender}`}</span>}
                <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                <span className={cn('text-xs mt-1 block', isOut ? 'text-teal-200' : 'text-gray-400')}>{format(new Date(msg.createdAt), 'HH:mm')}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {isHuman ? (
        <div className="px-4 py-3 border-t border-gray-200 bg-white shrink-0">
          <div className="flex gap-2 items-end">
            <textarea rows={1} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Escribe un mensaje..." className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 max-h-32" />
            <button onClick={sendMessage} disabled={!text.trim() || sending} className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"><Send size={18} /></button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-gray-200 bg-amber-50 shrink-0">
          <p className="text-xs text-amber-700">🤖 El bot está gestionando esta conversación. Haz clic en <strong>Tomar control</strong> para intervenir.</p>
        </div>
      )}
    </div>
  );
}
