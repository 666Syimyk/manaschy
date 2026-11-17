import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { GuideCard } from '@/components/guide-card';
import { SearchField } from '@/components/search-field';
import { guideTopics } from '@/data/guides';
import { searchGuides } from '@/features/guides/search';
import { EpisodeCatalogScreen } from '@/features/episodes/catalog-screen';
import { episodeMessages } from '@/features/episodes/messages';
import { useGuideStore } from '@/features/local-state/store';
import { useT } from '@/i18n';
import { Body, Eyebrow, FocusablePressable, Screen, Title, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

export function GuideCatalogScreen() {
  const [section, setSection] = useState<'episodes' | 'articles'>('episodes');
  const locale = useGuideStore((state) => state.locale);
  const scale = useTextScale();
  return (
    <View style={styles.root}>
      <View style={styles.tabs}>
        {(['episodes', 'articles'] as const).map((item) => (
          <FocusablePressable
            key={item}
            accessibilityRole="button"
            accessibilityLabel={episodeMessages[locale][item]}
            accessibilityState={{ selected: section === item }}
            onPress={() => setSection(item)}
            style={({ focused, pressed }) => [
              styles.tab,
              section === item && styles.chipSelected,
              focused && styles.chipFocused,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.chipText, { fontSize: 15 * scale }, section === item && styles.chipTextSelected]}>
              {episodeMessages[locale][item]}
            </Text>
          </FocusablePressable>
        ))}
      </View>
      {section === 'episodes' ? <EpisodeCatalogScreen /> : <ArticleCatalogScreen />}
    </View>
  );
}

export function ArticleCatalogScreen() {
  const [query, setQuery] = useState('');
  const [topicId, setTopicId] = useState<string | null>(null);
  const locale = useGuideStore((state) => state.locale);
  const savedGuideIds = useGuideStore((state) => state.savedGuideIds);
  const progress = useGuideStore((state) => state.guideProgress);
  const t = useT();
  const scale = useTextScale();
  const guides = useMemo(
    () => searchGuides(query, locale).filter((guide) => !topicId || guide.topicIds.includes(topicId)),
    [locale, query, topicId],
  );
  const topics: { id: string | null; label: string }[] = [
    { id: null, label: t('allTopics') },
    ...guideTopics.map((topic) => ({ id: topic.id, label: topic.label[locale] })),
  ];
  const clearFilters = () => {
    setQuery('');
    setTopicId(null);
  };

  return (
    <Screen keyboardShouldPersistTaps="handled">
      <Eyebrow>{t('guideCount', { count: guides.length })}</Eyebrow>
      <Title>{t('guidesTitle')}</Title>
      <Body muted>{t('guidesIntro')}</Body>
      <SearchField
        value={query}
        label={t('searchLabel')}
        placeholder={t('searchPlaceholder')}
        clearLabel={t('clearSearch')}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
      />
      <View style={styles.chips}>
        {topics.map((topic) => {
          const selected = topic.id === topicId;
          return (
            <FocusablePressable
              key={topic.id ?? 'all'}
              accessibilityRole="button"
              accessibilityLabel={topic.label}
              accessibilityState={{ selected }}
              onPress={() => setTopicId(topic.id)}
              style={({ pressed, focused }) => [
                styles.chip,
                selected && styles.chipSelected,
                focused && styles.chipFocused,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, { fontSize: 13 * scale }, selected && styles.chipTextSelected]}>
                {topic.label}
              </Text>
            </FocusablePressable>
          );
        })}
      </View>

      {guides.length > 0 ? (
        <View style={styles.grid}>
          {guides.map((guide) => (
            <GuideCard
              key={guide.id}
              guide={guide}
              locale={locale}
              saved={savedGuideIds.includes(guide.id)}
              completed={Boolean(progress[guide.id]?.completedAt)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="search-outline"
          title={t('noSearchTitle')}
          body={t('noSearchBody')}
          actionLabel={t('clearSearch')}
          onAction={clearFilters}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ivory },
  tabs: { width: '100%', maxWidth: 1120, alignSelf: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  tab: { minHeight: 48, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: palette.goldBorder, borderRadius: 14, backgroundColor: palette.surface },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.goldBorder,
    backgroundColor: palette.surface,
  },
  chipSelected: { borderColor: palette.red, backgroundColor: palette.red },
  chipFocused: { borderColor: palette.gold, boxShadow: '0 0 0 3px rgba(207,161,90,0.26)' },
  chipText: { color: palette.ink, fontWeight: '800' },
  chipTextSelected: { color: palette.white },
  pressed: { opacity: 0.68 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
});
