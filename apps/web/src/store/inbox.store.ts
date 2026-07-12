import { create } from 'zustand';

interface Message {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  sender: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  channel: string;
  status: string;
  updatedAt: string;
  customer: { id: string; displayName: string };
  messages: Message[];
}

interface InboxStore {
  conversations: Conversation[];
  activeId: string | null;
  messagesByConversation: Record<string, Message[]>;
  setActive: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateConversation: (id: string, patch: Partial<Conversation>) => void;
  getConversation: (id: string) => Conversation | undefined;
}

export const useInboxStore = create<InboxStore>((set, get) => ({
  conversations: [],
  activeId: null,
  messagesByConversation: {},

  setActive: (id) => set({ activeId: id }),

  addMessage: (conversationId, message) =>
    set(state => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [...(state.messagesByConversation[conversationId] ?? []), message],
      },
    })),

  updateConversation: (id, patch) =>
    set(state => ({
      conversations: state.conversations.map(c => c.id === id ? { ...c, ...patch } : c),
    })),

  getConversation: (id) => get().conversations.find(c => c.id === id),
}));
