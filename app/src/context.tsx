import { createContext } from 'react'
import { IMAGE_MODELS } from '../constants'
import { IThemeContext, IAppContext } from '../types'

const ThemeContext = createContext<IThemeContext>({
  theme: {},
  setTheme: () => null,
  themeName: ''
})

const AppContext = createContext<IAppContext>({
  imageModel: IMAGE_MODELS.nanoBanana.label,
  setImageModel: () => null,
})

export {
  ThemeContext, AppContext
}
