import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGuideStore } from '@/features/local-state/store';
import { useT } from '@/i18n';
import { FocusablePressable, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

export function ReadingControls({ guideId }: { guideId: string }) {
  const saved = useGuideStore((state) => state.savedGuideIds.includes(guideId));
  const completed = useGuideStore((state) => Boolean(state.guideProgress[guideId]?.completedAt));
  const toggleSavedGuide = useGuideStore((state) => state.toggleSavedGuide);
  const setGuideCompleted = useGuideStore((state) => state.setGuideCompleted);
  const t = useT();
  const scale = useTextScale();

  const actions = [
    {
      key: 'saved',
      active: saved,
      label: t(saved ? 'removeSavedGuide' : 'saveGuide'),
      icon: saved ? 'bookmark' : 'bookmark-outline',
      onPress: () => void toggleSavedGuide(guideId),
    },
    {
      key: 'completed',
      active: completed,
      label: t(completed ? 'markAsUnread' : 'markAsRead'),
      icon: completed ? 'checkmark-circle' : 'checkmark-circle-outline',
      onPress: () => void setGuideCompleted(guideId, !completed),
    },
  ] as const;

  return (
    <View style={styles.root}>
      {actions.map((action) => (
        <FocusablePressable
          key={action.key}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityState={{ selected: action.active }}
          onPress={action.onPress}
          style={({ pressed, focused }) => [
            styles.button,
            action.active && styles.buttonActive,
            focused && styles.focused,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={action.icon}
            size={20}
            color={action.active ? palette.white : palette.red}
          />
          <Text
            style={[
              styles.label,
              { fontSize: 14 * scale },
              action.active && styles.labelActive,
            ]}
          >
            {action.label}
          </Text>
        </FocusablePressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  button: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.red,
    backgroundColor: palette.surface,
  },
  buttonActive: { backgroundColor: palette.red },
  focused: { borderColor: palette.gold, boxShadow: '0 0 0 3px rgba(207,161,90,0.26)' },
  pressed: { opacity: 0.68 },
  label: { color: palette.red, fontWeight: '900' },
  labelActive: { color: palette.white },
});
