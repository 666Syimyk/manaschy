import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { EmptyState } from '@/components/empty-state';
import { GuideCard } from '@/components/guide-card';
import { ReadingControls } from '@/components/reading-controls';
import { getGuideById, getSourceById, guideTopics } from '@/data/guides';
import { getRelatedGuides, getSourcesForGuide } from '@/features/guides/selectors';
import { useGuideStore } from '@/features/local-state/store';
import { useT } from '@/i18n';
import {
  Body,
  Eyebrow,
  FocusablePressable,
  Screen,
  SectionHeading,
  Title,
  useTextScale,
} from '@/shared/ui';
import { palette } from '@/theme';

export function GuideReaderScreen({ id }: { id: string }) {
  const guide = getGuideById(id);
  const locale = useGuideStore((state) => state.locale);
  const savedGuideIds = useGuideStore((state) => state.savedGuideIds);
  const progress = useGuideStore((state) => state.guideProgress);
  const openGuide = useGuideStore((state) => state.openGuide);
  const t = useT();
  const scale = useTextScale();

  const guideId = guide?.id;

  useEffect(() => {
    if (guideId) {
      void openGuide(guideId);
    }
  }, [guideId, openGuide]);

  if (!guide) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title={t('guideNotFoundTitle')}
          body={t('notFoundBody')}
          actionLabel={t('returnToGuides')}
          onAction={() => router.push('/(tabs)/guides' as never)}
        />
      </Screen>
    );
  }

  const sources = getSourcesForGuide(guide.id);
  const related = getRelatedGuides(guide.id);
  const topics = guide.topicIds
    .map((topicId) => guideTopics.find(({ id: candidateId }) => candidateId === topicId)?.label[locale])
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen>
      <View style={styles.hero}>
        <Eyebrow style={styles.heroEyebrow}>{topics}</Eyebrow>
        <Title size={38} style={styles.heroTitle}>{guide.title[locale]}</Title>
        <Body style={styles.heroSummary}>{guide.summary[locale]}</Body>
        <View style={styles.readingMeta}>
          <Ionicons name="time-outline" size={18} color={palette.goldLight} />
          <Text style={[styles.readingMetaText, { fontSize: 13 * scale }]}>
            {t('readingMinutes', { count: guide.readingMinutes })}
          </Text>
        </View>
      </View>

      <ReadingControls guideId={guide.id} />

      <View style={styles.article}>
        {guide.sections.map((section, sectionIndex) => (
          <View key={section.id} style={styles.section}>
            <Title size={25}>{section.heading[locale]}</Title>
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <View key={`${section.id}-${paragraphIndex}`} style={styles.paragraphBlock}>
                <Text
                  testID={`guide-paragraph-${sectionIndex}-${paragraphIndex}`}
                  selectable
                  style={[
                    styles.paragraph,
                    { fontSize: 17 * scale, lineHeight: 28 * scale },
                  ]}
                >
                  {paragraph.text[locale]}
                </Text>
                <View style={styles.citations}>
                  {paragraph.claimRefs.map((reference, referenceIndex) => {
                    const source = getSourceById(reference.sourceId);
                    if (!source) return null;
                    return (
                      <FocusablePressable
                        key={`${reference.sourceId}-${referenceIndex}`}
                        accessibilityRole="link"
                        accessibilityLabel={source.title}
                        onPress={() => router.push(`/source/${source.id}` as never)}
                        style={({ pressed, focused }) => [
                          styles.citation,
                          focused && styles.focused,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.citationIndex, { fontSize: 12 * scale }]}>
                          [{referenceIndex + 1}]
                        </Text>
                        <Text numberOfLines={2} style={[styles.citationText, { fontSize: 12 * scale }]}>
                          {source.title}
                          {reference.locator ? ` · ${reference.locator}` : ''}
                        </Text>
                      </FocusablePressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>

      <SectionHeading title={t('guideSources')} />
      <View style={styles.sourceList}>
        {sources.map((source) => (
          <FocusablePressable
            key={source.id}
            accessibilityRole="link"
            accessibilityLabel={source.title}
            onPress={() => router.push(`/source/${source.id}` as never)}
            style={({ pressed, focused }) => [styles.sourceLink, focused && styles.focused, pressed && styles.pressed]}
          >
            <Ionicons name="library-outline" size={20} color={palette.red} />
            <View style={styles.sourceCopy}>
              <Text style={[styles.sourceTitle, { fontSize: 15 * scale }]}>{source.title}</Text>
              <Text style={[styles.sourcePublisher, { fontSize: 12 * scale }]}>{source.publisher}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.red} />
          </FocusablePressable>
        ))}
      </View>

      {related.length > 0 ? (
        <>
          <SectionHeading title={t('relatedGuides')} />
          <View style={styles.relatedGrid}>
            {related.map((relatedGuide) => (
              <GuideCard
                key={relatedGuide.id}
                guide={relatedGuide}
                locale={locale}
                saved={savedGuideIds.includes(relatedGuide.id)}
                completed={Boolean(progress[relatedGuide.id]?.completedAt)}
              />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 14, padding: 28, borderRadius: 28, overflow: 'hidden', backgroundColor: palette.red },
  heroEyebrow: { color: palette.goldLight },
  heroTitle: { color: palette.white, maxWidth: 880 },
  heroSummary: { color: 'rgba(255,255,255,0.88)', maxWidth: 860 },
  readingMeta: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  readingMetaText: { color: palette.white, fontWeight: '800' },
  article: { maxWidth: 820, width: '100%', alignSelf: 'center', gap: 30 },
  section: { gap: 17 },
  paragraphBlock: { gap: 10 },
  paragraph: { color: palette.ink },
  citations: { gap: 7 },
  citation: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 13, borderWidth: 2, borderColor: 'transparent', backgroundColor: palette.goldSoft },
  citationIndex: { color: palette.red, fontWeight: '900' },
  citationText: { flex: 1, color: palette.muted, fontWeight: '700' },
  focused: { borderColor: palette.red, boxShadow: '0 0 0 3px rgba(207,161,90,0.22)' },
  pressed: { opacity: 0.68 },
  sourceList: { gap: 9 },
  sourceLink: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: palette.goldBorder, backgroundColor: palette.surface },
  sourceCopy: { flex: 1, gap: 3 },
  sourceTitle: { color: palette.ink, fontWeight: '800' },
  sourcePublisher: { color: palette.muted },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
});
