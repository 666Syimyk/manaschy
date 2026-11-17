const mockSend = jest.fn();
jest.mock('../../src/features/chat/api', () => ({ sendChat: (...args: unknown[]) => mockSend(...args) }), { virtual: true });
import { useChatStore } from '../../src/features/chat/store';
const reply = { status: 'not_found', answer: 'Подтверждение не найдено.', sources: [] };

describe('ephemeral chat session', () => {
  beforeEach(() => { useChatStore.getState().reset(); mockSend.mockReset(); });
  it('sends a question without episode selection and retains completed turns', async () => {
    mockSend.mockResolvedValue(reply);
    useChatStore.getState().setDraft('  Кто это?  ');
    await useChatStore.getState().submit('ru');
    expect(useChatStore.getState().messages.map(m => m.content)).toEqual(['Кто это?', reply.answer]);
    expect(mockSend.mock.calls[0][0]).toEqual({ question: 'Кто это?', locale: 'ru', history: [] });
    expect(useChatStore.getState().draft).toBe('');
    expect(useChatStore.getState().phase).toBe('idle');
  });
  it('does not append an old answer to a new conversation', async () => {
    let finish!: (value: unknown) => void;
    mockSend.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    useChatStore.getState().setDraft('Первый вопрос');
    const pending = useChatStore.getState().submit('ru');
    const signal = mockSend.mock.calls[0][1] as AbortSignal;
    useChatStore.getState().reset(); finish(reply); await pending;
    expect(signal.aborted).toBe(true);
    expect(useChatStore.getState().messages).toEqual([]);
    expect(useChatStore.getState().phase).toBe('idle');
  });
  it('stops, restores input and retries without duplicating a question', async () => {
    let finish!: (value: unknown) => void;
    mockSend.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    useChatStore.getState().setDraft('Мой вопрос');
    const pending = useChatStore.getState().submit('ru');
    useChatStore.getState().stop(); finish(reply); await pending;
    expect(useChatStore.getState().draft).toBe('Мой вопрос');
    mockSend.mockResolvedValue(reply); await useChatStore.getState().submit('ru');
    expect(useChatStore.getState().messages.filter(m => m.role === 'user')).toHaveLength(1);
  });
  it('preserves retry input on failure and limits previous context', async () => {
    mockSend.mockRejectedValueOnce(Error('MODEL_UNAVAILABLE'));
    useChatStore.getState().setDraft('Вопрос'); await useChatStore.getState().submit('ru');
    expect(useChatStore.getState().draft).toBe('Вопрос');
    expect(useChatStore.getState().error).toBe('MODEL_UNAVAILABLE');
    mockSend.mockResolvedValue(reply);
    for (let i = 0; i < 6; i++) { useChatStore.getState().setDraft(`Вопрос ${i}`); await useChatStore.getState().submit('ky'); }
    expect(mockSend.mock.calls.at(-1)![0].history).toHaveLength(8);
  });
});
