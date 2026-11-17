import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SourceCard } from '@/components/source-card';
import { getPublishedSources } from '@/data/guides';
import type { ReferenceSource } from '@/features/guides/types';
import { useGuideStore } from '@/features/local-state/store';
import { useT, type TranslationKey } from '@/i18n';
import { Body, Eyebrow, FocusablePressable, Screen, Title, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

type SourceTypeFilter = ReferenceSource['sourceType'] | 'all';

const TYPE_KEY: Record<ReferenceSource['sourceType'], TranslationKey> = {
  official: 'sourceTypeOfficial',
  archive: 'sourceTypeArchive',
  library: 'sourceTypeLibrary',
  academic: 'sourceTypeAcademic',
};

export function SourceDirectoryScreen() {
  const [filter, setFilter] = useState<SourceTypeFilter>('all');
  const locale = useGuideStore((state) => state.locale);
  const t = useT();
  const scale = useTextScale();
  const sources = getPublishedSources();
  const availableTypes = useMemo(
    () => [...new Set(sources.map(({ sourceType }) => sourceType))],
    [sources],
  );
  const filteredSources = sources.filter(
    ({ sourceType }) => filter === 'all' || sourceType === filter,
  );
  const filters: { id: SourceTypeFilter; label: string }[] = [
    { id: 'all', label: t('allSourceTypes') },
    ...availableTypes.map((sourceType) => ({ id: sourceType, label: t(TYPE_KEY[sourceType]) })),
  ];

  return (
    <Screen>
      <Eyebrow>{t('sourceCount', { count: filteredSources.length })}</Eyebrow>
      <Title>{t('sourcesTitle')}</Title>
      <Body muted>{t('sourcesIntro')}</Body>
      <View style={styles.filters}>
        {filters.map((item) => {
          const selected = filter === item.id;
          return (
            <FocusablePressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              onPress={() => setFilter(item.id)}
              style={({ pressed, focused }) => [
                styles.chip,
                selected && styles.chipSelected,
                focused && styles.focused,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, { fontSize: 13 * scale }, selected && styles.chipTextSelected]}>
                {item.label}
              </Text>
            </FocusablePressable>
          );
        })}
      </View>
      <View style={styles.grid}>
        {filteredSources.map((source) => (
          <SourceCard key={source.id} source={source} locale={locale} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.goldBorder,
    backgroundColor: palette.surface,
  },
  chipSelected: { borderColor: palette.red, backgroundColor: palette.red },
  chipText: { color: palette.ink, fontWeight: '800' },
  chipTextSelected: { color: palette.white },
  focused: { borderColor: palette.gold, boxShadow: '0 0 0 3px rgba(207,161,90,0.26)' },
  pressed: { opacity: 0.68 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
});
