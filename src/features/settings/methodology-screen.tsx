import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useT, type TranslationKey } from '@/i18n';
import { Body, Card, Eyebrow, Screen, SectionHeading, Title } from '@/shared/ui';
import { palette } from '@/theme';

const SECTIONS: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: TranslationKey;
  body: TranslationKey;
}[] = [
  { icon: 'link-outline', title: 'methodologyCitationsTitle', body: 'methodologyCitationsBody' },
  { icon: 'calendar-outline', title: 'methodologyDatesTitle', body: 'methodologyDatesBody' },
  { icon: 'shield-outline', title: 'methodologyRightsTitle', body: 'methodologyRightsBody' },
  { icon: 'remove-circle-outline', title: 'methodologyExcludedTitle', body: 'methodologyExcludedBody' },
  { icon: 'checkmark-done-outline', title: 'methodologyReviewTitle', body: 'methodologyReviewBody' },
];

export function MethodologyScreen() {
  const t = useT();
  return (
    <Screen>
      <Eyebrow>{t('methodology')}</Eyebrow>
      <Title>{t('methodologyTitle')}</Title>
      <Body muted>{t('methodologyIntro')}</Body>
      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <View style={styles.heading}>
            <View style={styles.icon}>
              <Ionicons name={section.icon} size={20} color={palette.red} />
            </View>
            <SectionHeading title={t(section.title)} />
          </View>
          <Body>{t(section.body)}</Body>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: palette.goldSoft },
});
