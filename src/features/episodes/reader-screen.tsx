import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TextInput, View, type ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { EmptyState } from '@/components/empty-state';
import {
  epicVolumes,
  getEpisodeById,
  getEpisodeNeighbours,
  loadEpisodePage,
  type EpisodePage,
} from '@/data/epic';
import { useGuideStore } from '@/features/local-state/store';
import { Body, Button, Eyebrow, FocusablePressable, Screen, Title, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';
import { episodeMessages } from './messages';

export function EpisodeReaderScreen({ id, initialPage }: { id: string; initialPage?: number }) {
  const episode = getEpisodeById(id);
  const page = initialPage !== undefined && Number.isSafeInteger(initialPage) && episode &&
    initialPage >= episode.startPage && initialPage <= episode.endPage ? initialPage : episode?.startPage;
  // New citation resets loading/page state; internal page turns keep the same key.
  return <EpisodeReader key={`${id}:${page}`} id={id} initialPage={page} />;
}

function EpisodeReader({ id, initialPage }: { id: string; initialPage?: number }) {
  const locale = useGuideStore((state) => state.locale);
  const m = episodeMessages[locale];
  const scale = useTextScale();
  const episode = getEpisodeById(id);
  const volume = epicVolumes.find((item) => item.id === episode?.volumeId);
  const [pageIndex, setPageIndex] = useState((initialPage ?? 0) - (episode?.startPage ?? 0));
  const [pageInput, setPageInput] = useState(String(initialPage ?? ''));
  const [invalidPage, setInvalidPage] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  if (!episode) {
    return (
      <Screen>
        <EmptyState
          title={m.notFound}
          body={m.notFoundBody}
          actionLabel={m.back}
          onAction={() => router.push('/(tabs)/guides' as never)}
        />
      </Screen>
    );
  }

  const currentPage = episode.startPage + pageIndex;
  const pageCount = episode.endPage - episode.startPage + 1;
  const pdfUri = `${episode.pdfUrl.split('#')[0]}#page=${currentPage}&view=FitH`;
  const { previous, next } = getEpisodeNeighbours(id);
  const navigatePage = (index: number) => {
    if (index < 0 || index >= pageCount) return;
    setPageIndex(index);
    setPageInput(String(episode.startPage + index));
    setInvalidPage(false);
    if (index !== pageIndex) scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const jumpToPage = () => {
    const value = pageInput.trim();
    const index = /^\d+$/.test(value) ? Number(value) - episode.startPage : -1;
    if (!Number.isSafeInteger(index) || index < 0 || index >= pageCount) {
      setInvalidPage(true);
      return;
    }
    navigatePage(index);
  };
  const openSource = async () => {
    setLinkError(false);
    try {
      await Linking.openURL(pdfUri);
    } catch {
      setLinkError(true);
    }
  };

  const pageControls = (
    <View style={styles.pageControls}>
      <FocusablePressable
        accessibilityRole="button"
        accessibilityLabel={m.previousPage}
        disabled={pageIndex === 0}
        accessibilityState={{ disabled: pageIndex === 0 }}
        onPress={() => navigatePage(pageIndex - 1)}
        style={({ focused, pressed }) => [styles.pageArrow, pageIndex === 0 && styles.disabled, focused && styles.focused, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={23} color={palette.red} />
      </FocusablePressable>
      <View style={styles.pageJump}>
        <Text style={[styles.pageLabel, { fontSize: 14 * scale }]}>{m.page}</Text>
        <TextInput
          accessibilityLabel={m.pageInput}
          value={pageInput}
          onChangeText={(value) => { setPageInput(value); setInvalidPage(false); }}
          onSubmitEditing={jumpToPage}
          inputMode="numeric"
          returnKeyType="go"
          maxLength={5}
          selectTextOnFocus
          style={[styles.pageInput, { fontSize: 16 * scale }]}
        />
        <FocusablePressable
          accessibilityRole="button"
          accessibilityLabel={m.go}
          onPress={jumpToPage}
          style={({ focused, pressed }) => [styles.goButton, focused && styles.focused, pressed && styles.pressed]}
        >
          <Text style={[styles.linkText, { fontSize: 13 * scale }]}>{m.go}</Text>
        </FocusablePressable>
      </View>
      <FocusablePressable
        accessibilityRole="button"
        accessibilityLabel={m.nextPage}
        disabled={pageIndex === pageCount - 1}
        accessibilityState={{ disabled: pageIndex === pageCount - 1 }}
        onPress={() => navigatePage(pageIndex + 1)}
        style={({ focused, pressed }) => [styles.pageArrow, pageIndex === pageCount - 1 && styles.disabled, focused && styles.focused, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-forward" size={23} color={palette.red} />
      </FocusablePressable>
    </View>
  );

  return (
    <Screen keyboardShouldPersistTaps="handled" scrollRef={scrollRef}>
      <FocusablePressable
        accessibilityRole="link"
        accessibilityLabel={m.back}
        onPress={() => router.push('/(tabs)/guides' as never)}
        style={({ focused, pressed }) => [styles.back, focused && styles.focused, pressed && styles.pressed]}
      >
        <Ionicons name="arrow-back" size={18} color={palette.red} />
        <Text style={[styles.linkText, { fontSize: 14 * scale }]}>{m.back}</Text>
      </FocusablePressable>

      <View style={styles.heading}>
        <Eyebrow>{m.original} · {m.volume} {volume?.number ?? ''}</Eyebrow>
        <Title size={34}>{episode.title}</Title>
        <Body muted>{m.pages} {episode.startPage}–{episode.endPage} · Сагымбай Орозбаков</Body>
      </View>

      <Body muted>{m.sourceIntro}</Body>
      {pageControls}
      {invalidPage ? <Body accessibilityRole="alert" style={styles.error}>{m.invalidPage}</Body> : null}
      {episode.startsMidPage && pageIndex === 0 ? <Body muted>{m.midPage}</Body> : null}
      <EpisodePageContent key={currentPage} id={id} pageNumber={currentPage} />
      <View style={styles.bottomPages}>
        <Button
          variant="secondary"
          accessibilityLabel={m.previousPage}
          disabled={pageIndex === 0}
          accessibilityState={{ disabled: pageIndex === 0 }}
          style={[styles.bottomPageButton, pageIndex === 0 && styles.disabled]}
          onPress={() => navigatePage(pageIndex - 1)}
        >← {m.previousPage}</Button>
        <Button
          variant="secondary"
          accessibilityLabel={m.nextPage}
          disabled={pageIndex === pageCount - 1}
          accessibilityState={{ disabled: pageIndex === pageCount - 1 }}
          style={[styles.bottomPageButton, pageIndex === pageCount - 1 && styles.disabled]}
          onPress={() => navigatePage(pageIndex + 1)}
        >{m.nextPage} →</Button>
      </View>
      <Body muted style={styles.pageNote}>{m.pageNote}</Body>

      <View style={styles.source}>
        <Eyebrow>{m.source}</Eyebrow>
        <Body muted>{volume?.citation ?? volume?.title ?? 'Сагымбай Орозбаков. Манас.'}</Body>
        <Button variant="secondary" accessibilityLabel={m.openPdfPage} onPress={() => { void openSource(); }}>
          {m.openPdfPage} ↗
        </Button>
        {linkError ? <Body accessibilityRole="alert" style={styles.error}>{m.sourceLinkError}</Body> : null}
      </View>

      <View style={styles.neighbours}>
        {previous ? (
          <FocusablePressable
            accessibilityRole="link"
            accessibilityLabel={`${m.previousEpisode}: ${previous.title}`}
            onPress={() => router.push(`/episode/${previous.id}` as never)}
            style={({ focused, pressed }) => [styles.neighbour, focused && styles.focused, pressed && styles.pressed]}
          >
            <Eyebrow>← {m.previousEpisode}</Eyebrow>
            <Body>{previous.title}</Body>
          </FocusablePressable>
        ) : null}
        {next ? (
          <FocusablePressable
            accessibilityRole="link"
            accessibilityLabel={`${m.nextEpisode}: ${next.title}`}
            onPress={() => router.push(`/episode/${next.id}` as never)}
            style={({ focused, pressed }) => [styles.neighbour, focused && styles.focused, pressed && styles.pressed]}
          >
            <Eyebrow>{m.nextEpisode} →</Eyebrow>
            <Body>{next.title}</Body>
          </FocusablePressable>
        ) : null}
      </View>
    </Screen>
  );
}

function EpisodePageContent({ id, pageNumber }: { id: string; pageNumber: number }) {
  const locale = useGuideStore((state) => state.locale);
  const m = episodeMessages[locale];
  const scale = useTextScale();
  const [page, setPage] = useState<EpisodePage | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    void loadEpisodePage(id, pageNumber, controller.signal).then((result) => {
      if (cancelled) return;
      if (result.episodeId !== id || result.page !== pageNumber || !result.blocks.some((block) => block.text.trim())) {
        setLoadError(true);
        return;
      }
      setPage(result);
    }).catch(() => {
      if (!cancelled) setLoadError(true);
    });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt, id, pageNumber]);

  if (loadError) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title={m.loadError}
        body={m.loadErrorBody}
        actionLabel={m.retry}
        onAction={() => { setLoadError(false); setPage(null); setAttempt((value) => value + 1); }}
      />
    );
  }

  if (!page) {
    return (
      <View accessible accessibilityRole="progressbar" accessibilityLabel={m.loading} accessibilityLiveRegion="polite" style={styles.loading}>
        <ActivityIndicator color={palette.red} />
        <Body muted>{m.loading}</Body>
      </View>
    );
  }

  return (
    <View testID="episode-page" style={styles.paper}>
      <Text style={[styles.paperPage, { fontSize: 12 * scale }]}>{m.page} {page.page}</Text>
      {page.blocks.map((block, index) => (
        <Text
          key={index}
          selectable
          accessibilityRole={block.kind === 'heading' ? 'header' : undefined}
          style={[styles.readingText, { fontSize: 21 * scale, lineHeight: 32 * scale }, block.kind === 'heading' && styles.readingHeading]}
        >{block.text}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, minHeight: 44, paddingHorizontal: 8, borderWidth: 2, borderColor: 'transparent', borderRadius: 12 },
  linkText: { color: palette.red, fontWeight: '800' },
  heading: { gap: 13, paddingVertical: 8 },
  loading: { minHeight: 200, alignItems: 'center', justifyContent: 'center', gap: 12 },
  pageControls: { maxWidth: 760, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  pageArrow: { width: 46, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderWidth: 2, borderColor: palette.goldBorder, borderRadius: 14 },
  pageJump: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 6, flex: 1 },
  pageLabel: { color: palette.muted },
  pageInput: { minHeight: 48, width: 68, textAlign: 'center', color: palette.ink, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.goldBorder, borderRadius: 10 },
  goButton: { minHeight: 48, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', borderRadius: 12 },
  paper: { maxWidth: 760, width: '100%', alignSelf: 'center', padding: 24, borderRadius: 18, borderWidth: 1, borderColor: palette.goldBorder, backgroundColor: palette.surface, gap: 22 },
  paperPage: { color: palette.muted, textAlign: 'center', letterSpacing: 1 },
  readingText: { color: palette.ink, fontFamily: 'serif' },
  readingHeading: { fontWeight: '800' },
  bottomPages: { maxWidth: 760, width: '100%', alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bottomPageButton: { flexBasis: 220, flexGrow: 1, paddingVertical: 10 },
  pageNote: { maxWidth: 760, alignSelf: 'center' },
  source: { padding: 22, borderWidth: 1, borderColor: palette.goldBorder, borderRadius: 20, gap: 12, backgroundColor: palette.surfaceAlt },
  neighbours: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  neighbour: { flexBasis: 280, flexGrow: 1, gap: 9, padding: 20, borderRadius: 18, borderWidth: 2, borderColor: palette.goldBorder, backgroundColor: palette.surface },
  error: { color: palette.danger },
  focused: { borderColor: palette.gold, boxShadow: '0 0 0 3px rgba(207,161,90,0.26)' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
