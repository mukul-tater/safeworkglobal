import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  hero: { fontSize: 32, fontWeight: '800' as TextStyle['fontWeight'], color: colors.text, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800' as TextStyle['fontWeight'], color: colors.text, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700' as TextStyle['fontWeight'], color: colors.text },
  h3: { fontSize: 17, fontWeight: '700' as TextStyle['fontWeight'], color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as TextStyle['fontWeight'], color: colors.text, lineHeight: 22 },
  bodySm: { fontSize: 14, fontWeight: '400' as TextStyle['fontWeight'], color: colors.textMuted, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as TextStyle['fontWeight'], color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '600' as TextStyle['fontWeight'], color: colors.text },
  button: { fontSize: 15, fontWeight: '600' as TextStyle['fontWeight'] },
};
