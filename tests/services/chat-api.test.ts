import { getChatStatus, prepareChat, sendChat } from '../../src/features/chat/api';
import { epicEpisodes, epicVolumes } from '../../src/data/epic';

const input = { question: 'Почему Жакып горевал?', locale: 'ru' as const, history: [] };
const episode = epicEpisodes[0];
const source = { id: 'test', episodeId: episode.id, title: episode.title, volume: epicVolumes[0].number, page: 11, href: `/episode/${episode.id}?page=11` };
const reply = { status: 'answered', answer: 'Тестовое объяснение.', sources: [source] };
const status = { index: 'ready', model: 'ready', completedPages: 2149, totalPages: 2149 };
const response = (body: unknown, ok = true) => ({ ok, text: async () => JSON.stringify(body) });

describe('chat HTTP client', () => {
  const oldFetch = global.fetch;
  const oldUrl = process.env.EXPO_PUBLIC_READER_URL;
  beforeEach(() => { process.env.EXPO_PUBLIC_READER_URL = 'http://127.0.0.1:8091'; global.fetch = jest.fn(); });
  afterEach(() => { global.fetch = oldFetch; if (oldUrl === undefined) delete process.env.EXPO_PUBLIC_READER_URL; else process.env.EXPO_PUBLIC_READER_URL = oldUrl; });
  it('loads readiness, prepares and sends a global question with bounded history', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response(status));
    expect(await getChatStatus()).toEqual(status);
    expect(await prepareChat()).toEqual(status);
    (global.fetch as jest.Mock).mockResolvedValue(response(reply));
    expect(await sendChat(input, new AbortController().signal)).toEqual(reply);
    const [url, options] = (global.fetch as jest.Mock).mock.calls.at(-1)!;
    expect(url).toBe('http://127.0.0.1:8091/chat/messages');
    expect(JSON.parse(options.body)).toEqual(input);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
  it.each([
    { ...reply, sources: [{ ...source, href: 'https://evil.example' }] },
    { ...reply, sources: [{ ...source, page: 999 }] },
    { ...reply, sources: [] },
    { ...reply, answer: 'a'.repeat(6001) },
    { status: 'fake', answer: 'x', sources: [] },
  ])('rejects invalid answers and forged source navigation', async bad => {
    (global.fetch as jest.Mock).mockResolvedValue(response(bad));
    await expect(sendChat(input, new AbortController().signal)).rejects.toThrow('INVALID_CHAT_RESPONSE');
  });
  it('exposes known errors only and cancels before networking', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response({ error: 'MODEL_MISSING' }, false));
    await expect(prepareChat()).rejects.toThrow('MODEL_MISSING');
    (global.fetch as jest.Mock).mockResolvedValue(response({ error: 'private detail' }, false));
    await expect(prepareChat()).rejects.toThrow('READER_UNAVAILABLE');
    const controller = new AbortController(); controller.abort();
    const before = (global.fetch as jest.Mock).mock.calls.length;
    await expect(sendChat(input, controller.signal)).rejects.toThrow('CANCELLED');
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(before);
  });
});
