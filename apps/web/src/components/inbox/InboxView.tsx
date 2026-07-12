'use client';
import { useEffect } from 'react';
import { useInboxStore } from '@/store/inbox.store';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import ConversationDetail from './ConversationDetail';
import { useSocket } from '@/lib/websocket';

export default function InboxView() {
  const { conversations, activeId, setActive, addMessage, updateConversation } = useInboxStore();
  const socket = useSocket();

  useEffect(() => {
    fetch('/api/conversations?limit=50').then(r => r.json()).then(data => useInboxStore.setState({ conversations: Array.isArray(data) ? data : [] })).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('message:new', ({ conversationId, message }: any) => { addMessage(conversationId, message); updateConversation(conversationId, { updatedAt: message.createdAt }); });
    socket.on('conversation:takeover', ({ conversationId }: any) => { updateConversation(conversationId, { status: 'HUMAN_TAKEOVER' }); });
    return () => { socket.off('message:new'); socket.off('conversation:takeover'); };
  }, [socket]);

  return (
    <div className="flex h-full bg-white">
      <div className="w-80 border-r border-gray-200 flex flex-col shrink-0"><ConversationList conversations={conversations} activeId={activeId} onSelect={setActive} /></div>
      <div className="flex-1 flex flex-col min-w-0">{activeId ? <ChatWindow conversationId={activeId} /> : <EmptyState />}</div>
      {activeId && <div className="w-72 border-l border-gray-200 shrink-0"><ConversationDetail conversationId={activeId} /></div>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
      <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      <p className="text-sm">Selecciona una conversación</p>
    </div>
  );
}
