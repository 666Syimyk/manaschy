import { useLocalSearchParams } from 'expo-router';
import { getGuideStaticParams } from '@/data/guides';
import { GuideReaderScreen } from '@/features/guides/reader-screen';

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return getGuideStaticParams();
}

export default function GuideRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const guideId = Array.isArray(id) ? id[0] : id;
  return <GuideReaderScreen id={guideId ?? ''} />;
}
