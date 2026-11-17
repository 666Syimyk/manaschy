import { StyleSheet, Text, View } from 'react-native';
import { useGuideStore } from '@/features/local-state/store';
import { useT } from '@/i18n';
import { palette } from '@/theme';
import { FocusablePressable, useTextScale } from '@/shared/ui';

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const locale = useGuideStore((state) => state.locale);
  const setLocale = useGuideStore((state) => state.setLocale);
  const scale = useTextScale();
  const t = useT();
  const choices = [
    { value: 'ru' as const, label: t('languageRussian'), short: 'RU' },
    { value: 'ky' as const, label: t('languageKyrgyz'), short: 'KY' },
  ];

  return (
    <View accessibilityRole="radiogroup" style={[styles.group, compact && styles.groupCompact]}>
      {choices.map((choice) => {
        const selected = choice.value === locale;
        return (
          <FocusablePressable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityLabel={choice.label}
            accessibilityState={{ checked: selected, selected }}
            onPress={() => void setLocale(choice.value)}
            style={({ pressed, focused }) => [
              styles.option,
              compact && styles.optionCompact,
              selected && styles.optionSelected,
              focused && styles.optionFocused,
              pressed && styles.optionPressed,
            ]}
          >
            <Text
              style={[
                styles.label,
                { fontSize: (compact ? 12 : 14) * scale },
                selected && styles.labelSelected,
              ]}
            >
              {compact ? choice.short : choice.label}
            </Text>
          </FocusablePressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 4,
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.goldBorder,
    backgroundColor: palette.surface,
  },
  groupCompact: { padding: 2 },
  option: {
    minWidth: 112,
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCompact: { minWidth: 48, minHeight: 44, paddingHorizontal: 10 },
  optionSelected: { backgroundColor: palette.red, borderColor: palette.red },
  optionFocused: { borderColor: palette.gold },
  optionPressed: { opacity: 0.72 },
  label: { color: palette.ink, fontWeight: '800' },
  labelSelected: { color: palette.white },
});
