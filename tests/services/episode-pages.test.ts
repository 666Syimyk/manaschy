import { loadEpisodePage } from '../../src/data/epic';

describe('plain episode page loading', () => {
  const originalFetch = global.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_READER_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_READER_URL = 'http://127.0.0.1:8091';
    global.fetch = jest.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_READER_URL;
    else process.env.EXPO_PUBLIC_READER_URL = originalUrl;
  });

  it('rejects unknown episodes and pages outside their source range before networking', async () => {
    await expect(loadEpisodePage('missing', 11)).rejects.toThrow('EPISODE_NOT_FOUND');
    await expect(loadEpisodePage('orozbakov-v1-001', 10)).rejects.toThrow('INVALID_PAGE');
    await expect(loadEpisodePage('orozbakov-v1-001', 11.5)).rejects.toThrow('INVALID_PAGE');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('loads the requested plain-text page with cancellation and validates its identity', async () => {
    const controller = new AbortController();
    const page = { episodeId: 'orozbakov-v1-001', page: 11, blocks: [{ kind: 'verse', text: 'Сыноо\nЭкинчи сап' }] };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => page });
    await expect(loadEpisodePage('orozbakov-v1-001', 11, controller.signal)).resolves.toEqual(page);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8091/episode/orozbakov-v1-001/page/11',
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it.each([
    { episodeId: 'other', page: 11, blocks: [{ kind: 'verse', text: 'text' }] },
    { episodeId: 'orozbakov-v1-001', page: 12, blocks: [{ kind: 'verse', text: 'text' }] },
    { episodeId: 'orozbakov-v1-001', page: 11, blocks: [] },
    { episodeId: 'orozbakov-v1-001', page: 11, blocks: [{ kind: 'html', text: '<script>' }] },
  ])('rejects malformed or mismatched page results', async (page) => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => page });
    await expect(loadEpisodePage('orozbakov-v1-001', 11)).rejects.toThrow('INVALID_PAGE_RESPONSE');
  });

  it('reports service failures without replacing the original with generated content', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    await expect(loadEpisodePage('orozbakov-v1-001', 11)).rejects.toThrow('READER_UNAVAILABLE');
  });
});
