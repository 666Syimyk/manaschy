import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useT, type TranslationKey } from '@/i18n';
import { Body, Card, Eyebrow, Screen, SectionHeading, Title, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

function DisclosureCard({
  icon,
  title,
  children,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <View style={styles.heading}>
        <View style={styles.icon}>
          <Ionicons name={icon} size={20} color={palette.red} />
        </View>
        <SectionHeading title={title} />
      </View>
      {children}
    </Card>
  );
}

export function PrivacyScreen() {
  const t = useT();
  const scale = useTextScale();
  const fields: TranslationKey[] = [
    'privacyFieldSchema',
    'privacyFieldPreferences',
    'privacyFieldOnboarding',
    'privacyFieldSaved',
    'privacyFieldProgress',
    'privacyFieldLast',
  ];

  return (
    <Screen>
      <Eyebrow>{t('privacy')}</Eyebrow>
      <Title>{t('privacyTitle')}</Title>
      <Body muted>{t('privacyIntro')}</Body>

      <DisclosureCard icon="phone-portrait-outline" title={t('privacyStoredTitle')}>
        <View style={styles.fieldList}>
          {fields.map((key) => (
            <View key={key} style={styles.fieldRow}>
              <View style={styles.bullet} />
              <Text style={[styles.fieldText, { fontSize: 14 * scale, lineHeight: 22 * scale }]}>
                {t(key)}
              </Text>
            </View>
          ))}
        </View>
      </DisclosureCard>
      <DisclosureCard icon="cloud-offline-outline" title={t('privacyNoRemoteTitle')}>
        <Body>{t('privacyNoRemoteBody')}</Body>
      </DisclosureCard>
      <DisclosureCard icon="open-outline" title={t('privacyExternalTitle')}>
        <Body>{t('privacyExternalBody')}</Body>
      </DisclosureCard>
      <DisclosureCard icon="trash-outline" title={t('privacyDeleteTitle')}>
        <Body>{t('privacyDeleteBody')}</Body>
      </DisclosureCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: palette.goldSoft },
  fieldList: { gap: 10 },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 7, height: 7, marginTop: 8, borderRadius: 4, backgroundColor: palette.gold },
  fieldText: { flex: 1, color: palette.ink },
});
