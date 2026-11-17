import { create } from 'zustand';
import { sendChat } from './api';
import type { ChatLocale, ChatMessage, ChatTurn } from './types';

type ChatState = {
  messages: ChatMessage[]; draft: string; phase: 'idle' | 'answering'; error: string | null;
  setDraft: (value: string) => void; submit: (locale: ChatLocale) => Promise<void>; stop: () => void; reset: () => void;
};
let generation = 0;
let active: { controller: AbortController; before: ChatMessage[]; question: string } | undefined;
function historyOf(messages: ChatMessage[]): ChatTurn[] {
  let remaining = 4000;
  return messages.slice(-8).reverse().flatMap(message => {
    if (!remaining) return [];
    const content = message.content.slice(-Math.min(2000, remaining)); remaining -= content.length;
    return [{ role: message.role, content }];
  }).reverse();
}
// Deliberately no persistence middleware: questions never enter AsyncStorage.
export const useChatStore = create<ChatState>((set, get) => ({
  messages: [], draft: '', phase: 'idle', error: null,
  setDraft: value => set({ draft: value.slice(0, 2000), error: null }),
  submit: async locale => {
    const question = get().draft.trim();
    if (!question || get().phase === 'answering') return;
    const before = get().messages;
    const id = ++generation;
    const controller = new AbortController();
    active = { controller, before, question };
    set({ messages: [...before, { id: `${id}-user`, role: 'user', content: question }], draft: '', phase: 'answering', error: null });
    try {
      const reply = await sendChat({ question, locale, history: historyOf(before) }, controller.signal);
      if (generation !== id) return;
      set({ messages: [...get().messages, { id: `${id}-assistant`, role: 'assistant', content: reply.answer, sources: reply.sources, status: reply.status }], phase: 'idle' });
    } catch (error) {
      if (generation !== id) return;
      set({ messages: before, draft: question, phase: 'idle', error: error instanceof Error ? error.message : 'READER_UNAVAILABLE' });
    } finally { if (generation === id) active = undefined; }
  },
  stop: () => {
    if (!active) return;
    const previous = active; ++generation; active = undefined; previous.controller.abort();
    set({ messages: previous.before, draft: previous.question, phase: 'idle', error: 'CANCELLED' });
  },
  reset: () => {
    ++generation; active?.controller.abort(); active = undefined;
    set({ messages: [], draft: '', phase: 'idle', error: null });
  },
}));
