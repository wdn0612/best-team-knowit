const colors = {
  // iOS system colors
  white: '#FFFFFF',
  black: '#000000',
  gray: 'rgba(60, 60, 67, 0.6)',
  lightWhite: 'rgba(235, 235, 245, 0.6)',
  blueTintColor: '#007AFF',
  // iOS system backgrounds
  iosLightBg: '#F2F2F7',
  iosLightSecondaryBg: '#FFFFFF',
  iosDarkBg: '#000000',
  iosDarkSecondaryBg: '#1C1C1E',
  iosDarkTertiaryBg: '#2C2C2E',
  // iOS system separators
  iosLightSeparator: '#C6C6C8',
  iosDarkSeparator: '#38383A',
  // Theme-specific
  lightPink: '#F7B5CD',
  neonCyan: '#00f0ff',
  neonMagenta: '#ff00ff',
  cyberpunkDark: '#0d0221',
  matrixGreen: '#00ff41',
  matrixDarkGreen: '#003b00',
  matrixBlack: '#0d0d0d'
}

const fonts = {
  ultraLightFont: 'Geist-Ultralight',
  thinFont: 'Geist-Thin',
  regularFont: 'Geist-Regular',
  lightFont: 'Geist-Light',
  mediumFont: 'Geist-Medium',
  semiBoldFont: 'Geist-SemiBold',
  boldFont: 'Geist-Bold',
  blackFont: 'Geist-Black',
  ultraBlackFont: 'Geist-Ultrablack',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

const lightTheme = {
  ...fonts,
  name: 'Light',
  label: 'light',
  textColor: colors.black,
  secondaryTextColor: colors.white,
  mutedForegroundColor: colors.gray,
  backgroundColor: colors.iosLightBg,
  placeholderTextColor: 'rgba(60, 60, 67, 0.3)',
  secondaryBackgroundColor: colors.black,
  borderColor: colors.iosLightSeparator,
  tintColor: colors.blueTintColor,
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.blueTintColor,
  tabBarInactiveTintColor: 'rgba(60, 60, 67, 0.5)',
  cardBackgroundColor: colors.iosLightSecondaryBg,
  blockquoteBackgroundColor: '#E5E5EA',
  blockquoteBorderColor: colors.iosLightSeparator,
  codeBackgroundColor: '#1C1C1E',
  codeBorderColor: colors.iosLightSeparator,
  dividerColor: colors.iosLightSeparator,
  tableBorderColor: colors.iosLightSeparator,
  headingAccentColor: colors.blueTintColor,
  accentPalette: [colors.blueTintColor],
}

const darkTheme = {
  ...fonts,
  name: 'Dark',
  label: 'dark',
  textColor: colors.white,
  secondaryTextColor: colors.white,
  mutedForegroundColor: colors.lightWhite,
  backgroundColor: colors.iosDarkBg,
  placeholderTextColor: 'rgba(235, 235, 245, 0.3)',
  secondaryBackgroundColor: colors.white,
  borderColor: colors.iosDarkSeparator,
  tintColor: '#0A84FF',
  tintTextColor: colors.white,
  tabBarActiveTintColor: '#0A84FF',
  tabBarInactiveTintColor: 'rgba(235, 235, 245, 0.5)',
  cardBackgroundColor: colors.iosDarkSecondaryBg,
  blockquoteBackgroundColor: colors.iosDarkTertiaryBg,
  blockquoteBorderColor: colors.iosDarkSeparator,
  codeBackgroundColor: colors.iosDarkTertiaryBg,
  codeBorderColor: colors.iosDarkSeparator,
  dividerColor: colors.iosDarkSeparator,
  tableBorderColor: colors.iosDarkSeparator,
  headingAccentColor: '#0A84FF',
  accentPalette: ['#0A84FF'],
}

const hackerNews = {
  ...lightTheme,
  name: 'Hacker News',
  label: 'hackerNews',
  backgroundColor: '#EAEAEA',
  cardBackgroundColor: '#F5F5F5',
  tintColor: '#ed702d',
  tabBarActiveTintColor: '#ed702d',
  headingAccentColor: '#ed702d',
  accentPalette: ['#ed702d'],
}

const miami = {
  ...darkTheme,
  name: 'Miami',
  label: 'miami',
  backgroundColor: '#231F20',
  cardBackgroundColor: '#2E2A2B',
  tintColor: colors.lightPink,
  tintTextColor: '#231F20',
  tabBarActiveTintColor: colors.lightPink,
  headingAccentColor: colors.lightPink,
  accentPalette: [colors.lightPink],
}

const vercel = {
  ...darkTheme,
  name: 'Vercel',
  label: 'vercel',
  backgroundColor: colors.black,
  cardBackgroundColor: '#171717',
  tintColor: colors.white,
  tintTextColor: colors.black,
  tabBarActiveTintColor: colors.white,
  secondaryTextColor: colors.white,
  headingAccentColor: colors.white,
  accentPalette: [colors.white],
}

const cyberpunk = {
  ...darkTheme,
  name: 'Cyberpunk',
  label: 'cyberpunk',
  backgroundColor: '#0D0221',
  cardBackgroundColor: '#1A0A33',
  tintColor: '#66F5FF',
  tintTextColor: '#0D0221',
  tabBarActiveTintColor: '#66F5FF',
  tabBarInactiveTintColor: 'rgba(102, 245, 255, 0.4)',
  borderColor: 'rgba(102, 245, 255, 0.2)',
  headingAccentColor: '#66F5FF',
  blockquoteBorderColor: 'rgba(102, 245, 255, 0.3)',
  tableBorderColor: 'rgba(102, 245, 255, 0.2)',
  accentPalette: ['#66F5FF'],
}

const matrix = {
  ...darkTheme,
  name: 'Matrix',
  label: 'matrix',
  backgroundColor: '#0D0D0D',
  cardBackgroundColor: '#1A1A1A',
  tintColor: '#33FF57',
  tintTextColor: '#0D0D0D',
  tabBarActiveTintColor: '#33FF57',
  tabBarInactiveTintColor: 'rgba(51, 255, 87, 0.35)',
  borderColor: 'rgba(51, 255, 87, 0.2)',
  headingAccentColor: '#33FF57',
  blockquoteBorderColor: 'rgba(51, 255, 87, 0.3)',
  tableBorderColor: 'rgba(51, 255, 87, 0.2)',
  accentPalette: ['#33FF57'],
}

export {
  lightTheme, darkTheme, hackerNews, miami, vercel, cyberpunk, matrix
}
