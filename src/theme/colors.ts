export type RangoColors = {
  page: string;
  background: string;
  surface: string;
  surface2: string;
  text: string;
  text2: string;
  border: string;
  primary: string;
  primary2: string;
  onPrimary: string;
  soft: string;
  success: string;
  error: string;
  skeleton: string;
  shadow: string;
  isDark: boolean;
};

export const lightColors: RangoColors = {
  page: '#EDE9E3',
  background: '#F7F7F7',
  surface: '#FFFFFF',
  surface2: '#F7F7F7',
  text: '#1F1F1F',
  text2: '#737373',
  border: '#E8E8E8',
  primary: '#FF6B00',
  primary2: '#FF8A34',
  onPrimary: '#FFFFFF',
  soft: '#FFF1E6',
  success: '#22A447',
  error: '#E53935',
  skeleton: '#ECECEC',
  shadow: 'rgba(31, 31, 31, 0.09)',
  isDark: false,
};

export const darkColors: RangoColors = {
  page: '#232326',
  background: '#101012',
  surface: '#17181B',
  surface2: '#1E2024',
  text: '#F4F4F5',
  text2: '#9B9BA3',
  border: '#2A2C31',
  primary: '#FF6B00',
  primary2: '#FF8A34',
  onPrimary: '#FFFFFF',
  soft: '#2C1A0C',
  success: '#31C25C',
  error: '#FF5F58',
  skeleton: '#23252A',
  shadow: 'rgba(0, 0, 0, 0.55)',
  isDark: true,
};
