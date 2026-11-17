import { useLocalSearchParams } from 'expo-router';
import { getSourceStaticParams } from '@/data/guides';
import { SourceDetailScreen } from '@/features/sources/detail-screen';

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return getSourceStaticParams();
}

export default function SourceRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const sourceId = Array.isArray(id) ? id[0] : id;
  return <SourceDetailScreen id={sourceId ?? ''} />;
}
