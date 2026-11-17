import { Redirect, useLocalSearchParams } from 'expo-router';
import { getEpisodeById, getEpisodeStaticParams } from '@/data/epic';
import { EpisodeReaderScreen } from '@/features/episodes/reader-screen';

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [
    ...getEpisodeStaticParams(),
    ...['k-1', 'k-2', 'k-3', 'o-1', 'o-2', 'o-3'].map((id) => ({ id })),
  ];
}

export default function EpisodeRoute() {
  const { id, page } = useLocalSearchParams<{ id?: string | string[]; page?: string | string[] }>();
  const episodeId = Array.isArray(id) ? id[0] : id;
  if (episodeId && /^(k|o)-[123]$/.test(episodeId)) {
    return <Redirect href={'/(tabs)/guides' as never} />;
  }
  const episode = getEpisodeById(episodeId ?? '');
  const number = typeof page === 'string' && /^\d+$/.test(page) ? Number(page) : NaN;
  const initialPage = episode && Number.isSafeInteger(number) && number >= episode.startPage && number <= episode.endPage
    ? number : undefined;
  return <EpisodeReaderScreen id={episodeId ?? ''} initialPage={initialPage} />;
}
