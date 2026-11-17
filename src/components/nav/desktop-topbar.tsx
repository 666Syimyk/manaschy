import { StyleSheet, Text, View } from 'react-native';
import { LanguageSelector } from '@/components/language-selector';
import { useT } from '@/i18n';
import { useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

export function DesktopTopBar({ title }: { title?: string }) {
  const t = useT();
  const scale = useTextScale();
  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { fontSize: 10 * scale }]}>{t('appName')}</Text>
        <Text accessibilityRole="header" numberOfLines={1} style={[styles.title, { fontSize: 20 * scale }]}>
          {title ?? t('home')}
        </Text>
      </View>
      <LanguageSelector compact />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 24,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.goldBorder,
  },
  copy: { flex: 1, gap: 2 },
  eyebrow: { color: palette.gold, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: palette.ink, fontFamily: 'serif', fontWeight: '800' },
});
