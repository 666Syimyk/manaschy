import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { EmptyState } from '@/components/empty-state';
import { ExternalSourceButton } from '@/components/external-source-button';
import { getSourceById } from '@/data/guides';
import { useGuideStore } from '@/features/local-state/store';
import { useT, type TranslationKey } from '@/i18n';
import { Body, Card, Eyebrow, Screen, SectionHeading, Title, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

const TYPE_KEY = {
  official: 'sourceTypeOfficial',
  archive: 'sourceTypeArchive',
  library: 'sourceTypeLibrary',
  academic: 'sourceTypeAcademic',
} as const satisfies Record<string, TranslationKey>;

export function SourceDetailScreen({ id }: { id: string }) {
  const source = getSourceById(id);
  const locale = useGuideStore((state) => state.locale);
  const t = useT();
  const scale = useTextScale();

  if (!source) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title={t('sourceNotFoundTitle')}
          body={t('notFoundBody')}
          actionLabel={t('returnToSources')}
          onAction={() => router.push('/(tabs)/sources' as never)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Eyebrow>{t(TYPE_KEY[source.sourceType])}</Eyebrow>
        <Title size={36}>{source.title}</Title>
        {source.publisher ? <Body muted>{source.publisher}</Body> : null}
        <View style={styles.checked}>
          <Ionicons name="shield-checkmark-outline" size={19} color={palette.red} />
          <Text style={[styles.checkedText, { fontSize: 13 * scale }]}>
            {t('lastChecked', { date: source.lastCheckedAt })}
          </Text>
        </View>
      </View>

      <Card>
        <SectionHeading title={t('citation')} />
        <Body>{source.citationText}</Body>
      </Card>
      <Card>
        <SectionHeading title={t('rightsNote')} />
        <View style={styles.linkOnlyRow}>
          <Ionicons name="link-outline" size={19} color={palette.red} />
          <Text style={[styles.linkOnly, { fontSize: 14 * scale }]}>{t('linkOnly')}</Text>
        </View>
        <Body>{source.rightsNote[locale]}</Body>
      </Card>
      <Card>
        <Body muted>{t('externalLinkNotice')}</Body>
        <ExternalSourceButton source={source} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 13, paddingVertical: 8 },
  checked: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, borderRadius: 999, backgroundColor: palette.goldSoft },
  checkedText: { color: palette.red, fontWeight: '900' },
  linkOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkOnly: { color: palette.red, fontWeight: '900' },
});
