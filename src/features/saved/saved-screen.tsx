import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '@/components/empty-state';
import { GuideCard } from '@/components/guide-card';
import { getRecentGuides, getValidSavedGuides } from '@/features/guides/selectors';
import type { GuideArticle } from '@/features/guides/types';
import { useGuideStore } from '@/features/local-state/store';
import { useT } from '@/i18n';
import { Body, Screen, SectionHeading, Title } from '@/shared/ui';

function GuideGrid({ guides, kind }: { guides: GuideArticle[]; kind: 'saved' | 'recent' }) {
  const locale = useGuideStore((state) => state.locale);
  const savedGuideIds = useGuideStore((state) => state.savedGuideIds);
  const progress = useGuideStore((state) => state.guideProgress);
  return (
    <View style={styles.grid}>
      {guides.map((guide) => (
        <View key={guide.id} testID={`${kind}-guide-${guide.id}`} style={styles.cardCell}>
          <GuideCard
            guide={guide}
            locale={locale}
            saved={savedGuideIds.includes(guide.id)}
            completed={Boolean(progress[guide.id]?.completedAt)}
          />
        </View>
      ))}
    </View>
  );
}

export function SavedScreen() {
  const savedIds = useGuideStore((state) => state.savedGuideIds);
  const progress = useGuideStore((state) => state.guideProgress);
  const t = useT();
  const saved = getValidSavedGuides(savedIds);
  const recent = getRecentGuides(progress);

  return (
    <Screen>
      <Title>{t('saved')}</Title>
      <Body muted>{t('savedIntro')}</Body>

      <SectionHeading title={t('savedGuides')} />
      {saved.length > 0 ? (
        <GuideGrid guides={saved} kind="saved" />
      ) : (
        <EmptyState
          icon="bookmark-outline"
          title={t('noSavedTitle')}
          body={t('noSavedBody')}
          actionLabel={t('openAllGuides')}
          onAction={() => router.push('/(tabs)/guides' as never)}
        />
      )}

      <SectionHeading title={t('recentHistory')} />
      {recent.length > 0 ? (
        <GuideGrid guides={recent} kind="recent" />
      ) : (
        <EmptyState icon="time-outline" title={t('noHistoryTitle')} body={t('noHistoryBody')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  cardCell: { flexBasis: 330, flexGrow: 1, minWidth: 0 },
});
