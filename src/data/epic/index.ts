import catalog from './catalog.json';

export type EpicVolume = {
  id: string;
  number: number;
  title: string;
  pdfUrl: string;
  pageCount: number;
  citation: string;
  /** Fingerprint of the inspected source PDF, not a bundled asset. */
  sha256?: string;
};

export type EpicEpisode = {
  id: string;
  /** A heading in the source edition; not a newly written synopsis. */
  title: string;
  volumeId: string;
  order: number;
  /** One-based PDF page numbers, matching this edition's printed numbering. */
  startPage: number;
  endPage: number;
  startsMidPage?: boolean;
  /** Number of locally available lines. Zero for source-only entries. */
  lineCount: number;
  access: 'embedded' | 'source';
  pdfUrl: string;
};

export type EpisodeText = {
  episodeId: string;
  pages: { page: number; lines: string[] }[];
};

export type EpisodePage = {
  episodeId: string;
  page: number;
  blocks: { kind: 'verse' | 'prose' | 'heading'; text: string }[];
};

export const epicVolumes: readonly EpicVolume[] = catalog.volumes;
export const epicEpisodes: readonly EpicEpisode[] = catalog.episodes.map((episode) => ({
  ...episode,
  access: 'source' as const,
}));

export const epicEdition = {
  language: 'ky',
  variant: 'Сагымбай Орозбаков',
  year: 2018,
  checkedAt: '2026-09-28',
  rightsScope: 'link_only',
  titleSource: 'printed_section_headings',
} as const;

export function getEpisodeById(id: string): EpicEpisode | undefined {
  return epicEpisodes.find((episode) => episode.id === id);
}

export function getEpisodeStaticParams(): { id: string }[] {
  return epicEpisodes.map(({ id }) => ({ id }));
}

export function getEpisodeNeighbours(id: string): {
  previous?: EpicEpisode;
  next?: EpicEpisode;
} {
  const index = epicEpisodes.findIndex((episode) => episode.id === id);
  if (index === -1) return {};
  return { previous: epicEpisodes[index - 1], next: epicEpisodes[index + 1] };
}

export async function loadEpisodeText(id: string): Promise<EpisodeText> {
  if (!getEpisodeById(id)) throw new Error('EPISODE_NOT_FOUND');
  // Availability on a public website does not establish permission to republish.
  // Do not silently substitute a generated synopsis for the original poem.
  throw new Error('EPISODE_SOURCE_ONLY');
}

/** Read mode transforms one source page on this computer, without shipping a corpus. */
export async function loadEpisodePage(id: string, page: number, signal?: AbortSignal): Promise<EpisodePage> {
  const episode = getEpisodeById(id);
  if (!episode) throw new Error('EPISODE_NOT_FOUND');
  if (!Number.isInteger(page) || page < episode.startPage || page > episode.endPage) {
    throw new Error('INVALID_PAGE');
  }
  const configured = process.env.EXPO_PUBLIC_READER_URL;
  const localWeb = typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location?.hostname);
  const base = configured || (localWeb ? 'http://127.0.0.1:8091' : '');
  if (!base || !/^https?:\/\//.test(base)) throw new Error('READER_UNAVAILABLE');
  const response = await fetch(`${base.replace(/\/$/, '')}/episode/${id}/page/${page}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('READER_UNAVAILABLE');
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object') throw new Error('INVALID_PAGE_RESPONSE');
  const value = result as Partial<EpisodePage>;
  if (value.episodeId !== id || value.page !== page || !Array.isArray(value.blocks) ||
      value.blocks.length === 0 || !value.blocks.every((block) => block &&
        ['verse', 'prose', 'heading'].includes(block.kind) &&
        typeof block.text === 'string' && block.text.trim().length > 0)) {
    throw new Error('INVALID_PAGE_RESPONSE');
  }
  return value as EpisodePage;
}
