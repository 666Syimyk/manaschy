import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { LanguageSelector } from '@/components/language-selector';
import { useGuideStore } from '@/features/local-state/store';
import { useT } from '@/i18n';
import { Body, Card, FocusablePressable, Screen, SectionHeading, Title, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

export function SettingsScreen() {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const fontScale = useGuideStore((state) => state.fontScale);
  const setFontScale = useGuideStore((state) => state.setFontScale);
  const resetLocalData = useGuideStore((state) => state.resetLocalData);
  const t = useT();
  const scale = useTextScale();
  const sizes = [
    { value: 'small' as const, label: t('textSizeSmall') },
    { value: 'medium' as const, label: t('textSizeMedium') },
    { value: 'large' as const, label: t('textSizeLarge') },
  ];

  const confirmReset = async () => {
    if (resetting) return;
    setResetting(true);
    await resetLocalData();
    router.replace('/');
  };

  return (
    <Screen>
      <Title>{t('settingsTitle')}</Title>
      <Body muted>{t('settingsIntro')}</Body>

      <Card>
        <SectionHeading title={t('language')} />
        <LanguageSelector />
      </Card>

      <Card>
        <SectionHeading title={t('textSize')} />
        <View accessibilityRole="radiogroup" style={styles.sizes}>
          {sizes.map((item) => {
            const selected = item.value === fontScale;
            return (
              <FocusablePressable
                key={item.value}
                accessibilityRole="radio"
                accessibilityLabel={item.label}
                accessibilityState={{ checked: selected, selected }}
                onPress={() => void setFontScale(item.value)}
                style={({ pressed, focused }) => [
                  styles.size,
                  selected && styles.sizeSelected,
                  focused && styles.focused,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.sizeLabel, { fontSize: 14 * scale }, selected && styles.sizeLabelSelected]}>
                  {item.label}
                </Text>
              </FocusablePressable>
            );
          })}
        </View>
      </Card>

      <Card>
        {[{ label: t('privacy'), href: '/privacy' }, { label: t('methodology'), href: '/methodology' }].map((item) => (
          <FocusablePressable
            key={item.href}
            accessibilityRole="link"
            accessibilityLabel={item.label}
            onPress={() => router.push(item.href as never)}
            style={({ pressed, focused }) => [styles.link, focused && styles.linkFocused, pressed && styles.pressed]}
          >
            <Text style={[styles.linkText, { fontSize: 15 * scale }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={palette.red} />
          </FocusablePressable>
        ))}
      </Card>

      <Card style={styles.dangerCard}>
        <SectionHeading title={t('resetLocalData')} />
        {confirmingReset ? (
          <View style={styles.confirmation}>
            <Text accessibilityRole="alert" style={[styles.warning, { fontSize: 14 * scale }]}>
              {t('resetWarning')}
            </Text>
            <View style={styles.confirmActions}>
              <FocusablePressable
                accessibilityRole="button"
                accessibilityLabel={t('cancel')}
                onPress={() => setConfirmingReset(false)}
                style={({ pressed, focused }) => [styles.cancelButton, focused && styles.focused, pressed && styles.pressed]}
              >
                <Text style={[styles.cancelText, { fontSize: 14 * scale }]}>{t('cancel')}</Text>
              </FocusablePressable>
              <FocusablePressable
                accessibilityRole="button"
                accessibilityLabel={t('resetConfirm')}
                accessibilityState={{ disabled: resetting }}
                disabled={resetting}
                onPress={() => void confirmReset()}
                style={({ pressed, focused }) => [styles.confirmButton, focused && styles.focused, pressed && styles.pressed, resetting && styles.disabled]}
              >
                <Text style={[styles.confirmText, { fontSize: 14 * scale }]}>{t('resetConfirm')}</Text>
              </FocusablePressable>
            </View>
          </View>
        ) : (
          <FocusablePressable
            accessibilityRole="button"
            accessibilityLabel={t('resetLocalData')}
            onPress={() => setConfirmingReset(true)}
            style={({ pressed, focused }) => [styles.resetButton, focused && styles.focused, pressed && styles.pressed]}
          >
            <Ionicons name="trash-outline" size={20} color={palette.red} />
            <Text style={[styles.resetText, { fontSize: 14 * scale }]}>{t('resetLocalData')}</Text>
          </FocusablePressable>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  size: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 999, borderWidth: 2, borderColor: palette.goldBorder },
  sizeSelected: { backgroundColor: palette.red, borderColor: palette.red },
  sizeLabel: { color: palette.ink, fontWeight: '800' },
  sizeLabelSelected: { color: palette.white },
  link: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 6, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  linkFocused: { borderColor: palette.red },
  linkText: { flex: 1, color: palette.ink, fontWeight: '800' },
  dangerCard: { borderColor: 'rgba(165,22,22,0.3)' },
  resetButton: { minHeight: 48, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, borderRadius: 999, borderWidth: 2, borderColor: palette.red },
  resetText: { color: palette.red, fontWeight: '900' },
  confirmation: { gap: 14 },
  warning: { color: palette.danger, lineHeight: 21, fontWeight: '700' },
  confirmActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  cancelButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: 999, borderWidth: 2, borderColor: palette.goldBorder },
  cancelText: { color: palette.ink, fontWeight: '900' },
  confirmButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: 999, borderWidth: 2, borderColor: palette.red, backgroundColor: palette.red },
  confirmText: { color: palette.white, fontWeight: '900' },
  focused: { borderColor: palette.gold, boxShadow: '0 0 0 3px rgba(207,161,90,0.26)' },
  pressed: { opacity: 0.68 },
  disabled: { opacity: 0.55 },
});
