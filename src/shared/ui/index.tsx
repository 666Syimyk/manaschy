import { useState, type PropsWithChildren, type ReactNode, type Ref } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type TextProps,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useGuideStore } from '@/features/local-state/store';
import { getTheme, palette } from '@/theme';

export function useManaschyTheme() {
  return getTheme(false);
}

export function useTextScale(): number {
  const fontScale = useGuideStore((state) => state.fontScale);
  return fontScale === 'small' ? 0.9 : fontScale === 'large' ? 1.16 : 1;
}

type FocusablePressableState = PressableStateCallbackType & { focused: boolean };

export type FocusablePressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: FocusablePressableState) => StyleProp<ViewStyle>);
};

export function FocusablePressable({
  onBlur,
  onFocus,
  style,
  ...props
}: FocusablePressableProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      {...props}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={({ pressed, hovered }) =>
        typeof style === 'function' ? style({ pressed, hovered, focused }) : style
      }
    />
  );
}

export function Eyebrow({ children, style }: PropsWithChildren<{ style?: TextStyle }>) {
  const scale = useTextScale();
  return <Text style={[styles.eyebrow, { fontSize: 11 * scale }, style]}>{children}</Text>;
}

export function Title({
  children,
  size = 30,
  style,
}: PropsWithChildren<{ size?: number; style?: TextStyle }>) {
  const scale = useTextScale();
  return (
    <Text accessibilityRole="header" selectable style={[styles.title, { fontSize: size * scale, lineHeight: size * scale * 1.2 }, style]}>
      {children}
    </Text>
  );
}

export function Body({
  children,
  muted = false,
  style,
  ...props
}: PropsWithChildren<TextProps & { muted?: boolean }>) {
  const scale = useTextScale();
  const fontSize = 15 * scale;
  return (
    <Text
      selectable
      {...props}
      style={[
        styles.body,
        { color: muted ? palette.muted : palette.ink, fontSize, lineHeight: fontSize * 1.55 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function AppScreen({
  children,
  style,
  keyboardShouldPersistTaps,
  contentContainerStyle,
  scrollRef,
}: PropsWithChildren<{
  style?: ViewStyle;
  keyboardShouldPersistTaps?: 'always' | 'handled' | 'never';
  contentContainerStyle?: ViewStyle;
  scrollRef?: Ref<ScrollView>;
}>) {
  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.screen, style]}
      contentContainerStyle={[styles.screenContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  );
}

export function AppCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const scale = useTextScale();
  return <View style={[styles.card, { padding: 20 * scale }, style]}>{children}</View>;
}

export function AppButton({
  children,
  variant = 'primary',
  style,
  ...props
}: PropsWithChildren<PressableProps & { variant?: 'primary' | 'secondary' | 'ghost' }>) {
  const scale = useTextScale();
  const backgroundColor = variant === 'primary' ? palette.red : variant === 'secondary' ? palette.surface : 'transparent';
  const textColor = variant === 'primary' ? palette.white : palette.ink;
  const borderColor = variant === 'ghost' ? 'transparent' : variant === 'primary' ? palette.red : palette.goldBorder;

  return (
    <FocusablePressable
      accessibilityRole="button"
      {...props}
      style={({ pressed, hovered, focused }) => [
        styles.button,
        {
          minHeight: Math.max(48, 48 * scale),
          backgroundColor,
          borderColor: focused ? palette.gold : borderColor,
          opacity: pressed ? 0.76 : 1,
        },
        typeof style === 'function' ? style({ pressed, hovered }) : style,
      ]}
    >
      <Text style={[styles.buttonText, { color: textColor, fontSize: 16 * scale }]}>{children}</Text>
    </FocusablePressable>
  );
}

export function AppInput({ label, ...props }: TextInputProps & { label: string }) {
  const scale = useTextScale();
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { fontSize: 13 * scale }]}>{label}</Text>
      <TextInput
        accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={palette.mutedLight}
        style={[styles.input, { fontSize: 15 * scale, minHeight: Math.max(48, 48 * scale) }]}
        {...props}
      />
    </View>
  );
}

export function OrnamentDivider() {
  return (
    <View accessibilityElementsHidden style={styles.ornament}>
      <View style={styles.ornamentLine} />
      <View style={styles.ornamentDiamond} />
      <View style={styles.ornamentLine} />
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  const scale = useTextScale();
  return (
    <View style={styles.sectionHeading}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { fontSize: 20 * scale }]}>
        {title}
      </Text>
      {action}
    </View>
  );
}

export function HeroCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.hero, style]}>{children}</View>;
}

export function StatCard({ value, label }: { value: number | string; label: string }) {
  const scale = useTextScale();
  return (
    <AppCard style={styles.statCard}>
      <Text style={[styles.statValue, { fontSize: 26 * scale }]}>{value}</Text>
      <Body muted style={styles.statLabel}>{label}</Body>
    </AppCard>
  );
}

export {
  AppButton as Button,
  AppCard as Card,
  AppScreen as Screen,
  OrnamentDivider as Ornament,
  SectionTitle as SectionHeading,
};

const styles = StyleSheet.create({
  eyebrow: {
    color: palette.gold,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.ink,
    fontFamily: 'serif',
    fontWeight: '800',
  },
  body: { color: palette.ink },
  screen: { flex: 1, backgroundColor: palette.ivory },
  screenContent: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 72,
    gap: 18,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: palette.goldBorder,
    gap: 12,
    boxShadow: '0 4px 18px rgba(43,33,27,0.055)',
  },
  button: {
    paddingHorizontal: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    boxShadow: '0 3px 12px rgba(43,33,27,0.06)',
  },
  buttonText: { fontWeight: '800', letterSpacing: 0.1, textAlign: 'center' },
  inputGroup: { gap: 7 },
  inputLabel: { color: palette.ink, fontWeight: '700' },
  input: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: palette.goldBorder,
    backgroundColor: palette.surface,
    color: palette.ink,
    paddingHorizontal: 16,
  },
  ornament: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  ornamentLine: { height: 1, flex: 1, backgroundColor: palette.goldBorder },
  ornamentDiamond: { width: 8, height: 8, backgroundColor: palette.gold, transform: [{ rotate: '45deg' }] },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { flex: 1, fontFamily: 'serif', fontWeight: '800', color: palette.ink },
  hero: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  statCard: { flex: 1, alignItems: 'center', padding: 14 },
  statValue: { color: palette.red, fontWeight: '800', fontFamily: 'serif' },
  statLabel: { textAlign: 'center', fontSize: 12 },
});
