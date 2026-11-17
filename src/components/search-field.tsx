import { StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FocusablePressable, useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

interface SearchFieldProps {
  value: string;
  label: string;
  placeholder: string;
  clearLabel: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
}

export function SearchField({
  value,
  label,
  placeholder,
  clearLabel,
  onChangeText,
  onClear,
}: SearchFieldProps) {
  const scale = useTextScale();
  return (
    <View style={styles.root}>
      <Ionicons name="search-outline" size={21} color={palette.muted} />
      <TextInput
        accessibilityLabel={label}
        accessibilityRole="search"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.mutedLight}
        returnKeyType="search"
        clearButtonMode="never"
        style={[styles.input, { fontSize: 16 * scale }]}
      />
      {value ? (
        <FocusablePressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          onPress={onClear}
          style={({ pressed, focused }) => [
            styles.clear,
            focused && styles.focused,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="close" size={20} color={palette.red} />
        </FocusablePressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 5,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: palette.goldBorder,
    backgroundColor: palette.surface,
  },
  input: { minWidth: 0, flex: 1, minHeight: 48, color: palette.ink, outlineStyle: 'none' } as never,
  clear: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  focused: { borderColor: palette.gold },
  pressed: { opacity: 0.64 },
});
