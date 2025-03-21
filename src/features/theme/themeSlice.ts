import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppTheme, ThemeMode } from '@/types'

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system'
  
  const savedTheme = localStorage.getItem('themeMode') as ThemeMode | null
  if (savedTheme) return savedTheme
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const initialState: AppTheme = {
  mode: getInitialTheme(),
  color: localStorage.getItem('themeColor') || 'blue'
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload
      localStorage.setItem('themeMode', action.payload)
      
      // Apply theme to document
      if (action.payload === 'dark' || (action.payload === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    setThemeColor: (state, action: PayloadAction<string>) => {
      state.color = action.payload
      localStorage.setItem('themeColor', action.payload)
    }
  }
})

export const { setThemeMode, setThemeColor } = themeSlice.actions
export default themeSlice.reducer 