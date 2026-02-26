const colors = {
  white: '#fff',
  black: '#000',
  gray: 'rgba(0, 0, 0, .5)',
  lightWhite: 'rgba(255, 255, 255, .5)',
  blueTintColor: '#0281ff',
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
  backgroundColor: colors.white,
  placeholderTextColor: colors.gray,
  secondaryBackgroundColor: colors.black,
  borderColor: 'rgba(0, 0, 0, .15)',
  tintColor: '#0281ff',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.black,
  tabBarInactiveTintColor: colors.gray,
  cardBackgroundColor: 'rgba(0, 0, 0, 0.05)',
  blockquoteBackgroundColor: 'rgba(0, 0, 0, 0.04)',
  blockquoteBorderColor: 'rgba(0, 0, 0, 0.25)',
  codeBackgroundColor: colors.black,
  codeBorderColor: 'rgba(0, 0, 0, .15)',
  dividerColor: 'rgba(0, 0, 0, .12)',
  tableBorderColor: 'rgba(0, 0, 0, .2)',
  headingAccentColor: '#0281ff',
  accentPalette: ['#0281ff', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA'],
}

const darkTheme = {
  ...fonts,
  name: 'Dark',
  label: 'dark',
  textColor: colors.white,
  secondaryTextColor: colors.black,
  mutedForegroundColor: colors.lightWhite,
  backgroundColor: colors.black,
  placeholderTextColor: colors.lightWhite,
  secondaryBackgroundColor: colors.white,
  borderColor: 'rgba(255, 255, 255, .2)',
  tintColor: '#0281ff',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.blueTintColor,
  tabBarInactiveTintColor: colors.lightWhite,
  cardBackgroundColor: 'rgba(255, 255, 255, 0.08)',
  blockquoteBackgroundColor: 'rgba(255, 255, 255, 0.06)',
  blockquoteBorderColor: 'rgba(255, 255, 255, 0.3)',
  codeBackgroundColor: colors.white,
  codeBorderColor: 'rgba(255, 255, 255, .15)',
  dividerColor: 'rgba(255, 255, 255, .12)',
  tableBorderColor: 'rgba(255, 255, 255, .2)',
  headingAccentColor: '#0281ff',
  accentPalette: ['#0281ff', '#FF6B9D', '#00D4AA', '#FFD93D', '#C084FC'],
}

const hackerNews = {
  ...lightTheme,
  name: 'Hacker News',
  label: 'hackerNews',
  backgroundColor: '#e4e4e4',
  tintColor: '#ed702d',
  headingAccentColor: '#ed702d',
  accentPalette: ['#ed702d', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA'],
}

const miami = {
  ...darkTheme,
  name: 'Miami',
  label: 'miami',
  backgroundColor: '#231F20',
  tintColor: colors.lightPink,
  tintTextColor: '#231F20',
  tabBarActiveTintColor: colors.lightPink,
  headingAccentColor: colors.lightPink,
  accentPalette: [colors.lightPink, '#FF6B9D', '#00D4AA', '#FFD93D', '#C084FC'],
}

const vercel = {
  ...darkTheme,
  name: 'Vercel',
  label: 'vercel',
  backgroundColor: colors.black,
  tintColor: '#171717',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.white,
  secondaryTextColor: colors.white,
  headingAccentColor: '#171717',
  accentPalette: ['#171717', '#FF6B9D', '#00D4AA', '#FFD93D', '#C084FC'],
}

const cyberpunk = {
  ...darkTheme,
  name: 'Cyberpunk',
  label: 'cyberpunk',
  backgroundColor: colors.cyberpunkDark,
  tintColor: colors.neonCyan,
  tintTextColor: colors.cyberpunkDark,
  tabBarActiveTintColor: colors.neonCyan,
  tabBarInactiveTintColor: colors.neonMagenta,
  borderColor: 'rgba(0, 240, 255, .3)',
  headingAccentColor: colors.neonCyan,
  blockquoteBorderColor: 'rgba(0, 240, 255, .4)',
  tableBorderColor: 'rgba(0, 240, 255, .3)',
  accentPalette: [colors.neonCyan, colors.neonMagenta, '#00D4AA', '#FFD93D', '#C084FC'],
}

const matrix = {
  ...darkTheme,
  name: 'Matrix',
  label: 'matrix',
  backgroundColor: colors.matrixBlack,
  tintColor: colors.matrixGreen,
  tintTextColor: colors.matrixBlack,
  tabBarActiveTintColor: colors.matrixGreen,
  tabBarInactiveTintColor: colors.matrixDarkGreen,
  borderColor: 'rgba(0, 255, 65, .3)',
  headingAccentColor: colors.matrixGreen,
  blockquoteBorderColor: 'rgba(0, 255, 65, .4)',
  tableBorderColor: 'rgba(0, 255, 65, .3)',
  accentPalette: [colors.matrixGreen, colors.matrixDarkGreen, '#00D4AA', '#FFD93D', '#C084FC'],
}

export {
  lightTheme, darkTheme, hackerNews, miami, vercel, cyberpunk, matrix
}
