import { Platform, ViewStyle } from 'react-native';

export const shadows = {
  sm: Platform.select<ViewStyle>({
    ios: { shadowColor: '#1A1F36', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 2 },
  }),
  md: Platform.select<ViewStyle>({
    ios: { shadowColor: '#1A1F36', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    android: { elevation: 4 },
  }),
  lg: Platform.select<ViewStyle>({
    ios: { shadowColor: '#1A1F36', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20 },
    android: { elevation: 8 },
  }),
};
