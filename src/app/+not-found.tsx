import { Stack, router } from 'expo-router';
import Head from 'expo-router/head';
import { EmptyState } from '@/components/empty-state';
import { useT } from '@/i18n';
import { Screen } from '@/shared/ui';

export default function NotFoundRoute() {
  const t = useT();
  return (
    <>
      <Stack.Screen options={{ title: t('notFoundTitle') }} />
      <Head>
        <title>{t('notFoundTitle')}</title>
      </Head>
      <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <EmptyState
          icon="compass-outline"
          title={t('notFoundTitle')}
          body={t('notFoundBody')}
          actionLabel={t('returnHome')}
          onAction={() => router.replace('/(tabs)' as never)}
        />
      </Screen>
    </>
  );
}
