import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { guideTopics } from '@/data/guides';
import type { GuideArticle, Locale } from '@/features/guides/types';
import { useT } from '@/i18n';
import { Body, FocusablePressable, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

interface GuideCardProps {
  guide: GuideArticle;
  locale: Locale;
  completed?: boolean;
  saved?: boolean;
}

export function GuideCard({ guide, locale, completed = false, saved = false }: GuideCardProps) {
  const t = useT();
  const scale = useTextScale();
  const topics = guide.topicIds
    .map((topicId) => guideTopics.find(({ id }) => id === topicId)?.label[locale])
    .filter(Boolean)
    .join(' · ');

  return (
    <FocusablePressable
      testID={`guide-card-${guide.id}`}
      accessibilityRole="link"
      accessibilityLabel={guide.title[locale]}
      onPress={() => router.push(`/guide/${guide.id}` as never)}
      style={({ pressed, focused }) => [
        styles.root,
        focused && styles.focused,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { fontSize: 12 * scale }]}>
          {t('readingMinutes', { count: guide.readingMinutes })}
        </Text>
        <View style={styles.states}>
          {saved ? <Ionicons accessibilityLabel={t('saved')} name="bookmark" size={17} color={palette.gold} /> : null}
          {completed ? (
            <View style={styles.completeBadge}>
              <Ionicons name="checkmark" size={14} color={palette.red} />
              <Text style={[styles.completeText, { fontSize: 11 * scale }]}>{t('completed')}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={[styles.title, { fontSize: 21 * scale, lineHeight: 27 * scale }]}>
        {guide.title[locale]}
      </Text>
      <Body muted numberOfLines={3}>{guide.summary[locale]}</Body>
      <Text style={[styles.topics, { fontSize: 12 * scale }]}>{topics}</Text>
      <View style={styles.action}>
        <Text style={[styles.actionText, { fontSize: 14 * scale }]}>{t('openGuide')}</Text>
        <Ionicons name="arrow-forward" size={17} color={palette.red} />
      </View>
    </FocusablePressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexBasis: 330,
    flexGrow: 1,
    minWidth: 0,
    gap: 11,
    padding: 20,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: palette.goldBorder,
    backgroundColor: palette.surface,
    boxShadow: '0 4px 18px rgba(43,33,27,0.055)',
  },
  focused: { borderColor: palette.red, boxShadow: '0 0 0 3px rgba(207,161,90,0.26)' },
  pressed: { opacity: 0.72 },
  metaRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  meta: { color: palette.gold, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  states: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: palette.goldSoft },
  completeText: { color: palette.red, fontWeight: '900' },
  title: { color: palette.ink, fontFamily: 'serif', fontWeight: '900' },
  topics: { color: palette.muted, fontWeight: '700' },
  action: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7 },
  actionText: { color: palette.red, fontWeight: '900' },
});
