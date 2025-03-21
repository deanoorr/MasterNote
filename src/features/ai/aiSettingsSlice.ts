import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AISettings } from '@/types'

const getInitialState = (): AISettings => {
  const savedSettings = localStorage.getItem('aiSettings')
  if (savedSettings) {
    return JSON.parse(savedSettings) as AISettings
  }
  
  return {
    apiKey: '',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    features: {
      taskCategorization: true,
      prioritization: true,
      suggestions: true,
      reminders: true,
      reasoning: false
    }
  }
}

const aiSettingsSlice = createSlice({
  name: 'aiSettings',
  initialState: getInitialState(),
  reducers: {
    setApiKey: (state, action: PayloadAction<string>) => {
      state.apiKey = action.payload
      localStorage.setItem('aiSettings', JSON.stringify(state))
    },
    setProvider: (state, action: PayloadAction<AISettings['provider']>) => {
      state.provider = action.payload
      localStorage.setItem('aiSettings', JSON.stringify(state))
    },
    setModel: (state, action: PayloadAction<string>) => {
      state.model = action.payload
      localStorage.setItem('aiSettings', JSON.stringify(state))
    },
    setEndpoint: (state, action: PayloadAction<string | undefined>) => {
      state.endpoint = action.payload
      localStorage.setItem('aiSettings', JSON.stringify(state))
    },
    toggleFeature: (state, action: PayloadAction<keyof AISettings['features']>) => {
      const feature = action.payload
      state.features[feature] = !state.features[feature]
      localStorage.setItem('aiSettings', JSON.stringify(state))
    }
  }
})

export const { setApiKey, setProvider, setModel, setEndpoint, toggleFeature } = aiSettingsSlice.actions
export default aiSettingsSlice.reducer 