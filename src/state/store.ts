import { configureStore } from '@reduxjs/toolkit'
import tasksReducer from '@features/tasks/tasksSlice'
import projectsReducer from '@features/projects/projectsSlice'
import themeReducer from '@features/theme/themeSlice'
import aiSettingsReducer from '@features/aiSettings/aiSettingsSlice'

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    projects: projectsReducer,
    theme: themeReducer,
    aiSettings: aiSettingsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 