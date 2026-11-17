import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { EmptyState } from '@/components/empty-state';
import { SearchField } from '@/components/search-field';
import { epicEpisodes, epicVolumes } from '@/data/epic';
import { useGuideStore } from '@/features/local-state/store';
import { Body, Eyebrow, FocusablePressable, Screen, Title, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';
import { episodeMessages } from './messages';

// The edition mixes Cyrillic letters with visually identical Latin glyphs.
// Normalize only the search index; always display the source heading unchanged.
function normalizeSearch(value: string) {
  const letters: Record<string, string> = {
    a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у',
  };
  return value.toLocaleLowerCase().replace(/[abcehkmoptxy]/g, (letter) => letters[letter]);
}

export function EpisodeCatalogScreen() {
  const locale = useGuideStore((state) => state.locale);
  const m = episodeMessages[locale];
  const scale = useTextScale();
  const [query, setQuery] = useState('');
  const [volumeId, setVolumeId] = useState<string | null>(null);
  const episodes = useMemo(() => {
    const terms = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
    return epicEpisodes.filter((episode) => (
      (!volumeId || episode.volumeId === volumeId)
      && terms.every((term) => normalizeSearch(episode.title).includes(term))
    ));
  }, [query, volumeId]);
  const volumeFilters = [
    { id: null, label: m.allVolumes },
    ...epicVolumes.map((volume) => ({ id: volume.id, label: `${m.volume} ${volume.number}` })),
  ];

  return (
    <Screen keyboardShouldPersistTaps="handled">
      <Eyebrow>{m.original} · {m.episodesCount}: {epicEpisodes.length}</Eyebrow>
      <Title>{m.title}</Title>
      <Body muted>{m.intro}</Body>
      <Body muted>{m.catalogNote}</Body>
      <SearchField
        value={query}
        label={m.search}
        placeholder={m.searchPlaceholder}
        clearLabel={m.clear}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
      />
      <View style={styles.filters}>
        {volumeFilters.map((volume) => (
          <FocusablePressable
            key={volume.id ?? 'all'}
            accessibilityRole="button"
            accessibilityLabel={volume.label}
            accessibilityState={{ selected: volumeId === volume.id }}
            onPress={() => setVolumeId(volume.id)}
            style={({ focused, pressed }) => [
              styles.filter,
              volumeId === volume.id && styles.selected,
              focused && styles.focused,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[
              styles.filterText,
              { fontSize: 14 * scale },
              volumeId === volume.id && styles.selectedText,
            ]}>{volume.label}</Text>
          </FocusablePressable>
        ))}
      </View>
      {episodes.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={m.noResults}
          body={m.noResultsBody}
          actionLabel={m.clear}
          onAction={() => { setQuery(''); setVolumeId(null); }}
        />
      ) : epicVolumes.map((volume) => {
        const volumeEpisodes = episodes.filter((episode) => episode.volumeId === volume.id);
        if (volumeEpisodes.length === 0) return null;
        return (
          <View key={volume.id} style={styles.volume}>
            <View style={styles.volumeHeading}>
              <View style={styles.volumeNumber}>
                <Text style={[styles.volumeNumberText, { fontSize: 23 * scale }]}>{volume.number}</Text>
              </View>
              <View style={styles.volumeCopy}>
                <Title size={24}>{m.volume} {volume.number}</Title>
                <Body muted>{m.episodesCount}: {volumeEpisodes.length}</Body>
              </View>
            </View>
            <View style={styles.grid}>
              {volumeEpisodes.map((episode) => (
                <FocusablePressable
                  key={episode.id}
                  testID={`episode-card-${episode.id}`}
                  accessibilityRole="link"
                  accessibilityLabel={`${episode.title} · ${m.volume} ${volume.number} · ${m.pages} ${episode.startPage}–${episode.endPage}`}
                  onPress={() => router.push(`/episode/${episode.id}` as never)}
                  style={({ focused, pressed }) => [styles.card, focused && styles.focused, pressed && styles.pressed]}
                >
                  <View style={styles.cardMeta}>
                    <Ionicons name="book-outline" color={palette.gold} size={20} />
                    <Text style={[styles.metaText, { fontSize: 12 * scale }]}>
                      {m.pages} {episode.startPage}–{episode.endPage}
                    </Text>
                  </View>
                  <Text numberOfLines={4} style={[styles.episodeTitle, { fontSize: 21 * scale, lineHeight: 28 * scale }]}>
                    {episode.title}
                  </Text>
                  <Text style={[styles.status, { fontSize: 12 * scale }]}>
                    {m.sourceOnly}
                    {episode.lineCount > 0 ? ` · ${episode.lineCount.toLocaleString(locale)} ${m.lines}` : ''}
                  </Text>
                  <View style={styles.action}>
                    <Text style={[styles.actionText, { fontSize: 14 * scale }]}>
                      {m.read}
                    </Text>
                    <Ionicons name="arrow-forward" color={palette.red} size={18} />
                  </View>
                </FocusablePressable>
              ))}
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 18, borderRadius: 999, borderWidth: 2, borderColor: palette.goldBorder, backgroundColor: palette.surface },
  filterText: { fontWeight: '800', color: palette.ink },
  selected: { backgroundColor: palette.red, borderColor: palette.red },
  selectedText: { color: palette.white },
  focused: { borderColor: palette.gold, boxShadow: '0 0 0 3px rgba(207,161,90,0.28)' },
  pressed: { opacity: 0.7 },
  volume: { gap: 16, marginTop: 12 },
  volumeHeading: { flexDirection: 'row', gap: 13, alignItems: 'center' },
  volumeNumber: { width: 50, height: 56, borderRadius: 12, backgroundColor: palette.goldSoft, alignItems: 'center', justifyContent: 'center' },
  volumeNumberText: { color: palette.red, fontFamily: 'serif', fontWeight: '900' },
  volumeCopy: { flex: 1, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { flexBasis: 300, flexGrow: 1, minWidth: 0, gap: 12, padding: 21, borderRadius: 22, borderWidth: 2, borderColor: palette.goldBorder, backgroundColor: palette.surface, boxShadow: '0 4px 18px rgba(43,33,27,0.055)' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: palette.muted, fontWeight: '700' },
  episodeTitle: { color: palette.ink, fontFamily: 'serif', fontWeight: '800' },
  status: { color: palette.muted, lineHeight: 19 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 'auto', minHeight: 44 },
  actionText: { color: palette.red, fontWeight: '900' },
});
