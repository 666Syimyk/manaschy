import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { getPublishedGuides, guideTopics } from '@/data/guides';
import {
  getCompletionSummary,
  getRecentGuides,
} from '@/features/guides/selectors';
import { useGuideStore } from '@/features/local-state/store';
import { useT } from '@/i18n';
import {
  Body,
  Card,
  Eyebrow,
  FocusablePressable,
  Screen,
  SectionHeading,
  Title,
  useTextScale,
} from '@/shared/ui';
import { palette } from '@/theme';

function GuidePreview({
  label,
  guideId,
  title,
  summary,
}: {
  label: string;
  guideId: string;
  title: string;
  summary: string;
}) {
  const t = useT();
  const scale = useTextScale();
  return (
    <Card style={styles.guidePreview}>
      <Eyebrow>{label}</Eyebrow>
      <Text style={[styles.guideTitle, { fontSize: 22 * scale }]}>{title}</Text>
      <Body muted numberOfLines={3} style={styles.guideSummary}>{summary}</Body>
      <FocusablePressable
        accessibilityRole="button"
        accessibilityLabel={`${t('openGuide')}: ${title}`}
        onPress={() => router.push(`/guide/${guideId}` as never)}
        style={({ pressed, focused }) => [
          styles.inlineButton,
          focused && styles.focused,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.inlineButtonText, { fontSize: 14 * scale }]}>{t('openGuide')}</Text>
        <Ionicons name="arrow-forward" size={17} color={palette.red} />
      </FocusablePressable>
    </Card>
  );
}

export function HomeScreen() {
  const t = useT();
  const locale = useGuideStore((state) => state.locale);
  const progress = useGuideStore((state) => state.guideProgress);
  const lastGuideId = useGuideStore((state) => state.lastGuideId);
  const scale = useTextScale();
  const guides = getPublishedGuides();
  const summary = getCompletionSummary(progress);
  const recentGuides = getRecentGuides(progress);
  const featured = guides[0];
  const lastOpened = guides.find(({ id }) => id === lastGuideId) ?? recentGuides[0];

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <Eyebrow style={styles.heroEyebrow}>{t('homeEyebrow')}</Eyebrow>
        <Title size={38} style={styles.heroTitle}>{t('homeTitle')}</Title>
        <Body style={styles.heroBody}>{t('homeDescription')}</Body>
        <View accessibilityLabel={t('homeProgress', summary)} style={styles.progressPill}>
          <Ionicons name="checkmark-circle-outline" size={20} color={palette.goldLight} />
          <Text style={[styles.progressText, { fontSize: 14 * scale }]}>
            {t('homeProgress', summary)}
          </Text>
        </View>
        <View style={styles.heroActions}>
          <FocusablePressable
            accessibilityRole="button"
            accessibilityLabel={t('openAllGuides')}
            onPress={() => router.push('/(tabs)/guides' as never)}
            style={({ pressed, focused }) => [styles.heroButton, focused && styles.heroButtonFocused, pressed && styles.pressed]}
          >
            <Ionicons name="book-outline" size={19} color={palette.red} />
            <Text style={[styles.heroButtonText, { fontSize: 14 * scale }]}>{t('openAllGuides')}</Text>
          </FocusablePressable>
          <FocusablePressable
            accessibilityRole="button"
            accessibilityLabel={t('openSources')}
            onPress={() => router.push('/(tabs)/sources' as never)}
            style={({ pressed, focused }) => [styles.heroButton, focused && styles.heroButtonFocused, pressed && styles.pressed]}
          >
            <Ionicons name="library-outline" size={19} color={palette.red} />
            <Text style={[styles.heroButtonText, { fontSize: 14 * scale }]}>{t('openSources')}</Text>
          </FocusablePressable>
        </View>
      </View>

      <View style={styles.guideGrid}>
        {featured ? (
          <GuidePreview
            label={t('featuredGuide')}
            guideId={featured.id}
            title={featured.title[locale]}
            summary={featured.summary[locale]}
          />
        ) : null}
        {lastOpened ? (
          <GuidePreview
            label={t('recentGuide')}
            guideId={lastOpened.id}
            title={lastOpened.title[locale]}
            summary={lastOpened.summary[locale]}
          />
        ) : (
          <Card style={styles.guidePreview}>
            <Eyebrow>{t('recentGuide')}</Eyebrow>
            <Text style={[styles.guideTitle, { fontSize: 22 * scale }]}>{t('noRecentTitle')}</Text>
            <Body muted>{t('noRecentBody')}</Body>
          </Card>
        )}
      </View>

      <SectionHeading title={t('featuredTopics')} />
      <View style={styles.topicGrid}>
        {guideTopics.map((topic) => (
          <FocusablePressable
            key={topic.id}
            accessibilityRole="button"
            accessibilityLabel={topic.label[locale]}
            onPress={() => router.push('/(tabs)/guides' as never)}
            style={({ pressed, focused }) => [
              styles.topic,
              focused && styles.focused,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.topicText, { fontSize: 14 * scale }]}>{topic.label[locale]}</Text>
            <Ionicons name="arrow-forward" size={16} color={palette.gold} />
          </FocusablePressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: 'relative',
    overflow: 'hidden',
    padding: 28,
    gap: 13,
    borderRadius: 28,
    backgroundColor: palette.red,
  },
  heroGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -70,
    top: -90,
    backgroundColor: 'rgba(207,161,90,0.22)',
  },
  heroEyebrow: { color: palette.goldLight },
  heroTitle: { maxWidth: 680, color: palette.white },
  heroBody: { maxWidth: 720, color: 'rgba(255,255,255,0.86)' },
  progressPill: {
    alignSelf: 'flex-start',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  progressText: { color: palette.white, fontWeight: '800' },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  heroButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.surface,
    backgroundColor: palette.surface,
  },
  heroButtonFocused: { borderColor: palette.gold },
  heroButtonText: { color: palette.red, fontWeight: '800' },
  guideGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  guidePreview: { flexGrow: 1, flexBasis: 320, minWidth: 0 },
  guideTitle: { color: palette.ink, fontFamily: 'serif', fontWeight: '800', lineHeight: 29 },
  guideSummary: { flexGrow: 1 },
  inlineButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: palette.goldSoft,
  },
  inlineButtonText: { color: palette.red, fontWeight: '800' },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  topic: {
    minHeight: 48,
    flexGrow: 1,
    flexBasis: 220,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: palette.goldBorder,
    backgroundColor: palette.surface,
  },
  topicText: { flex: 1, color: palette.ink, fontWeight: '700' },
  focused: { borderColor: palette.red },
  pressed: { opacity: 0.74 },
});
