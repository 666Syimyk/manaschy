import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { DefaultTheme, Stack, ThemeProvider, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BrandLogo } from '@/components/brand-logo';
import { ResponsiveShell } from '@/components/nav/responsive-shell';
import { useGuideStore } from '@/features/local-state/store';
import { OnboardingScreen } from '@/features/onboarding/onboarding-screen';
import { useT } from '@/i18n';
import { getTheme, palette } from '@/theme';

function LoadingScreen() {
  const t = useT();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={t('loading')} style={styles.loading}>
      <BrandLogo size={64} />
      <Text style={styles.loadingBrand}>Manaschy</Text>
      <ActivityIndicator color={palette.red} />
      <Text style={styles.loadingText}>{t('loading')}</Text>
    </View>
  );
}

export default function RootLayout() {
  const initialize = useGuideStore((state) => state.initialize);
  const hydrated = useGuideStore((state) => state.hydrated);
  const onboarded = useGuideStore((state) => state.onboarded);
  const segments = useSegments();
  const theme = getTheme(false);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (!hydrated) {
    return <LoadingScreen />;
  }

  const firstSegment = String(segments[0] ?? '');
  const isPublicRoute =
    firstSegment === '' ||
    firstSegment === 'index' ||
    firstSegment === 'login' ||
    firstSegment === 'register';
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      primary: theme.primary,
      border: theme.border,
      notification: theme.primary,
    },
  };
  const navigator = (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="dark" />
        {!onboarded && !isPublicRoute ? (
          <OnboardingScreen />
        ) : isPublicRoute ? (
          navigator
        ) : (
          <ResponsiveShell>{navigator}</ResponsiveShell>
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: palette.ivory,
  },
  loadingBrand: { color: palette.red, fontFamily: 'serif', fontSize: 24, fontWeight: '900' },
  loadingText: { color: palette.muted, fontSize: 14 },
});
