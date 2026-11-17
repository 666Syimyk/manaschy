import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Body, Button, Title } from '@/shared/ui';
import { palette } from '@/theme';

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon = 'book-outline',
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={30} color={palette.red} />
      </View>
      <Title size={22} style={styles.title}>{title}</Title>
      <Body muted style={styles.body}>{body}</Body>
      {actionLabel && onAction ? (
        <Button variant="secondary" accessibilityLabel={actionLabel} onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 28,
    backgroundColor: palette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.goldBorder,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.goldSoft,
  },
  title: { textAlign: 'center' },
  body: { maxWidth: 480, textAlign: 'center' },
});
