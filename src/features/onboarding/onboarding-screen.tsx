import type { ComponentProps } from 'react';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Images } from '@/assets/images';
import { LanguageSelector } from '@/components/language-selector';
import { useGuideStore } from '@/features/local-state/store';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { useT } from '@/i18n';
import { Body, Eyebrow, FocusablePressable, Title, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

function Feature({
  icon,
  title,
  body,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
}) {
  const scale = useTextScale();
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={22} color={palette.red} />
      </View>
      <View style={styles.featureCopy}>
        <Text style={[styles.featureTitle, { fontSize: 15 * scale }]}>{title}</Text>
        <Body muted style={styles.featureBody}>{body}</Body>
      </View>
    </View>
  );
}

export function OnboardingScreen({ onComplete }: { onComplete?: () => void }) {
  const t = useT();
  const finishOnboarding = useGuideStore((state) => state.finishOnboarding);
  const isDesktop = useIsDesktop();
  const scale = useTextScale();

  const start = async () => {
    await finishOnboarding();
    onComplete?.();
  };

  return (
    <ImageBackground
      source={isDesktop ? Images.heroLightWide : Images.heroLightMobile}
      style={styles.background}
      resizeMode="cover"
    >
      <View pointerEvents="none" style={styles.overlay} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.shell, isDesktop && styles.shellDesktop]}>
          <View style={styles.topbar}>
            <View style={styles.brand}>
              <Image source={Images.logoMark} style={styles.logo} resizeMode="contain" />
              <Text style={[styles.brandName, { fontSize: 21 * scale }]}>Manaschy</Text>
            </View>
            <LanguageSelector compact />
          </View>

          <View style={[styles.main, isDesktop && styles.mainDesktop]}>
            <View style={styles.copyColumn}>
              <Eyebrow>{t('onboardingEyebrow')}</Eyebrow>
              <Title size={isDesktop ? 48 : 36}>{t('onboardingTitle')}</Title>
              <Body style={styles.description}>{t('onboardingDescription')}</Body>

              <FocusablePressable
                testID="onboarding-primary-action"
                accessibilityRole="button"
                accessibilityLabel={t('onboardingStart')}
                onPress={() => void start()}
                style={({ pressed, focused }) => [
                  styles.primaryAction,
                  focused && styles.primaryActionFocused,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.primaryActionText, { fontSize: 17 * scale }]}>
                  {t('onboardingStart')}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={palette.white} />
              </FocusablePressable>
            </View>

            <View style={styles.featurePanel}>
              <Feature
                icon="cloud-offline-outline"
                title={t('onboardingFeatureOfflineTitle')}
                body={t('onboardingFeatureOfflineBody')}
              />
              <Feature
                icon="link-outline"
                title={t('onboardingFeatureSourcesTitle')}
                body={t('onboardingFeatureSourcesBody')}
              />
              <Feature
                icon="language-outline"
                title={t('onboardingFeatureLanguagesTitle')}
                body={t('onboardingFeatureLanguagesBody')}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: palette.ivory },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(245,240,232,0.78)',
  },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  shell: {
    width: '100%',
    maxWidth: 1120,
    minHeight: 620,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,252,247,0.94)',
    borderWidth: 1,
    borderColor: palette.goldBorder,
    boxShadow: '0 20px 70px rgba(43,33,27,0.16)',
  },
  shellDesktop: { minHeight: 650 },
  topbar: {
    minHeight: 76,
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.goldBorder,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 38, height: 38 },
  brandName: { color: palette.red, fontFamily: 'serif', fontWeight: '900' },
  main: { flex: 1, padding: 24, gap: 28, justifyContent: 'center' },
  mainDesktop: { flexDirection: 'row', alignItems: 'center', padding: 52, gap: 56 },
  copyColumn: { flex: 1.15, gap: 18 },
  description: { maxWidth: 650 },
  primaryAction: {
    minHeight: 54,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 26,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.red,
    backgroundColor: palette.red,
  },
  primaryActionFocused: { borderColor: palette.gold, boxShadow: '0 0 0 3px rgba(207,161,90,0.28)' },
  primaryActionText: { color: palette.white, fontWeight: '900' },
  pressed: { opacity: 0.76 },
  featurePanel: {
    flex: 0.85,
    gap: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: palette.ivory,
    borderWidth: 1,
    borderColor: palette.goldBorder,
  },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.goldSoft,
  },
  featureCopy: { flex: 1, gap: 3 },
  featureTitle: { color: palette.ink, fontWeight: '800' },
  featureBody: { fontSize: 13 },
});
