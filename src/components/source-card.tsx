import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { Locale, ReferenceSource } from '@/features/guides/types';
import { useT } from '@/i18n';
import { Body, FocusablePressable, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

export function SourceCard({ source, locale }: { source: ReferenceSource; locale: Locale }) {
  const t = useT();
  const scale = useTextScale();
  const typeKey = `sourceType${source.sourceType[0].toUpperCase()}${source.sourceType.slice(1)}` as
    | 'sourceTypeOfficial'
    | 'sourceTypeArchive'
    | 'sourceTypeLibrary'
    | 'sourceTypeAcademic';

  return (
    <FocusablePressable
      testID={`source-card-${source.id}`}
      accessibilityRole="link"
      accessibilityLabel={source.title}
      onPress={() => router.push(`/source/${source.id}` as never)}
      style={({ pressed, focused }) => [styles.root, focused && styles.focused, pressed && styles.pressed]}
    >
      <View style={styles.badge}>
        <Ionicons name="shield-checkmark-outline" size={16} color={palette.red} />
        <Text style={[styles.badgeText, { fontSize: 12 * scale }]}>{t(typeKey)}</Text>
      </View>
      <Text style={[styles.title, { fontSize: 20 * scale, lineHeight: 26 * scale }]}>{source.title}</Text>
      {source.publisher ? <Body muted>{source.publisher}</Body> : null}
      <View style={styles.metadata}>
        <Text style={[styles.metadataLabel, { fontSize: 12 * scale }]}>{t('citation')}</Text>
        <Text style={[styles.citation, { fontSize: 13 * scale, lineHeight: 20 * scale }]}>{source.citationText}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={[styles.checked, { fontSize: 12 * scale }]}>{t('lastChecked', { date: source.lastCheckedAt })}</Text>
        <Text style={[styles.linkOnly, { fontSize: 12 * scale }]}>{t('linkOnly')}</Text>
      </View>
      <Body muted style={styles.rights}>{source.rightsNote[locale]}</Body>
    </FocusablePressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexBasis: 380,
    flexGrow: 1,
    minWidth: 0,
    gap: 10,
    padding: 20,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: palette.goldBorder,
    backgroundColor: palette.surface,
  },
  focused: { borderColor: palette.red, boxShadow: '0 0 0 3px rgba(207,161,90,0.26)' },
  pressed: { opacity: 0.72 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { color: palette.red, fontWeight: '900' },
  title: { color: palette.ink, fontFamily: 'serif', fontWeight: '900' },
  metadata: { gap: 4, paddingTop: 4 },
  metadataLabel: { color: palette.gold, fontWeight: '900', textTransform: 'uppercase' },
  citation: { color: palette.ink },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  checked: { color: palette.muted, fontWeight: '700' },
  linkOnly: { color: palette.red, fontWeight: '900' },
  rights: { fontSize: 12 },
});
