export type ChatLocale = 'ru' | 'ky';
export type ChatTurn = { role: 'user' | 'assistant'; content: string };
export type ChatRequest = { question: string; locale: ChatLocale; history: ChatTurn[] };
export type ChatSource = { id: string; episodeId: string; title: string; volume: number; page: number; href: string };
export type ChatReply = { status: 'answered' | 'clarify' | 'not_found'; answer: string; sources: ChatSource[] };
export type ChatStatus = { index: 'idle' | 'preparing' | 'ready' | 'error'; model: 'ready' | 'unavailable' | 'missing'; completedPages: number; totalPages: number; error?: string };
export type ChatMessage = ChatTurn & { id: string; sources?: ChatSource[]; status?: ChatReply['status'] };
