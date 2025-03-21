import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AISettings } from '@/types';

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  CUSTOM = 'custom',
}

// Initial state with default values
const initialState: AISettings = {
  apiKey: localStorage.getItem('aiApiKey') || '',
  provider: (localStorage.getItem('aiProvider') as AIProvider) || AIProvider.OPENAI,
  model: localStorage.getItem('aiModel') || '',
  endpoint: localStorage.getItem('aiEndpoint') || '',
  features: {
    taskCategorization: localStorage.getItem('aiFeatureTaskCategorization') === 'true' || false,
    prioritization: localStorage.getItem('aiFeaturePrioritization') === 'true' || false,
    suggestions: localStorage.getItem('aiFeatureSuggestions') === 'true' || false,
    reminders: localStorage.getItem('aiFeatureReminders') === 'true' || false,
    reasoning: localStorage.getItem('aiFeatureReasoning') === 'true' || false,
    taskCreation: localStorage.getItem('aiFeatureTaskCreation') === 'true' || false,
  },
};

const aiSettingsSlice = createSlice({
  name: 'aiSettings',
  initialState,
  reducers: {
    updateAISettings: (state, action: PayloadAction<Partial<Omit<AISettings, 'features'>>>) => {
      const { apiKey, provider, model, endpoint } = action.payload;
      
      if (apiKey !== undefined) {
        state.apiKey = apiKey;
        localStorage.setItem('aiApiKey', apiKey);
      }
      
      if (provider !== undefined) {
        state.provider = provider;
        localStorage.setItem('aiProvider', provider);
      }
      
      if (model !== undefined) {
        state.model = model;
        localStorage.setItem('aiModel', model);
      }
      
      if (endpoint !== undefined) {
        state.endpoint = endpoint;
        localStorage.setItem('aiEndpoint', endpoint);
      }
    },
    
    toggleFeature: (state, action: PayloadAction<keyof AISettings['features']>) => {
      const feature = action.payload;
      state.features[feature] = !state.features[feature];
      localStorage.setItem(`aiFeature${feature.charAt(0).toUpperCase() + feature.slice(1)}`, String(state.features[feature]));
    },
    
    resetAISettings: (state) => {
      state.apiKey = '';
      state.provider = AIProvider.OPENAI;
      state.model = '';
      state.endpoint = '';
      
      localStorage.removeItem('aiApiKey');
      localStorage.removeItem('aiProvider');
      localStorage.removeItem('aiModel');
      localStorage.removeItem('aiEndpoint');
      
      // Reset features
      Object.keys(state.features).forEach(key => {
        const feature = key as keyof AISettings['features'];
        state.features[feature] = false;
        localStorage.removeItem(`aiFeature${feature.charAt(0).toUpperCase() + feature.slice(1)}`);
      });
    }
  },
});

export const { updateAISettings, toggleFeature, resetAISettings } = aiSettingsSlice.actions;
export default aiSettingsSlice.reducer; 