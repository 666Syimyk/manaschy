export const palette = {
  // Core brand
  red: '#A51616',
  redDark: '#8E1111',
  redDeep: '#6B0C0C',

  // Gold accents
  gold: '#CFA15A',
  goldLight: '#E7D3A0',
  goldSoft: '#F5ECD5',
  goldBorder: '#E3CFA0',

  // Backgrounds
  ivory: '#F5F0E8',      // main app background
  ivoryDeep: '#EDE7DA',  // slightly deeper
  surface: '#FFFCF7',    // card surfaces
  surfaceAlt: '#F9F4EC', // alternate card

  // Text
  ink: '#2B211B',       // primary text
  muted: '#6F6258',     // secondary text
  mutedLight: '#9A8A80', // placeholder / hint

  // System
  white: '#FFFFFF',
  border: '#E3CFA0',
  danger: '#A51616',

  // Legacy aliases (kept so old imports don't break)
  softRed: '#F9F4EC',
};

export const radii = { sm: 12, md: 20, lg: 28 };

export type ManaschyTheme = ReturnType<typeof getTheme>;

export function getTheme(_dark = false) {
  return {
    dark: false,
    background: palette.ivory,
    surface: palette.surface,
    surfaceAlt: palette.surfaceAlt,
    text: palette.ink,
    muted: palette.muted,
    primary: palette.red,
    primaryDark: palette.redDark,
    accent: palette.gold,
    accentLight: palette.goldLight,
    border: palette.border,
  };
}
