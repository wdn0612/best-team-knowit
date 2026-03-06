import { createContext } from 'react'
import { IThemeContext } from '../types'

const ThemeContext = createContext<IThemeContext>({
  theme: {},
  setTheme: () => null,
  themeName: ''
})

export {
  ThemeContext
}
