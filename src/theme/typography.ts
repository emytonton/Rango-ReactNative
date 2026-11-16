import type { TextStyle } from 'react-native';

export const fonts = {
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extraBold: 'PlusJakartaSans-ExtraBold',
};

export const typography = {
  display: {
    fontFamily: fonts.extraBold,
    fontSize: 31,
    lineHeight: 35,
    letterSpacing: -1.1,
  },
  title: { fontFamily: fonts.extraBold, fontSize: 21, letterSpacing: -0.6 },
  section: { fontFamily: fonts.extraBold, fontSize: 17, letterSpacing: -0.4 },
  bodyLarge: { fontFamily: fonts.medium, fontSize: 14.5, lineHeight: 22 },
  body: { fontFamily: fonts.medium, fontSize: 14 },
  label: { fontFamily: fonts.semiBold, fontSize: 12 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16.5 },
  button: { fontFamily: fonts.bold, fontSize: 16 },
} satisfies Record<string, TextStyle>;

export type RangoTypography = typeof typography;
