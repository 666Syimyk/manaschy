import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingScreen } from '@/features/onboarding/onboarding-screen';
import { useGuideStore } from '@/features/local-state/store';
import { palette } from '@/theme';

export default function IndexRoute() {
  const hydrated = useGuideStore((state) => state.hydrated);
  const onboarded = useGuideStore((state) => state.onboarded);

  useEffect(() => {
    if (hydrated && onboarded) {
      router.replace('/(tabs)');
    }
  }, [hydrated, onboarded]);

  if (!hydrated || onboarded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={palette.red} />
      </View>
    );
  }

  return <OnboardingScreen onComplete={() => router.replace('/(tabs)')} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.ivory },
});
