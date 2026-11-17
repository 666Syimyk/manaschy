import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReferenceSource } from '@/features/guides/types';
import { useT, type TranslationKey } from '@/i18n';
import { openPublishedSource } from '@/services/external-links';
import { FocusablePressable, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

const FAILURE_KEY: Record<'invalid' | 'unsupported' | 'failed', TranslationKey> = {
  invalid: 'sourceInvalid',
  unsupported: 'sourceUnsupported',
  failed: 'sourceUnavailable',
};

export function ExternalSourceButton({ source }: { source: ReferenceSource }) {
  const [opening, setOpening] = useState(false);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const t = useT();
  const scale = useTextScale();

  const open = async () => {
    if (opening) return;
    setOpening(true);
    setFailure(null);
    const result = await openPublishedSource(source);
    if (!result.ok) {
      setFailure(FAILURE_KEY[result.reason]);
    }
    setOpening(false);
  };

  return (
    <View style={styles.root}>
      <FocusablePressable
        accessibilityRole="button"
        accessibilityLabel={t('openOfficialSource')}
        accessibilityState={{ disabled: opening }}
        disabled={opening}
        onPress={() => void open()}
        style={({ pressed, focused }) => [
          styles.button,
          focused && styles.focused,
          pressed && styles.pressed,
          opening && styles.disabled,
        ]}
      >
        {opening ? (
          <ActivityIndicator color={palette.white} />
        ) : (
          <Ionicons name="open-outline" size={20} color={palette.white} />
        )}
        <Text style={[styles.label, { fontSize: 15 * scale }]}>{t('openOfficialSource')}</Text>
      </FocusablePressable>
      {failure ? (
        <Text accessibilityRole="alert" style={[styles.error, { fontSize: 14 * scale }]}>
          {t(failure)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'flex-start', gap: 9 },
  button: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.red,
    backgroundColor: palette.red,
  },
  focused: { borderColor: palette.gold, boxShadow: '0 0 0 3px rgba(207,161,90,0.26)' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.6 },
  label: { color: palette.white, fontWeight: '900' },
  error: { color: palette.danger, fontWeight: '700' },
});
