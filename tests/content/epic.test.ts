import {
  epicEdition,
  epicEpisodes,
  epicVolumes,
  getEpisodeById,
  getEpisodeNeighbours,
  getEpisodeStaticParams,
  loadEpisodeText,
} from '@/data/epic';

describe('original-text source index', () => {
  it('indexes the four inspected volumes and only their actual headings', () => {
    expect(epicVolumes.map(({ pageCount }) => pageCount)).toEqual([552, 544, 560, 516]);
    expect(epicVolumes.map(({ id }) => epicEpisodes.filter((e) => e.volumeId === id).length))
      .toEqual([2, 2, 7, 31]);
    expect(new Set(epicEpisodes.map(({ id }) => id)).size).toBe(42);
    expect(epicEpisodes.map(({ order }) => order)).toEqual(Array.from({ length: 42 }, (_, i) => i + 1));
  });

  it('uses HTTPS source links and valid page ranges without bundling protected text', () => {
    expect(epicEdition.rightsScope).toBe('link_only');
    for (const episode of epicEpisodes) {
      const volume = epicVolumes.find(({ id }) => id === episode.volumeId)!;
      expect(volume).toBeDefined();
      expect(episode.access).toBe('source');
      expect(episode.lineCount).toBe(0);
      expect(episode.startPage).toBeGreaterThan(0);
      expect(episode.endPage).toBeGreaterThanOrEqual(episode.startPage);
      expect(episode.endPage).toBeLessThan(volume.pageCount);
      expect(episode.pdfUrl).toBe(`${volume.pdfUrl}#page=${episode.startPage}`);
      expect(new URL(episode.pdfUrl).origin).toBe('https://manas-discovery.kg');
      expect(volume.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('covers every original-text page, preserving mid-page section boundaries', () => {
    const expected = [[11, 551], [3, 543], [3, 558], [3, 513]];
    epicVolumes.forEach((volume, index) => {
      const sections = epicEpisodes.filter((e) => e.volumeId === volume.id);
      expect(sections[0].startPage).toBe(expected[index][0]);
      expect(sections[sections.length - 1].endPage).toBe(expected[index][1]);
      sections.slice(1).forEach((section, sectionIndex) => {
        expect(sections[sectionIndex].endPage)
          .toBe(section.startPage - (section.startsMidPage ? 0 : 1));
      });
    });
    expect(getEpisodeById('orozbakov-v1-001')?.endPage).toBe(381);
    expect(getEpisodeById('orozbakov-v1-002')?.startPage).toBe(381);
    expect(getEpisodeById('orozbakov-v4-002')?.title)
      .toContain('КӨКӨТӨЙ ООРУП, ӨЛӨРҮНДӨ АЙТКАН КЕРЭЭЗИ');
  });

  it('provides stable routes, cross-volume navigation and unknown-id handling', () => {
    expect(getEpisodeStaticParams()).toEqual(epicEpisodes.map(({ id }) => ({ id })));
    expect(getEpisodeNeighbours(epicEpisodes[0].id).previous).toBeUndefined();
    expect(getEpisodeNeighbours(epicEpisodes[41].id).next).toBeUndefined();
    expect(getEpisodeNeighbours('orozbakov-v1-002').next?.id).toBe('orozbakov-v2-001');
    expect(getEpisodeById('missing')).toBeUndefined();
    expect(getEpisodeNeighbours('missing')).toEqual({});
  });

  it('cannot mistake publicly readable source PDFs for a local licensed corpus', async () => {
    await expect(loadEpisodeText(epicEpisodes[0].id)).rejects.toThrow('EPISODE_SOURCE_ONLY');
    await expect(loadEpisodeText('missing')).rejects.toThrow('EPISODE_NOT_FOUND');
  });
});
