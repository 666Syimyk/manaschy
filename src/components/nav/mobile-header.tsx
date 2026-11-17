import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageSelector } from '@/components/language-selector';
import { useT } from '@/i18n';
import { useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

interface Props {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function MobileHeader({ title, showBack = false, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const scale = useTextScale();
  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.root}>
        <View style={styles.leading}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('back')}
              onPress={onBack}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={23} color={palette.red} />
            </Pressable>
          ) : (
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>M</Text>
            </View>
          )}
        </View>
        <Text accessibilityRole="header" numberOfLines={1} style={[styles.title, { fontSize: 16 * scale }]}>
          {title ?? t('appName')}
        </Text>
        <View style={styles.trailing}>
          <LanguageSelector compact />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.surface, borderBottomWidth: 1, borderBottomColor: palette.goldBorder },
  root: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  leading: { width: 54, alignItems: 'flex-start' },
  trailing: { minWidth: 108, alignItems: 'flex-end' },
  title: { flex: 1, color: palette.ink, fontFamily: 'serif', fontWeight: '900', textAlign: 'center' },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: palette.goldSoft,
    borderWidth: 1,
    borderColor: palette.goldBorder,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red,
    borderWidth: 2,
    borderColor: palette.gold,
  },
  brandMarkText: { color: palette.white, fontFamily: 'serif', fontSize: 19, fontWeight: '900' },
  pressed: { opacity: 0.66 },
});
